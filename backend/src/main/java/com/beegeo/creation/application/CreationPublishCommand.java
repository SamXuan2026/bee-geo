package com.beegeo.creation.application;

import java.time.LocalDateTime;

public record CreationPublishCommand(
    String platformCode,
    String accountId,
    LocalDateTime scheduledAt,
    Integer maxRetryCount
) {
}
