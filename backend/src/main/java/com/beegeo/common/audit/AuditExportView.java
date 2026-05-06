package com.beegeo.common.audit;

public record AuditExportView(
    String fileName,
    String contentType,
    String content
) {
}
