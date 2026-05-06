package com.beegeo.publish.domain;

import java.time.LocalDateTime;

public record PublishTaskCommand(
    Long contentId,
    String title,
    String body,
    String platformCode,
    String accountId,
    LocalDateTime scheduledAt,
    Integer maxRetryCount
) {
}
