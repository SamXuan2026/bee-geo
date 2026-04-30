package com.beegeo.publish.domain;

import java.time.LocalDateTime;

public record PublishReceipt(
    boolean success,
    String externalPublishId,
    String url,
    String message,
    LocalDateTime publishedAt
) {
}
