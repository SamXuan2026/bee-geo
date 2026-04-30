package com.beegeo.knowledge.application;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.knowledge.domain.KnowledgeEntity;
import com.beegeo.knowledge.repository.KnowledgeRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeApplicationService {
    private final KnowledgeRepository knowledgeRepository;
    private final AuditEventPublisher auditEventPublisher;

    public KnowledgeApplicationService(KnowledgeRepository knowledgeRepository, AuditEventPublisher auditEventPublisher) {
        this.knowledgeRepository = knowledgeRepository;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Transactional(readOnly = true)
    public List<KnowledgeEntity> list(String keyword) {
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        if (keyword == null || keyword.isBlank()) {
            return knowledgeRepository.findAll(sort);
        }
        String query = keyword.trim();
        return knowledgeRepository.findByNameContainingIgnoreCaseOrGroupNameContainingIgnoreCase(query, query, sort);
    }

    @Transactional(readOnly = true)
    public KnowledgeEntity detail(Long id) {
        return findKnowledge(id);
    }

    @Transactional
    public KnowledgeEntity create(KnowledgeCommand command) {
        KnowledgeEntity entity = new KnowledgeEntity(
            command.name().trim(),
            command.type().trim(),
            command.groupName().trim(),
            normalize(command.content()),
            command.enabled() == null || command.enabled()
        );
        KnowledgeEntity saved = knowledgeRepository.save(entity);
        auditEventPublisher.publish("knowledge", "create", String.valueOf(saved.getId()), "system", true);
        return saved;
    }

    @Transactional
    public KnowledgeEntity update(Long id, KnowledgeCommand command) {
        KnowledgeEntity entity = findKnowledge(id);
        entity.update(
            command.name().trim(),
            command.type().trim(),
            command.groupName().trim(),
            normalize(command.content()),
            command.enabled() == null ? entity.getEnabled() : command.enabled()
        );
        auditEventPublisher.publish("knowledge", "update", String.valueOf(id), "system", true);
        return entity;
    }

    @Transactional
    public void delete(Long id) {
        KnowledgeEntity entity = findKnowledge(id);
        knowledgeRepository.delete(entity);
        auditEventPublisher.publish("knowledge", "delete", String.valueOf(id), "system", true);
    }

    private KnowledgeEntity findKnowledge(Long id) {
        return knowledgeRepository.findById(id)
            .orElseThrow(() -> new BusinessException("KNOWLEDGE_NOT_FOUND", "知识文档不存在"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
