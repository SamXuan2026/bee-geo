package com.beegeo.asset.application;

import com.beegeo.asset.domain.AssetEntity;
import com.beegeo.asset.repository.AssetRepository;
import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetApplicationService {
    private final AssetRepository assetRepository;
    private final AuditEventPublisher auditEventPublisher;

    public AssetApplicationService(AssetRepository assetRepository, AuditEventPublisher auditEventPublisher) {
        this.assetRepository = assetRepository;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Transactional(readOnly = true)
    public List<AssetEntity> list(String keyword) {
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        if (keyword == null || keyword.isBlank()) {
            return assetRepository.findAll(sort);
        }
        String query = keyword.trim();
        return assetRepository.findByNameContainingIgnoreCaseOrTagContainingIgnoreCase(query, query, sort);
    }

    @Transactional(readOnly = true)
    public AssetEntity detail(Long id) {
        return findAsset(id);
    }

    @Transactional
    public AssetEntity create(AssetCommand command) {
        AssetEntity entity = new AssetEntity(
            command.name().trim(),
            command.type().trim(),
            command.tag().trim(),
            normalize(command.storageUrl()),
            command.enabled() == null || command.enabled()
        );
        AssetEntity saved = assetRepository.save(entity);
        auditEventPublisher.publish("asset", "create", String.valueOf(saved.getId()), "system", true);
        return saved;
    }

    @Transactional
    public AssetEntity update(Long id, AssetCommand command) {
        AssetEntity entity = findAsset(id);
        entity.update(
            command.name().trim(),
            command.type().trim(),
            command.tag().trim(),
            normalize(command.storageUrl()),
            command.enabled() == null ? entity.getEnabled() : command.enabled()
        );
        auditEventPublisher.publish("asset", "update", String.valueOf(id), "system", true);
        return entity;
    }

    @Transactional
    public void delete(Long id) {
        AssetEntity entity = findAsset(id);
        assetRepository.delete(entity);
        auditEventPublisher.publish("asset", "delete", String.valueOf(id), "system", true);
    }

    private AssetEntity findAsset(Long id) {
        return assetRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ASSET_NOT_FOUND", "素材不存在"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
