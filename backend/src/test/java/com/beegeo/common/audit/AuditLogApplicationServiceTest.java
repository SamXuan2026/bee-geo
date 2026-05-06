package com.beegeo.common.audit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.api.PageResponse;
import com.beegeo.common.persistence.BaseEntity;
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@SuppressWarnings("unchecked")
class AuditLogApplicationServiceTest {
    private final AuditLogRepository repository = mock(AuditLogRepository.class);
    private final AuditLogApplicationService service = new AuditLogApplicationService(repository);

    @Test
    void shouldClampPageQueryAndReturnPageResponse() {
        AuditLogEntity entity = auditLog("发布中心", "重试发布", "admin", true, LocalDateTime.of(2026, 4, 30, 9, 10));
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(entity), PageRequest.of(0, 100), 126));

        PageResponse<AuditLogView> response = service.page(" 发布 ", true, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30), 0, 200);

        assertEquals(1, response.items().size());
        assertEquals(126, response.total());
        assertEquals(1, response.page());
        assertEquals(100, response.pageSize());
        assertEquals(2, response.totalPages());
        assertEquals("发布中心", response.items().get(0).module());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        assertEquals(0, pageable.getPageNumber());
        assertEquals(100, pageable.getPageSize());
        assertEquals(Sort.Direction.DESC, pageable.getSort().getOrderFor("createdAt").getDirection());
    }

    @Test
    void shouldExportCsvWithHeaderAndEscapedValues() {
        AuditLogEntity entity = auditLog("AI 创作", "保存\"草稿\"", "editor", false, LocalDateTime.of(2026, 4, 30, 10, 20));
        when(repository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(entity));

        AuditExportView export = service.export("草稿", false, null, null);

        assertTrue(export.fileName().startsWith("audit-logs-"));
        assertEquals("text/csv;charset=utf-8", export.contentType());
        assertTrue(export.content().startsWith("模块,动作,对象编号,操作账号,操作人,角色,客户端IP,请求地址,结果,时间\n"));
        assertTrue(export.content().contains("\"AI 创作\",\"保存\"\"草稿\"\"\",\"target-1\",\"editor\""));
        assertTrue(export.content().contains("\"失败\",\"2026-04-30T10:20\""));

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(repository).findAll(any(Specification.class), sortCaptor.capture());
        assertEquals(Sort.Direction.DESC, sortCaptor.getValue().getOrderFor("createdAt").getDirection());
    }

    private AuditLogEntity auditLog(String module, String action, String account, Boolean success, LocalDateTime createdAt) {
        AuditLogEntity entity = new AuditLogEntity(
            module,
            action,
            "target-1",
            account,
            "系统管理员",
            "SUPER_ADMIN",
            "127.0.0.1",
            "/api/audit/logs",
            success
        );
        setBaseField(entity, "id", 1L);
        setBaseField(entity, "createdAt", createdAt);
        setBaseField(entity, "updatedAt", createdAt);
        return entity;
    }

    private void setBaseField(AuditLogEntity entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置审计实体基础字段失败", ex);
        }
    }
}
