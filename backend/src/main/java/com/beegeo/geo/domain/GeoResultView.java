package com.beegeo.geo.domain;

public record GeoResultView(
    Long id,
    Long taskId,
    String keyword,
    String question,
    String aiTitle,
    String url,
    String media,
    String description
) {
}
