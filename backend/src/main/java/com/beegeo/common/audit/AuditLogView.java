package com.beegeo.common.audit;

import java.time.LocalDateTime;

public record AuditLogView(
    Long id,
    String module,
    String action,
    String targetId,
    String operatorAccount,
    String operatorName,
    String operatorRole,
    String clientIp,
    String requestUri,
    Boolean success,
    LocalDateTime createdAt
) {
}
