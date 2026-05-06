package com.beegeo.creation.domain;

import java.time.LocalDateTime;

public record CreationView(
    Long id,
    Long geoTaskId,
    String title,
    String brand,
    String platform,
    String summary,
    String body,
    LocalDateTime publishAt,
    CreationStatus status
) {
}
