package com.beegeo.creation.application;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.common.ai.AiProvider;
import com.beegeo.creation.domain.CreationEntity;
import com.beegeo.creation.domain.CreationStatus;
import com.beegeo.creation.domain.CreationView;
import com.beegeo.creation.repository.CreationRepository;
import com.beegeo.keyword.domain.KeywordEntity;
import com.beegeo.keyword.repository.KeywordRepository;
import com.beegeo.knowledge.domain.KnowledgeEntity;
import com.beegeo.knowledge.repository.KnowledgeRepository;
import com.beegeo.publish.application.PublishTaskApplicationService;
import com.beegeo.publish.domain.PublishTaskCommand;
import com.beegeo.publish.domain.PublishTaskView;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreationApplicationService {
    private final CreationRepository creationRepository;
    private final AuditEventPublisher auditEventPublisher;
    private final PublishTaskApplicationService publishTaskApplicationService;
    private final AiProvider aiProvider;
    private final KeywordRepository keywordRepository;
    private final KnowledgeRepository knowledgeRepository;

    public CreationApplicationService(
        CreationRepository creationRepository,
        AuditEventPublisher auditEventPublisher,
        PublishTaskApplicationService publishTaskApplicationService,
        AiProvider aiProvider,
        KeywordRepository keywordRepository,
        KnowledgeRepository knowledgeRepository
    ) {
        this.creationRepository = creationRepository;
        this.auditEventPublisher = auditEventPublisher;
        this.publishTaskApplicationService = publishTaskApplicationService;
        this.aiProvider = aiProvider;
        this.keywordRepository = keywordRepository;
        this.knowledgeRepository = knowledgeRepository;
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
    public CreationView generateDraft(AiCreationCommand command) {
        String topic = required(command.topic(), "创作主题不能为空");
        List<KeywordEntity> keywords = loadEnabledKeywords(command.keywordIds());
        List<KnowledgeEntity> knowledgeItems = loadEnabledKnowledge(command.knowledgeIds());
        if (keywords.isEmpty()) {
            throw new BusinessException("CREATION_KEYWORD_EMPTY", "请至少选择一个启用的关键词");
        }
        if (knowledgeItems.isEmpty()) {
            throw new BusinessException("CREATION_KNOWLEDGE_EMPTY", "请至少选择一条启用的知识库材料");
        }

        List<String> keywordTexts = keywords.stream()
            .map(keyword -> safeText(keyword.getName()) + "：" + safeText(keyword.getDescription()))
            .toList();
        List<String> knowledgeTexts = knowledgeItems.stream()
            .map(item -> safeText(item.getName()) + "（" + safeText(item.getGroupName()) + "）：" + safeText(item.getContent()))
            .toList();
        String personaName = defaultValue(command.personaName(), "品牌顾问");
        String body = aiProvider.generateArticleWithContext(topic, personaName, keywordTexts, knowledgeTexts);
        String title = limitTitle(extractTitle(body, topic));
        String summary = "基于 " + keywords.size() + " 个关键词和 " + knowledgeItems.size() + " 条知识库材料生成的 AI 创作草稿。";
        CreationEntity saved = creationRepository.save(new CreationEntity(
            null,
            title,
            defaultValue(command.brand(), "BeeWorks"),
            defaultValue(command.platform(), "自有站点"),
            summary,
            body
        ));
        auditEventPublisher.publish("creation", "generateDraft", String.valueOf(saved.getId()), "system", true);
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

    private String safeText(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("CREATION_INVALID_ARGUMENT", message);
        }
        return value.trim();
    }

    private String defaultValue(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private List<KeywordEntity> loadEnabledKeywords(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return keywordRepository.findAllById(ids).stream()
            .filter(item -> Boolean.TRUE.equals(item.getEnabled()))
            .toList();
    }

    private List<KnowledgeEntity> loadEnabledKnowledge(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return knowledgeRepository.findAllById(ids).stream()
            .filter(item -> Boolean.TRUE.equals(item.getEnabled()))
            .toList();
    }

    private String extractTitle(String body, String topic) {
        List<String> lines = new ArrayList<>(body.lines().map(String::trim).filter(line -> !line.isBlank()).toList());
        if (lines.isEmpty()) {
            return topic;
        }
        for (String line : lines) {
            String normalized = line.replaceFirst("^#+\\s*", "");
            if (normalized.startsWith("标题：") || normalized.startsWith("标题:")) {
                String title = normalized.replaceFirst("^标题[:：]\\s*", "");
                return title.isBlank() ? topic : title;
            }
        }
        for (String line : lines) {
            if (line.startsWith("#")) {
                String title = line.replaceFirst("^#+\\s*", "");
                return title.isBlank() ? topic : title;
            }
        }
        return topic;
    }

    private String limitTitle(String value) {
        String normalized = value.trim();
        return normalized.length() <= 180 ? normalized : normalized.substring(0, 180);
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
