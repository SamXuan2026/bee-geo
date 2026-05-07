package com.beegeo.geo.domain;

import java.time.LocalDateTime;
import java.util.List;

public record GeoTaskView(Long id, String keyword, String status, LocalDateTime createdAt, List<String> questions, String failureReason) {
}
