package com.beegeo.common.audit;

import com.beegeo.common.api.PageResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogApplicationService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogApplicationService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLogView> list(String keyword) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        List<AuditLogEntity> logs;
        if (keyword == null || keyword.isBlank()) {
            logs = auditLogRepository.findAll(sort);
        } else {
            String query = keyword.trim();
            logs = auditLogRepository.findByModuleContainingIgnoreCaseOrActionContainingIgnoreCaseOrOperatorAccountContainingIgnoreCase(query, query, query, sort);
        }
        return logs.stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogView> page(String keyword, Boolean success, LocalDate startDate, LocalDate endDate, int page, int pageSize) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        Pageable pageable = PageRequest.of(safePage - 1, safePageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogEntity> result = auditLogRepository.findAll(buildSpec(keyword, success, startDate, endDate), pageable);
        return new PageResponse<>(
            result.getContent().stream().map(this::toView).toList(),
            result.getTotalElements(),
            safePage,
            safePageSize,
            result.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public AuditExportView export(String keyword, Boolean success, LocalDate startDate, LocalDate endDate) {
        List<AuditLogView> items = auditLogRepository
            .findAll(buildSpec(keyword, success, startDate, endDate), Sort.by(Sort.Direction.DESC, "createdAt"))
            .stream()
            .map(this::toView)
            .toList();
        StringBuilder builder = new StringBuilder();
        builder.append("模块,动作,对象编号,操作账号,操作人,角色,客户端IP,请求地址,结果,时间\n");
        items.forEach(item -> builder
            .append(csv(item.module())).append(',')
            .append(csv(item.action())).append(',')
            .append(csv(item.targetId())).append(',')
            .append(csv(item.operatorAccount())).append(',')
            .append(csv(item.operatorName())).append(',')
            .append(csv(item.operatorRole())).append(',')
            .append(csv(item.clientIp())).append(',')
            .append(csv(item.requestUri())).append(',')
            .append(csv(Boolean.TRUE.equals(item.success()) ? "成功" : "失败")).append(',')
            .append(csv(item.createdAt() == null ? "" : item.createdAt().toString()))
            .append('\n')
        );
        String fileName = "audit-logs-" + LocalDate.now() + ".csv";
        return new AuditExportView(fileName, "text/csv;charset=utf-8", builder.toString());
    }

    private Specification<AuditLogEntity> buildSpec(String keyword, Boolean success, LocalDate startDate, LocalDate endDate) {
        return (root, query, builder) -> {
            var predicate = builder.conjunction();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                var keywordPredicate = builder.or(
                    builder.like(builder.lower(root.get("module")), pattern),
                    builder.like(builder.lower(root.get("action")), pattern),
                    builder.like(builder.lower(root.get("operatorAccount")), pattern),
                    builder.like(builder.lower(root.get("operatorName")), pattern),
                    builder.like(builder.lower(root.get("requestUri")), pattern)
                );
                predicate = builder.and(predicate, keywordPredicate);
            }
            if (success != null) {
                predicate = builder.and(predicate, builder.equal(root.get("success"), success));
            }
            if (startDate != null) {
                LocalDateTime startAt = startDate.atStartOfDay();
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("createdAt"), startAt));
            }
            if (endDate != null) {
                LocalDateTime endAt = endDate.plusDays(1).atStartOfDay();
                predicate = builder.and(predicate, builder.lessThan(root.get("createdAt"), endAt));
            }
            return predicate;
        };
    }

    private AuditLogView toView(AuditLogEntity entity) {
        return new AuditLogView(
            entity.getId(),
            entity.getModule(),
            entity.getAction(),
            entity.getTargetId(),
            entity.getOperatorAccount(),
            entity.getOperatorName(),
            entity.getOperatorRole(),
            entity.getClientIp(),
            entity.getRequestUri(),
            entity.getSuccess(),
            entity.getCreatedAt()
        );
    }

    private String csv(String value) {
        String normalized = value == null ? "" : value;
        return "\"" + normalized.replace("\"", "\"\"") + "\"";
    }
}
