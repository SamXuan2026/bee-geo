package com.beegeo.publish.domain;

import java.time.LocalDate;

public record PublishAccountView(
    Long id,
    String accountId,
    String name,
    String platformCode,
    String platformName,
    String endpoint,
    String status,
    LocalDate expiresAt
) {
}
