package com.beegeo.publish.domain;

import java.time.LocalDateTime;

public record PublishCommand(
    Long contentId,
    String title,
    String body,
    String platformCode,
    String accountId,
    LocalDateTime scheduledAt,
    String endpoint
) {
}
