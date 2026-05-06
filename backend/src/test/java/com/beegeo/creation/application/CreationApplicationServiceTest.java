package com.beegeo.creation.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import com.beegeo.creation.domain.CreationEntity;
import com.beegeo.creation.domain.CreationStatus;
import com.beegeo.creation.domain.CreationView;
import com.beegeo.creation.repository.CreationRepository;
import com.beegeo.publish.application.PublishTaskApplicationService;
import com.beegeo.publish.domain.PublishStatus;
import com.beegeo.publish.domain.PublishTaskCommand;
import com.beegeo.publish.domain.PublishTaskView;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CreationApplicationServiceTest {
    private final CreationRepository creationRepository = mock(CreationRepository.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final PublishTaskApplicationService publishTaskApplicationService = mock(PublishTaskApplicationService.class);
    private final CreationApplicationService service = new CreationApplicationService(
        creationRepository,
        auditEventPublisher,
        publishTaskApplicationService
    );

    @Test
    void shouldCreateDraftAndWriteAudit() {
        when(creationRepository.save(any(CreationEntity.class))).thenAnswer(invocation -> {
            CreationEntity entity = invocation.getArgument(0);
            setBaseField(entity, "id", 11L);
            return entity;
        });

        CreationView view = service.createDraft(5L, "标题", "BeeWorks", "自有站点", "摘要", "正文");

        assertEquals(11L, view.id());
        assertEquals(5L, view.geoTaskId());
        assertEquals(CreationStatus.DRAFT, view.status());
        verify(auditEventPublisher).publish("creation", "createDraft", "11", "system", true);
    }

    @Test
    void shouldSubmitReviewApproveAndSchedulePublish() {
        CreationEntity entity = creation(21L);
        when(creationRepository.findById(21L)).thenReturn(Optional.of(entity));
        LocalDateTime scheduledAt = LocalDateTime.of(2026, 4, 30, 18, 0);
        when(publishTaskApplicationService.create(any(PublishTaskCommand.class))).thenReturn(new PublishTaskView(
            100L,
            21L,
            "内容标题",
            "自有站点",
            "OWNED_SITE",
            "主站账号",
            "site-main",
            scheduledAt,
            PublishStatus.SCHEDULED,
            0,
            3,
            "等待发布",
            null,
            null,
            null,
            null
        ));

        assertEquals(CreationStatus.PENDING_REVIEW, service.submitReview(21L).status());
        assertEquals(CreationStatus.APPROVED, service.approve(21L).status());
        service.schedulePublish(21L, new CreationPublishCommand("OWNED_SITE", "site-main", scheduledAt, 3));

        assertEquals(CreationStatus.SCHEDULED, entity.getStatus());
        assertEquals(scheduledAt, entity.getPublishAt());

        ArgumentCaptor<PublishTaskCommand> commandCaptor = ArgumentCaptor.forClass(PublishTaskCommand.class);
        verify(publishTaskApplicationService).create(commandCaptor.capture());
        assertEquals(21L, commandCaptor.getValue().contentId());
        assertEquals("内容标题", commandCaptor.getValue().title());
        assertEquals("OWNED_SITE", commandCaptor.getValue().platformCode());
        verify(auditEventPublisher).publish("creation", "submitReview", "21", "system", true);
        verify(auditEventPublisher).publish("creation", "approve", "21", "system", true);
        verify(auditEventPublisher).publish("creation", "schedulePublish", "21", "system", true);
    }

    @Test
    void shouldRejectSchedulePublishWhenCreationIsNotApproved() {
        CreationEntity entity = creation(31L);
        when(creationRepository.findById(31L)).thenReturn(Optional.of(entity));

        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> service.schedulePublish(31L, new CreationPublishCommand("OWNED_SITE", "site-main", LocalDateTime.now(), 3))
        );

        assertEquals("CREATION_NOT_APPROVED", exception.code());
    }

    private CreationEntity creation(Long id) {
        CreationEntity entity = new CreationEntity(5L, "内容标题", "BeeWorks", "自有站点", "摘要", "正文");
        setBaseField(entity, "id", id);
        return entity;
    }

    private void setBaseField(CreationEntity entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置创作实体基础字段失败", ex);
        }
    }
}
