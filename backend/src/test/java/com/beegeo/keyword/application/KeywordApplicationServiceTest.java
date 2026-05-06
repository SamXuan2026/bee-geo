package com.beegeo.keyword.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import com.beegeo.keyword.domain.KeywordEntity;
import com.beegeo.keyword.repository.KeywordRepository;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class KeywordApplicationServiceTest {
    private final KeywordRepository keywordRepository = mock(KeywordRepository.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final KeywordApplicationService service = new KeywordApplicationService(keywordRepository, auditEventPublisher);

    @Test
    void shouldCreateKeywordWithTrimmedFieldsAndAudit() {
        when(keywordRepository.save(any(KeywordEntity.class))).thenAnswer(invocation -> {
            KeywordEntity entity = invocation.getArgument(0);
            setBaseField(entity, "id", 101L);
            return entity;
        });

        KeywordEntity saved = service.create(new KeywordCommand(" 企业协同 ", " GEO ", "  ", null));

        assertEquals(101L, saved.getId());
        assertEquals("企业协同", saved.getName());
        assertEquals("GEO", saved.getGroupName());
        assertNull(saved.getDescription());
        assertTrue(saved.getEnabled());
        verify(auditEventPublisher).publish("keyword", "create", "101", "system", true);
    }

    @Test
    void shouldUpdateAndDeleteKeywordWithAudit() {
        KeywordEntity entity = new KeywordEntity("旧关键词", "旧分组", "旧描述", true);
        setBaseField(entity, "id", 102L);
        when(keywordRepository.findById(102L)).thenReturn(Optional.of(entity));

        KeywordEntity updated = service.update(102L, new KeywordCommand(" 新关键词 ", " 新分组 ", "  ", null));
        service.delete(102L);

        assertEquals("新关键词", updated.getName());
        assertEquals("新分组", updated.getGroupName());
        assertNull(updated.getDescription());
        assertTrue(updated.getEnabled());
        ArgumentCaptor<KeywordEntity> deleteCaptor = ArgumentCaptor.forClass(KeywordEntity.class);
        verify(keywordRepository).delete(deleteCaptor.capture());
        assertEquals(102L, deleteCaptor.getValue().getId());
        verify(auditEventPublisher).publish("keyword", "update", "102", "system", true);
        verify(auditEventPublisher).publish("keyword", "delete", "102", "system", true);
    }

    private void setBaseField(KeywordEntity entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置关键词测试实体基础字段失败", ex);
        }
    }
}
