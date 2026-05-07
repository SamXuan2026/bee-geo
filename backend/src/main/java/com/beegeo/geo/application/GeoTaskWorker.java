package com.beegeo.geo.application;

import com.beegeo.common.ai.AiProvider;
import com.beegeo.common.ai.GeoInsight;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.geo.domain.GeoResultEntity;
import com.beegeo.geo.domain.GeoTaskEntity;
import com.beegeo.geo.repository.GeoResultRepository;
import com.beegeo.geo.repository.GeoTaskRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class GeoTaskWorker {
    private static final Logger log = LoggerFactory.getLogger(GeoTaskWorker.class);

    private final GeoTaskRepository geoTaskRepository;
    private final GeoResultRepository geoResultRepository;
    private final AiProvider aiProvider;
    private final AuditEventPublisher auditEventPublisher;

    public GeoTaskWorker(
        GeoTaskRepository geoTaskRepository,
        GeoResultRepository geoResultRepository,
        AiProvider aiProvider,
        AuditEventPublisher auditEventPublisher
    ) {
        this.geoTaskRepository = geoTaskRepository;
        this.geoResultRepository = geoResultRepository;
        this.aiProvider = aiProvider;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Async("geoTaskExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(GeoTaskCreatedEvent event) {
        process(event.taskId());
    }

    @Transactional
    public void process(Long taskId) {
        GeoTaskEntity task = geoTaskRepository.findById(taskId)
            .orElseThrow(() -> new IllegalStateException("GEO 任务不存在：" + taskId));
        long startedAt = System.currentTimeMillis();
        try {
            List<GeoInsight> insights = aiProvider.generateGeoInsights(task.getKeyword());
            for (GeoInsight insight : insights) {
                geoResultRepository.save(toResult(task, insight));
            }
            task.markCompleted(insights.size());
            auditEventPublisher.publish("geo", "completeTask", String.valueOf(task.getId()), "system", true);
            log.info("GEO 分析任务完成 taskId={} keyword={} provider={} model={} resultCount={} costMs={}",
                task.getId(), task.getKeyword(), aiProvider.providerName(), aiProvider.modelName(), insights.size(), System.currentTimeMillis() - startedAt);
        } catch (Exception ex) {
            task.markFailed(ex.getMessage());
            auditEventPublisher.publish("geo", "completeTask", String.valueOf(task.getId()), "system", false);
            log.warn("GEO 分析任务失败 taskId={} keyword={} provider={} model={} costMs={} reason={}",
                task.getId(), task.getKeyword(), aiProvider.providerName(), aiProvider.modelName(), System.currentTimeMillis() - startedAt, ex.getMessage(), ex);
        }
    }

    private GeoResultEntity toResult(GeoTaskEntity task, GeoInsight insight) {
        String providerName = aiProvider.providerName();
        String title = limit(insight.aiTitle(), 180);
        String description = limit(insight.description(), 1000);
        return new GeoResultEntity(task.getId(), task.getKeyword(), insight.question(), title, "", providerName, description);
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
