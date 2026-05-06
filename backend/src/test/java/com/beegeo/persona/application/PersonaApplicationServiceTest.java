package com.beegeo.persona.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import com.beegeo.persona.domain.PersonaEntity;
import com.beegeo.persona.repository.PersonaRepository;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PersonaApplicationServiceTest {
    private final PersonaRepository personaRepository = mock(PersonaRepository.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final PersonaApplicationService service = new PersonaApplicationService(personaRepository, auditEventPublisher);

    @Test
    void shouldCreatePersonaWithTrimmedFieldsDefaultStatusAndAudit() {
        when(personaRepository.save(any(PersonaEntity.class))).thenAnswer(invocation -> {
            PersonaEntity entity = invocation.getArgument(0);
            setBaseField(entity, "id", 501L);
            return entity;
        });

        PersonaEntity saved = service.create(new PersonaCommand(" 品牌顾问 ", " 系统 ", " 内容顾问 ", "  ", " ", "  "));

        assertEquals(501L, saved.getId());
        assertEquals("品牌顾问", saved.getName());
        assertEquals("系统", saved.getCreator());
        assertEquals("内容顾问", saved.getRoleName());
        assertNull(saved.getTone());
        assertEquals("启用", saved.getStatus());
        assertNull(saved.getPromptTemplate());
        verify(auditEventPublisher).publish("persona", "create", "501", "system", true);
    }

    @Test
    void shouldUpdateAndDeletePersonaWithAudit() {
        PersonaEntity entity = new PersonaEntity("旧人设", "旧作者", "旧角色", "旧语气", "启用", "旧模板");
        setBaseField(entity, "id", 502L);
        when(personaRepository.findById(502L)).thenReturn(Optional.of(entity));

        PersonaEntity updated = service.update(502L, new PersonaCommand(" 新人设 ", " 新作者 ", " 新角色 ", " 专业 ", " 停用 ", " 新模板 "));
        service.delete(502L);

        assertEquals("新人设", updated.getName());
        assertEquals("新作者", updated.getCreator());
        assertEquals("新角色", updated.getRoleName());
        assertEquals("专业", updated.getTone());
        assertEquals("停用", updated.getStatus());
        assertEquals("新模板", updated.getPromptTemplate());
        ArgumentCaptor<PersonaEntity> deleteCaptor = ArgumentCaptor.forClass(PersonaEntity.class);
        verify(personaRepository).delete(deleteCaptor.capture());
        assertEquals(502L, deleteCaptor.getValue().getId());
        verify(auditEventPublisher).publish("persona", "update", "502", "system", true);
        verify(auditEventPublisher).publish("persona", "delete", "502", "system", true);
    }

    private void setBaseField(PersonaEntity entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置人设测试实体基础字段失败", ex);
        }
    }
}
