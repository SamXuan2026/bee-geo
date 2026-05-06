package com.beegeo.common.security;

import com.beegeo.auth.domain.UserRole;

public record CurrentOperator(
    String account,
    String name,
    UserRole role,
    String clientIp,
    String requestUri
) {
    public boolean hasAnyRole(UserRole[] allowedRoles) {
        if (role == UserRole.SUPER_ADMIN) {
            return true;
        }
        for (UserRole allowedRole : allowedRoles) {
            if (role == allowedRole) {
                return true;
            }
        }
        return false;
    }
}
