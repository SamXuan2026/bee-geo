package com.beegeo.persona.application;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.persona.domain.PersonaEntity;
import com.beegeo.persona.repository.PersonaRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PersonaApplicationService {
    private final PersonaRepository personaRepository;
    private final AuditEventPublisher auditEventPublisher;

    public PersonaApplicationService(PersonaRepository personaRepository, AuditEventPublisher auditEventPublisher) {
        this.personaRepository = personaRepository;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Transactional(readOnly = true)
    public List<PersonaEntity> list(String keyword) {
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        if (keyword == null || keyword.isBlank()) {
            return personaRepository.findAll(sort);
        }
        String query = keyword.trim();
        return personaRepository.findByNameContainingIgnoreCaseOrRoleNameContainingIgnoreCase(query, query, sort);
    }

    @Transactional(readOnly = true)
    public PersonaEntity detail(Long id) {
        return findPersona(id);
    }

    @Transactional
    public PersonaEntity create(PersonaCommand command) {
        PersonaEntity entity = new PersonaEntity(
            command.name().trim(),
            command.creator().trim(),
            command.roleName().trim(),
            normalize(command.tone()),
            normalizeStatus(command.status()),
            normalize(command.promptTemplate())
        );
        PersonaEntity saved = personaRepository.save(entity);
        auditEventPublisher.publish("persona", "create", String.valueOf(saved.getId()), "system", true);
        return saved;
    }

    @Transactional
    public PersonaEntity update(Long id, PersonaCommand command) {
        PersonaEntity entity = findPersona(id);
        entity.update(
            command.name().trim(),
            command.creator().trim(),
            command.roleName().trim(),
            normalize(command.tone()),
            normalizeStatus(command.status()),
            normalize(command.promptTemplate())
        );
        auditEventPublisher.publish("persona", "update", String.valueOf(id), "system", true);
        return entity;
    }

    @Transactional
    public void delete(Long id) {
        PersonaEntity entity = findPersona(id);
        personaRepository.delete(entity);
        auditEventPublisher.publish("persona", "delete", String.valueOf(id), "system", true);
    }

    private PersonaEntity findPersona(Long id) {
        return personaRepository.findById(id)
            .orElseThrow(() -> new BusinessException("PERSONA_NOT_FOUND", "AI 人设不存在"));
    }

    private String normalizeStatus(String status) {
        return status == null || status.isBlank() ? "启用" : status.trim();
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
