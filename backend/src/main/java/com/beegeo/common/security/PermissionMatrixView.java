package com.beegeo.common.security;

import java.util.List;

public record PermissionMatrixView(
    Long id,
    String module,
    String permission,
    String description,
    String riskLevel,
    List<String> roles,
    Boolean backendGuarded
) {
}
