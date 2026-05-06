package com.beegeo.publish.application;

import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "bee-geo.publish.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class PublishTaskScheduler {
    private static final Logger LOGGER = LoggerFactory.getLogger(PublishTaskScheduler.class);

    private final PublishTaskApplicationService publishTaskApplicationService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public PublishTaskScheduler(PublishTaskApplicationService publishTaskApplicationService) {
        this.publishTaskApplicationService = publishTaskApplicationService;
    }

    @Scheduled(
        initialDelayString = "${bee-geo.publish.scheduler.initial-delay-ms:10000}",
        fixedDelayString = "${bee-geo.publish.scheduler.fixed-delay-ms:30000}"
    )
    public void dispatchDueTasks() {
        if (!running.compareAndSet(false, true)) {
            return;
        }
        try {
            int dispatchedCount = publishTaskApplicationService.dispatchDueTasks(20);
            if (dispatchedCount > 0) {
                LOGGER.info("发布调度完成 dispatchedCount={}", dispatchedCount);
            }
        } catch (Exception exception) {
            LOGGER.error("发布调度失败", exception);
        } finally {
            running.set(false);
        }
    }
}
