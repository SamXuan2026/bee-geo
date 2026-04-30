package com.beegeo.common.audit;

import java.util.List;
import org.springframework.data.domain.Sort;
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
}
