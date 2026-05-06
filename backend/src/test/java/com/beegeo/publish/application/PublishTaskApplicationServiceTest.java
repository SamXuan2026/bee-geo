package com.beegeo.publish.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import com.beegeo.integration.port.CredentialPort;
import com.beegeo.publish.domain.PublishAccountEntity;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.domain.PublishReceipt;
import com.beegeo.publish.domain.PublishReceiptEntity;
import com.beegeo.publish.domain.PublishStatus;
import com.beegeo.publish.domain.PublishTaskCommand;
import com.beegeo.publish.domain.PublishTaskEntity;
import com.beegeo.publish.domain.PublishTaskView;
import com.beegeo.publish.port.PublishAdapter;
import com.beegeo.publish.repository.PublishAccountRepository;
import com.beegeo.publish.repository.PublishReceiptRepository;
import com.beegeo.publish.repository.PublishTaskRepository;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PublishTaskApplicationServiceTest {
    private final PublishAdapter adapter = mock(PublishAdapter.class);
    private final CredentialPort credentialPort = mock(CredentialPort.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final PublishTaskRepository taskRepository = mock(PublishTaskRepository.class);
    private final PublishAccountRepository accountRepository = mock(PublishAccountRepository.class);
    private final PublishReceiptRepository receiptRepository = mock(PublishReceiptRepository.class);
    private final PublishTaskApplicationService service = new PublishTaskApplicationService(
        List.of(adapter),
        credentialPort,
        auditEventPublisher,
        taskRepository,
        accountRepository,
        receiptRepository,
        300
    );

    @Test
    void shouldCreateScheduledTaskWithTrimmedContentAndClampedRetryCount() {
        PublishAccountEntity account = account("site-main", "OWNED_SITE", "自有站点", "主站账号", "VALID");
        when(accountRepository.findByAccountIdAndPlatformCode("site-main", "OWNED_SITE")).thenReturn(Optional.of(account));
        when(taskRepository.save(any(PublishTaskEntity.class))).thenAnswer(invocation -> {
            PublishTaskEntity task = invocation.getArgument(0);
            setBaseField(task, "id", 10L);
            return task;
        });

        PublishTaskView view = service.create(new PublishTaskCommand(
            8L,
            "  企业协同平台发布  ",
            "  正文内容  ",
            "OWNED_SITE",
            "site-main",
            LocalDateTime.of(2026, 4, 30, 16, 0),
            99
        ));

        assertEquals(10L, view.id());
        assertEquals("企业协同平台发布", view.title());
        assertEquals(PublishStatus.SCHEDULED, view.status());
        assertEquals(10, view.maxRetryCount());
        assertEquals("等待发布", view.receipt());

        ArgumentCaptor<PublishTaskEntity> taskCaptor = ArgumentCaptor.forClass(PublishTaskEntity.class);
        verify(taskRepository).save(taskCaptor.capture());
        assertEquals("正文内容", taskCaptor.getValue().getBody());
        verify(auditEventPublisher).publish("publish", "createTask", "10", "system", true);
    }

    @Test
    void shouldRetryTaskAndPersistSuccessfulReceipt() {
        PublishAccountEntity account = account("site-main", "OWNED_SITE", "自有站点", "主站账号", "VALID");
        PublishTaskEntity task = task(account, 20L, 3);
        PublishCredential credential = new PublishCredential("site-main", "OWNED_SITE", "secret");
        PublishReceipt receipt = new PublishReceipt(true, "ext-20", "https://site.local/a/20", "发布成功", LocalDateTime.of(2026, 4, 30, 16, 30));

        when(taskRepository.findById(20L)).thenReturn(Optional.of(task));
        when(accountRepository.findByAccountIdAndPlatformCode("site-main", "OWNED_SITE")).thenReturn(Optional.of(account));
        when(adapter.platformCode()).thenReturn("OWNED_SITE");
        when(credentialPort.loadPlainForPublish("site-main", "OWNED_SITE")).thenReturn(credential);
        when(adapter.validateCredential(credential)).thenReturn(true);
        when(adapter.publish(any(), any())).thenReturn(receipt);

        PublishReceipt result = service.retry(20L);

        assertTrue(result.success());
        assertEquals(PublishStatus.PUBLISHED, task.getStatus());
        assertEquals("ext-20", task.getExternalPublishId());
        assertEquals("https://site.local/a/20", task.getPublishUrl());

        ArgumentCaptor<PublishReceiptEntity> receiptCaptor = ArgumentCaptor.forClass(PublishReceiptEntity.class);
        verify(receiptRepository).save(receiptCaptor.capture());
        assertEquals(20L, receiptCaptor.getValue().getTaskId());
        assertEquals(0, receiptCaptor.getValue().getAttemptNo());
        assertTrue(receiptCaptor.getValue().getSuccess());
        verify(auditEventPublisher).publish("publish", "publish", "20", "system", true);
    }

    @Test
    void shouldMoveToManualRequiredWhenRetryLimitReached() {
        PublishAccountEntity account = account("site-main", "OWNED_SITE", "自有站点", "主站账号", "VALID");
        PublishTaskEntity task = task(account, 30L, 0);
        when(taskRepository.findById(30L)).thenReturn(Optional.of(task));

        PublishReceipt result = service.retry(30L);

        assertFalse(result.success());
        assertEquals(PublishStatus.MANUAL_REQUIRED, task.getStatus());
        assertEquals("超过最大重试次数，已转人工介入", task.getLastReceiptMessage());

        ArgumentCaptor<PublishReceiptEntity> receiptCaptor = ArgumentCaptor.forClass(PublishReceiptEntity.class);
        verify(receiptRepository).save(receiptCaptor.capture());
        assertEquals(30L, receiptCaptor.getValue().getTaskId());
        assertEquals(0, receiptCaptor.getValue().getAttemptNo());
        assertFalse(receiptCaptor.getValue().getSuccess());
        verify(adapter, never()).publish(any(), any());
        verify(auditEventPublisher).publish("publish", "retry", "30", "system", false);
    }

    private PublishTaskEntity task(PublishAccountEntity account, Long id, Integer maxRetryCount) {
        PublishTaskEntity task = new PublishTaskEntity(
            1L,
            "发布标题",
            "发布正文",
            account,
            LocalDateTime.of(2026, 4, 30, 16, 0),
            maxRetryCount
        );
        setBaseField(task, "id", id);
        return task;
    }

    private PublishAccountEntity account(String accountId, String platformCode, String platformName, String name, String status) {
        PublishAccountEntity account = instantiate(PublishAccountEntity.class);
        setField(account, "accountId", accountId);
        setField(account, "platformCode", platformCode);
        setField(account, "platformName", platformName);
        setField(account, "name", name);
        setField(account, "endpoint", "https://site.local");
        setField(account, "status", status);
        return account;
    }

    private <T> T instantiate(Class<T> type) {
        try {
            Constructor<T> constructor = type.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("创建测试实体失败", ex);
        }
    }

    private void setBaseField(Object target, String fieldName, Object value) {
        setField(BaseEntity.class, target, fieldName, value);
    }

    private void setField(Object target, String fieldName, Object value) {
        setField(target.getClass(), target, fieldName, value);
    }

    private void setField(Class<?> type, Object target, String fieldName, Object value) {
        try {
            Field field = type.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置测试字段失败", ex);
        }
    }
}
