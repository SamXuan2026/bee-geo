package com.beegeo.geo.application;

import com.beegeo.common.ai.AiProvider;
import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.creation.application.CreationApplicationService;
import com.beegeo.creation.domain.CreationView;
import com.beegeo.geo.domain.GeoResultEntity;
import com.beegeo.geo.domain.GeoResultView;
import com.beegeo.geo.domain.GeoTaskEntity;
import com.beegeo.geo.domain.GeoTaskView;
import com.beegeo.geo.repository.GeoResultRepository;
import com.beegeo.geo.repository.GeoTaskRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GeoApplicationService {
    private final GeoTaskRepository geoTaskRepository;
    private final GeoResultRepository geoResultRepository;
    private final AiProvider aiProvider;
    private final CreationApplicationService creationApplicationService;
    private final AuditEventPublisher auditEventPublisher;

    public GeoApplicationService(
        GeoTaskRepository geoTaskRepository,
        GeoResultRepository geoResultRepository,
        AiProvider aiProvider,
        CreationApplicationService creationApplicationService,
        AuditEventPublisher auditEventPublisher
    ) {
        this.geoTaskRepository = geoTaskRepository;
        this.geoResultRepository = geoResultRepository;
        this.aiProvider = aiProvider;
        this.creationApplicationService = creationApplicationService;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Transactional(readOnly = true)
    public List<GeoTaskView> listTasks() {
        return geoTaskRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
            .map(this::toTaskView)
            .toList();
    }

    @Transactional(readOnly = true)
    public GeoTaskView detail(Long id) {
        return toTaskView(findTask(id));
    }

    @Transactional(readOnly = true)
    public List<GeoResultView> listResults(Long taskId) {
        findTask(taskId);
        return geoResultRepository.findByTaskId(taskId, Sort.by(Sort.Direction.ASC, "id")).stream()
            .map(this::toResultView)
            .toList();
    }

    @Transactional
    public GeoTaskView createTask(String keyword) {
        GeoTaskEntity task = geoTaskRepository.save(new GeoTaskEntity(keyword.trim()));
        List<String> questions = aiProvider.generateGeoQuestions(task.getKeyword());
        for (int index = 0; index < questions.size(); index++) {
            geoResultRepository.save(toResult(task, questions.get(index), index));
        }
        task.markCompleted(questions.size());
        auditEventPublisher.publish("geo", "createTask", String.valueOf(task.getId()), "system", true);
        return toTaskView(task);
    }

    @Transactional
    public CreationView createDraft(Long taskId) {
        GeoTaskEntity task = findTask(taskId);
        List<GeoResultEntity> results = geoResultRepository.findByTaskId(taskId, Sort.by(Sort.Direction.ASC, "id"));
        if (results.isEmpty()) {
            throw new BusinessException("GEO_RESULT_EMPTY", "GEO 结果为空，无法创建草稿");
        }
        String title = results.get(0).getAiTitle();
        String summary = "基于关键词「" + task.getKeyword() + "」和 " + results.size() + " 条 GEO 结果生成的内容草稿。";
        String body = aiProvider.generateArticle(task.getKeyword(), "品牌顾问") + "\n\n参考问题：\n"
            + results.stream().map(result -> "- " + result.getQuestion()).reduce("", (left, right) -> left + right + "\n");
        CreationView draft = creationApplicationService.createDraft(taskId, title, "BeeWorks", "自有站点", summary, body);
        auditEventPublisher.publish("geo", "createDraft", String.valueOf(taskId), "system", true);
        return draft;
    }

    private GeoTaskEntity findTask(Long id) {
        return geoTaskRepository.findById(id)
            .orElseThrow(() -> new BusinessException("GEO_TASK_NOT_FOUND", "GEO 任务不存在"));
    }

    private GeoResultEntity toResult(GeoTaskEntity task, String question, int index) {
        String media = index % 2 == 0 ? "自有站点" : "免费媒体";
        String title = task.getKeyword() + " GEO 内容机会分析 " + (index + 1);
        String url = "https://example.local/geo/" + task.getId() + "/" + (index + 1);
        String description = "围绕「" + question + "」沉淀引用来源、品牌曝光机会和内容优化方向。";
        return new GeoResultEntity(task.getId(), task.getKeyword(), question, title, url, media, description);
    }

    private GeoTaskView toTaskView(GeoTaskEntity entity) {
        List<String> questions = geoResultRepository.findByTaskId(entity.getId(), Sort.by(Sort.Direction.ASC, "id")).stream()
            .map(GeoResultEntity::getQuestion)
            .toList();
        return new GeoTaskView(entity.getId(), entity.getKeyword(), entity.getStatus(), entity.getCreatedAt(), questions);
    }

    private GeoResultView toResultView(GeoResultEntity entity) {
        return new GeoResultView(
            entity.getId(),
            entity.getTaskId(),
            entity.getKeyword(),
            entity.getQuestion(),
            entity.getAiTitle(),
            entity.getUrl(),
            entity.getMedia(),
            entity.getDescription()
        );
    }
}
