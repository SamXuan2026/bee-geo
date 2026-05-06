package com.beegeo.auth.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.auth.domain.AppUserEntity;
import com.beegeo.auth.repository.AppUserRepository;
import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class UserApplicationServiceTest {
    private final AppUserRepository appUserRepository = mock(AppUserRepository.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final UserApplicationService service = new UserApplicationService(appUserRepository, auditEventPublisher);

    @Test
    void shouldCreateUserWithTrimmedFieldsDefaultStatusAndAudit() {
        when(appUserRepository.findByAccount("admin")).thenReturn(Optional.empty());
        when(appUserRepository.save(any(AppUserEntity.class))).thenAnswer(invocation -> {
            AppUserEntity entity = invocation.getArgument(0);
            setBaseField(entity, "id", 401L);
            return entity;
        });

        AppUserEntity saved = service.create(new UserCommand(" 管理员 ", " admin ", " SUPER_ADMIN ", " "));

        assertEquals(401L, saved.getId());
        assertEquals("管理员", saved.getName());
        assertEquals("admin", saved.getAccount());
        assertEquals("SUPER_ADMIN", saved.getRoleCode());
        assertEquals("超级管理员", saved.getRoleName());
        assertEquals("启用", saved.getStatus());
        verify(auditEventPublisher).publish("user", "create", "401", "system", true);
    }

    @Test
    void shouldRejectDuplicateAccountWhenCreateOrUpdate() {
        AppUserEntity existing = user(402L, "已存在", "admin");
        when(appUserRepository.findByAccount("admin")).thenReturn(Optional.of(existing));

        BusinessException createException = assertThrows(
            BusinessException.class,
            () -> service.create(new UserCommand("管理员", "admin", "SUPER_ADMIN", "启用"))
        );

        AppUserEntity target = user(403L, "目标用户", "target");
        when(appUserRepository.findById(403L)).thenReturn(Optional.of(target));
        BusinessException updateException = assertThrows(
            BusinessException.class,
            () -> service.update(403L, new UserCommand("目标用户", "admin", "CONTENT_ADMIN", "启用"))
        );

        assertEquals("USER_ACCOUNT_EXISTS", createException.code());
        assertEquals("USER_ACCOUNT_EXISTS", updateException.code());
    }

    @Test
    void shouldUpdateAndDeleteUserWithAudit() {
        AppUserEntity entity = user(404L, "旧用户", "old-account");
        when(appUserRepository.findById(404L)).thenReturn(Optional.of(entity));
        when(appUserRepository.findByAccount("new-account")).thenReturn(Optional.of(entity));

        AppUserEntity updated = service.update(404L, new UserCommand(" 新用户 ", " new-account ", " CONTENT_ADMIN ", " 停用 "));
        service.delete(404L);

        assertEquals("新用户", updated.getName());
        assertEquals("new-account", updated.getAccount());
        assertEquals("CONTENT_ADMIN", updated.getRoleCode());
        assertEquals("内容管理员", updated.getRoleName());
        assertEquals("停用", updated.getStatus());
        ArgumentCaptor<AppUserEntity> deleteCaptor = ArgumentCaptor.forClass(AppUserEntity.class);
        verify(appUserRepository).delete(deleteCaptor.capture());
        assertEquals(404L, deleteCaptor.getValue().getId());
        verify(auditEventPublisher).publish("user", "update", "404", "system", true);
        verify(auditEventPublisher).publish("user", "delete", "404", "system", true);
    }

    private AppUserEntity user(Long id, String name, String account) {
        AppUserEntity entity = new AppUserEntity(name, account, "SUPER_ADMIN", "超级管理员", "启用");
        setBaseField(entity, "id", id);
        return entity;
    }

    private void setBaseField(AppUserEntity entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置用户测试实体基础字段失败", ex);
        }
    }
}
