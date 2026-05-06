package com.beegeo.auth.application;

import com.beegeo.auth.domain.AppUserEntity;
import com.beegeo.auth.domain.UserRole;
import com.beegeo.auth.repository.AppUserRepository;
import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserApplicationService {
    private final AppUserRepository appUserRepository;
    private final AuditEventPublisher auditEventPublisher;

    public UserApplicationService(AppUserRepository appUserRepository, AuditEventPublisher auditEventPublisher) {
        this.appUserRepository = appUserRepository;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Transactional(readOnly = true)
    public List<AppUserEntity> list(String keyword) {
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        if (keyword == null || keyword.isBlank()) {
            return appUserRepository.findAll(sort);
        }
        String query = keyword.trim();
        return appUserRepository.findByNameContainingIgnoreCaseOrAccountContainingIgnoreCase(query, query, sort);
    }

    @Transactional(readOnly = true)
    public AppUserEntity detail(Long id) {
        return findUser(id);
    }

    @Transactional
    public AppUserEntity create(UserCommand command) {
        String account = command.account().trim();
        appUserRepository.findByAccount(account).ifPresent(existing -> {
            throw new BusinessException("USER_ACCOUNT_EXISTS", "用户账号已存在");
        });
        UserRole role = UserRole.fromCode(command.roleCode().trim());
        AppUserEntity entity = new AppUserEntity(
            command.name().trim(),
            account,
            role.code(),
            role.displayName(),
            normalizeStatus(command.status())
        );
        AppUserEntity saved = appUserRepository.save(entity);
        auditEventPublisher.publish("user", "create", String.valueOf(saved.getId()), "system", true);
        return saved;
    }

    @Transactional
    public AppUserEntity update(Long id, UserCommand command) {
        AppUserEntity entity = findUser(id);
        String account = command.account().trim();
        appUserRepository.findByAccount(account)
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new BusinessException("USER_ACCOUNT_EXISTS", "用户账号已存在");
            });
        UserRole role = UserRole.fromCode(command.roleCode().trim());
        entity.update(
            command.name().trim(),
            account,
            role.code(),
            role.displayName(),
            normalizeStatus(command.status())
        );
        auditEventPublisher.publish("user", "update", String.valueOf(id), "system", true);
        return entity;
    }

    @Transactional
    public void delete(Long id) {
        AppUserEntity entity = findUser(id);
        appUserRepository.delete(entity);
        auditEventPublisher.publish("user", "delete", String.valueOf(id), "system", true);
    }

    private AppUserEntity findUser(Long id) {
        return appUserRepository.findById(id)
            .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "用户不存在"));
    }

    private String normalizeStatus(String status) {
        return status == null || status.isBlank() ? "启用" : status.trim();
    }
}
