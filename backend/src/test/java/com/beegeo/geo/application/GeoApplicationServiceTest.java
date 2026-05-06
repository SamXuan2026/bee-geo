package com.beegeo.geo.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.ai.AiProvider;
import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import com.beegeo.creation.application.CreationApplicationService;
import com.beegeo.creation.domain.CreationStatus;
import com.beegeo.creation.domain.CreationView;
import com.beegeo.geo.domain.GeoResultEntity;
import com.beegeo.geo.domain.GeoTaskEntity;
import com.beegeo.geo.domain.GeoTaskView;
import com.beegeo.geo.repository.GeoResultRepository;
import com.beegeo.geo.repository.GeoTaskRepository;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Sort;

class GeoApplicationServiceTest {
    private final GeoTaskRepository geoTaskRepository = mock(GeoTaskRepository.class);
    private final GeoResultRepository geoResultRepository = mock(GeoResultRepository.class);
    private final AiProvider aiProvider = mock(AiProvider.class);
    private final CreationApplicationService creationApplicationService = mock(CreationApplicationService.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final GeoApplicationService service = new GeoApplicationService(
        geoTaskRepository,
        geoResultRepository,
        aiProvider,
        creationApplicationService,
        auditEventPublisher
    );

    @Test
    void shouldCreateGeoTaskAndPersistGeneratedResults() {
        when(geoTaskRepository.save(any(GeoTaskEntity.class))).thenAnswer(invocation -> {
            GeoTaskEntity task = invocation.getArgument(0);
            setBaseField(task, "id", 41L);
            setBaseField(task, "createdAt", LocalDateTime.of(2026, 4, 30, 17, 0));
            return task;
        });
        when(aiProvider.generateGeoQuestions("企业协同平台")).thenReturn(List.of("问题一", "问题二"));
        when(geoResultRepository.findByTaskId(eq(41L), any(Sort.class))).thenReturn(List.of(
            result(1L, 41L, "企业协同平台", "问题一"),
            result(2L, 41L, "企业协同平台", "问题二")
        ));

        GeoTaskView view = service.createTask(" 企业协同平台 ");

        assertEquals(41L, view.id());
        assertEquals("企业协同平台", view.keyword());
        assertEquals("已完成", view.status());
        assertEquals(2, view.questions().size());

        ArgumentCaptor<GeoResultEntity> resultCaptor = ArgumentCaptor.forClass(GeoResultEntity.class);
        verify(geoResultRepository, org.mockito.Mockito.times(2)).save(resultCaptor.capture());
        assertEquals(41L, resultCaptor.getAllValues().get(0).getTaskId());
        assertEquals("问题一", resultCaptor.getAllValues().get(0).getQuestion());
        verify(auditEventPublisher).publish("geo", "createTask", "41", "system", true);
    }

    @Test
    void shouldCreateDraftFromGeoResults() {
        GeoTaskEntity task = new GeoTaskEntity("企业协同平台");
        setBaseField(task, "id", 51L);
        GeoResultEntity firstResult = result(1L, 51L, "企业协同平台", "如何私有化部署？");
        when(geoTaskRepository.findById(51L)).thenReturn(Optional.of(task));
        when(geoResultRepository.findByTaskId(eq(51L), any(Sort.class))).thenReturn(List.of(firstResult));
        when(aiProvider.generateArticle("企业协同平台", "品牌顾问")).thenReturn("生成正文");
        when(creationApplicationService.createDraft(any(), any(), any(), any(), any(), any())).thenReturn(new CreationView(
            61L,
            51L,
            firstResult.getAiTitle(),
            "BeeWorks",
            "自有站点",
            "摘要",
            "生成正文",
            null,
            CreationStatus.DRAFT
        ));

        CreationView draft = service.createDraft(51L);

        assertEquals(61L, draft.id());
        assertEquals(51L, draft.geoTaskId());

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(creationApplicationService).createDraft(
            eq(51L),
            eq(firstResult.getAiTitle()),
            eq("BeeWorks"),
            eq("自有站点"),
            eq("基于关键词「企业协同平台」和 1 条 GEO 结果生成的内容草稿。"),
            bodyCaptor.capture()
        );
        assertTrue(bodyCaptor.getValue().contains("参考问题："));
        assertTrue(bodyCaptor.getValue().contains("如何私有化部署？"));
        verify(auditEventPublisher).publish("geo", "createDraft", "51", "system", true);
    }

    @Test
    void shouldRejectCreateDraftWhenGeoResultIsEmpty() {
        GeoTaskEntity task = new GeoTaskEntity("企业协同平台");
        setBaseField(task, "id", 71L);
        when(geoTaskRepository.findById(71L)).thenReturn(Optional.of(task));
        when(geoResultRepository.findByTaskId(eq(71L), any(Sort.class))).thenReturn(List.of());

        BusinessException exception = assertThrows(BusinessException.class, () -> service.createDraft(71L));

        assertEquals("GEO_RESULT_EMPTY", exception.code());
    }

    private GeoResultEntity result(Long id, Long taskId, String keyword, String question) {
        GeoResultEntity result = new GeoResultEntity(
            taskId,
            keyword,
            question,
            keyword + " GEO 内容机会分析",
            "https://example.local/geo/" + taskId,
            "自有站点",
            "引用来源说明"
        );
        setBaseField(result, "id", id);
        return result;
    }

    private void setBaseField(Object entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置 GEO 测试实体基础字段失败", ex);
        }
    }
}
