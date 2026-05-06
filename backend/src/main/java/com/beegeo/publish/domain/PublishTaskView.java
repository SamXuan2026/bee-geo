package com.beegeo.publish.domain;

import java.time.LocalDateTime;

public record PublishTaskView(
    Long id,
    Long contentId,
    String title,
    String platform,
    String platformCode,
    String account,
    String accountId,
    LocalDateTime scheduledAt,
    PublishStatus status,
    int retryCount,
    int maxRetryCount,
    String receipt,
    String url,
    String externalPublishId,
    LocalDateTime lastAttemptAt,
    LocalDateTime publishedAt
) {
}
