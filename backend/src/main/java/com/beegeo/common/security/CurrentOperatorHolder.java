package com.beegeo.common.security;

import com.beegeo.auth.domain.UserRole;

public final class CurrentOperatorHolder {
    private static final ThreadLocal<CurrentOperator> HOLDER = new ThreadLocal<>();
    private static final CurrentOperator SYSTEM_OPERATOR = new CurrentOperator(
        "system",
        "系统",
        UserRole.SUPER_ADMIN,
        "127.0.0.1",
        "system"
    );

    private CurrentOperatorHolder() {
    }

    public static void set(CurrentOperator operator) {
        HOLDER.set(operator);
    }

    public static CurrentOperator get() {
        CurrentOperator operator = HOLDER.get();
        return operator == null ? SYSTEM_OPERATOR : operator;
    }

    public static void clear() {
        HOLDER.remove();
    }
}
