package com.beegeo.asset.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.asset.domain.AssetEntity;
import com.beegeo.asset.repository.AssetRepository;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.persistence.BaseEntity;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class AssetApplicationServiceTest {
    private final AssetRepository assetRepository = mock(AssetRepository.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final AssetApplicationService service = new AssetApplicationService(assetRepository, auditEventPublisher);

    @Test
    void shouldCreateAssetWithTrimmedFieldsAndAudit() {
        when(assetRepository.save(any(AssetEntity.class))).thenAnswer(invocation -> {
            AssetEntity entity = invocation.getArgument(0);
            setBaseField(entity, "id", 301L);
            return entity;
        });

        AssetEntity saved = service.create(new AssetCommand(" 产品图 ", " 图片 ", " 品牌 ", "  ", null));

        assertEquals(301L, saved.getId());
        assertEquals("产品图", saved.getName());
        assertEquals("图片", saved.getType());
        assertEquals("品牌", saved.getTag());
        assertNull(saved.getStorageUrl());
        assertTrue(saved.getEnabled());
        verify(auditEventPublisher).publish("asset", "create", "301", "system", true);
    }

    @Test
    void shouldUpdateAndDeleteAssetWithAudit() {
        AssetEntity entity = new AssetEntity("旧素材", "图片", "旧标签", "https://old.local", true);
        setBaseField(entity, "id", 302L);
        when(assetRepository.findById(302L)).thenReturn(Optional.of(entity));

        AssetEntity updated = service.update(302L, new AssetCommand(" 新素材 ", " 文档 ", " 新标签 ", "  ", null));
        service.delete(302L);

        assertEquals("新素材", updated.getName());
        assertEquals("文档", updated.getType());
        assertEquals("新标签", updated.getTag());
        assertNull(updated.getStorageUrl());
        assertTrue(updated.getEnabled());
        ArgumentCaptor<AssetEntity> deleteCaptor = ArgumentCaptor.forClass(AssetEntity.class);
        verify(assetRepository).delete(deleteCaptor.capture());
        assertEquals(302L, deleteCaptor.getValue().getId());
        verify(auditEventPublisher).publish("asset", "update", "302", "system", true);
        verify(auditEventPublisher).publish("asset", "delete", "302", "system", true);
    }

    private void setBaseField(AssetEntity entity, String fieldName, Object value) {
        try {
            Field field = BaseEntity.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置素材测试实体基础字段失败", ex);
        }
    }
}
