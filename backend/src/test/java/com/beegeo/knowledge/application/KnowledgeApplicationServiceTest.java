package com.beegeo.knowledge.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import com.beegeo.knowledge.domain.KnowledgeEntity;
import com.beegeo.knowledge.repository.KnowledgeRepository;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class KnowledgeApplicationServiceTest {
    private final KnowledgeRepository knowledgeRepository = mock(KnowledgeRepository.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final KnowledgeApplicationService service = new KnowledgeApplicationService(knowledgeRepository, auditEventPublisher);

    @Test
    void shouldCreateKnowledgeWithTrimmedFieldsAndAudit() {
        when(knowledgeRepository.save(any(KnowledgeEntity.class))).thenAnswer(invocation -> {
            KnowledgeEntity entity = invocation.getArgument(0);
            setBaseField(entity, "id", 201L);
            return entity;
        });

        KnowledgeEntity saved = service.create(new KnowledgeCommand(" 产品手册 ", " md ", " 私有化 ", "  ", null));

        assertEquals(201L, saved.getId());
        assertEquals("产品手册", saved.getName());
        assertEquals("md", saved.getType());
        assertEquals("私有化", saved.getGroupName());
        assertNull(saved.getContent());
        assertTrue(saved.getEnabled());
        verify(auditEventPublisher).publish("knowledge", "create", "201", "system", true);
    }

    @Test
    void shouldUpdateAndDeleteKnowledgeWithAudit() {
        KnowledgeEntity entity = new KnowledgeEntity("旧文档", "txt", "旧分组", "旧内容", true);
        setBaseField(entity, "id", 202L);
        when(knowledgeRepository.findById(202L)).thenReturn(Optional.of(entity));

        KnowledgeEntity updated = service.update(202L, new KnowledgeCommand(" 新文档 ", " md ", " 新分组 ", "  ", null));
        service.delete(202L);

        assertEquals("新文档", updated.getName());
        assertEquals("md", updated.getType());
        assertEquals("新分组", updated.getGroupName());
        assertNull(updated.getContent());
        assertTrue(updated.getEnabled());
        ArgumentCaptor<KnowledgeEntity> deleteCaptor = ArgumentCaptor.forClass(KnowledgeEntity.class);
        verify(knowledgeRepository).delete(deleteCaptor.capture());
        assertEquals(202L, deleteCaptor.getValue().getId());
        verify(auditEventPublisher).publish("knowledge", "update", "202", "system", true);
        verify(auditEventPublisher).publish("knowledge", "delete", "202", "system", true);
    }

    private void setBaseField(KnowledgeEntity entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置知识库测试实体基础字段失败", ex);
        }
    }
}
