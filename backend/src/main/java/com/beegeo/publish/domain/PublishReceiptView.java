package com.beegeo.publish.domain;

import java.time.LocalDateTime;

public record PublishReceiptView(
    Long id,
    Long taskId,
    String platformCode,
    String accountId,
    Integer attemptNo,
    Boolean success,
    String externalPublishId,
    String url,
    String message,
    LocalDateTime publishedAt,
    LocalDateTime createdAt
) {
}
