package com.beegeo.keyword.application;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.keyword.domain.KeywordEntity;
import com.beegeo.keyword.repository.KeywordRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KeywordApplicationService {
    private final KeywordRepository keywordRepository;
    private final AuditEventPublisher auditEventPublisher;

    public KeywordApplicationService(KeywordRepository keywordRepository, AuditEventPublisher auditEventPublisher) {
        this.keywordRepository = keywordRepository;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Transactional(readOnly = true)
    public List<KeywordEntity> list(String keyword) {
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        if (keyword == null || keyword.isBlank()) {
            return keywordRepository.findAll(sort);
        }
        String query = keyword.trim();
        return keywordRepository.findByNameContainingIgnoreCaseOrGroupNameContainingIgnoreCase(query, query, sort);
    }

    @Transactional(readOnly = true)
    public KeywordEntity detail(Long id) {
        return findKeyword(id);
    }

    @Transactional
    public KeywordEntity create(KeywordCommand command) {
        KeywordEntity entity = new KeywordEntity(
            command.name().trim(),
            command.groupName().trim(),
            normalize(command.description()),
            command.enabled() == null || command.enabled()
        );
        KeywordEntity saved = keywordRepository.save(entity);
        auditEventPublisher.publish("keyword", "create", String.valueOf(saved.getId()), "system", true);
        return saved;
    }

    @Transactional
    public KeywordEntity update(Long id, KeywordCommand command) {
        KeywordEntity entity = findKeyword(id);
        entity.update(
            command.name().trim(),
            command.groupName().trim(),
            normalize(command.description()),
            command.enabled() == null ? entity.getEnabled() : command.enabled()
        );
        auditEventPublisher.publish("keyword", "update", String.valueOf(id), "system", true);
        return entity;
    }

    @Transactional
    public void delete(Long id) {
        KeywordEntity entity = findKeyword(id);
        keywordRepository.delete(entity);
        auditEventPublisher.publish("keyword", "delete", String.valueOf(id), "system", true);
    }

    private KeywordEntity findKeyword(Long id) {
        return keywordRepository.findById(id)
            .orElseThrow(() -> new BusinessException("KEYWORD_NOT_FOUND", "关键词不存在"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
