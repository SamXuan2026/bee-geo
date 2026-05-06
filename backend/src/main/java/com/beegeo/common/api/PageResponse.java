package com.beegeo.common.api;

import java.util.List;

public record PageResponse<T>(
    List<T> items,
    long total,
    int page,
    int pageSize,
    int totalPages
) {
}
