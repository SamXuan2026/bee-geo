package com.beegeo.creation.application;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.creation.domain.CreationEntity;
import com.beegeo.creation.domain.CreationStatus;
import com.beegeo.creation.domain.CreationView;
import com.beegeo.creation.repository.CreationRepository;
import com.beegeo.publish.application.PublishTaskApplicationService;
import com.beegeo.publish.domain.PublishTaskCommand;
import com.beegeo.publish.domain.PublishTaskView;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreationApplicationService {
    private final CreationRepository creationRepository;
    private final AuditEventPublisher auditEventPublisher;
    private final PublishTaskApplicationService publishTaskApplicationService;

    public CreationApplicationService(
        CreationRepository creationRepository,
        AuditEventPublisher auditEventPublisher,
        PublishTaskApplicationService publishTaskApplicationService
    ) {
        this.creationRepository = creationRepository;
        this.auditEventPublisher = auditEventPublisher;
        this.publishTaskApplicationService = publishTaskApplicationService;
    }

    @Transactional(readOnly = true)
    public List<CreationView> list() {
        return creationRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
            .map(this::toView)
            .toList();
    }

    @Transactional
    public CreationView createDraft(Long geoTaskId, String title, String brand, String platform, String summary, String body) {
        CreationEntity entity = new CreationEntity(geoTaskId, title, brand, platform, summary, body);
        CreationEntity saved = creationRepository.save(entity);
        auditEventPublisher.publish("creation", "createDraft", String.valueOf(saved.getId()), "system", true);
        return toView(saved);
    }

    @Transactional
    public CreationView update(Long id, CreationUpdateCommand command) {
        CreationEntity entity = findCreation(id);
        if (entity.getStatus() == CreationStatus.PUBLISHED || entity.getStatus() == CreationStatus.REVOKED) {
            throw new BusinessException("CREATION_LOCKED", "已发布或已撤回的内容不能编辑");
        }
        entity.updateContent(
            command.title().trim(),
            command.brand().trim(),
            command.platform().trim(),
            normalize(command.summary()),
            command.body().trim()
        );
        auditEventPublisher.publish("creation", "update", String.valueOf(id), "system", true);
        return toView(entity);
    }

    @Transactional
    public CreationView submitReview(Long id) {
        CreationEntity entity = findCreation(id);
        entity.submitReview();
        auditEventPublisher.publish("creation", "submitReview", String.valueOf(id), "system", true);
        return toView(entity);
    }

    @Transactional
    public CreationView approve(Long id) {
        CreationEntity entity = findCreation(id);
        entity.approve();
        auditEventPublisher.publish("creation", "approve", String.valueOf(id), "system", true);
        return toView(entity);
    }

    @Transactional
    public CreationView reject(Long id) {
        CreationEntity entity = findCreation(id);
        entity.reject();
        auditEventPublisher.publish("creation", "reject", String.valueOf(id), "system", true);
        return toView(entity);
    }

    @Transactional
    public PublishTaskView schedulePublish(Long id, CreationPublishCommand command) {
        CreationEntity entity = findCreation(id);
        if (entity.getStatus() != CreationStatus.APPROVED) {
            throw new BusinessException("CREATION_NOT_APPROVED", "只有审核通过的内容可以创建发布排期");
        }
        PublishTaskView task = publishTaskApplicationService.create(new PublishTaskCommand(
            entity.getId(),
            entity.getTitle(),
            entity.getBody(),
            command.platformCode(),
            command.accountId(),
            command.scheduledAt(),
            command.maxRetryCount()
        ));
        entity.schedule(task.scheduledAt());
        auditEventPublisher.publish("creation", "schedulePublish", String.valueOf(id), "system", true);
        return task;
    }

    private CreationEntity findCreation(Long id) {
        return creationRepository.findById(id)
            .orElseThrow(() -> new BusinessException("CREATION_NOT_FOUND", "创作内容不存在"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private CreationView toView(CreationEntity entity) {
        return new CreationView(
            entity.getId(),
            entity.getGeoTaskId(),
            entity.getTitle(),
            entity.getBrand(),
            entity.getPlatform(),
            entity.getSummary(),
            entity.getBody(),
            entity.getPublishAt(),
            entity.getStatus()
        );
    }
}
