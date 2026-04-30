package com.beegeo.auth.domain;

import com.beegeo.common.api.BusinessException;
import java.util.Arrays;

public enum UserRole {
    SUPER_ADMIN("超级管理员"),
    CONTENT_ADMIN("内容管理员"),
    REVIEWER("审核员"),
    PUBLISHER("发布员"),
    READONLY_VIEWER("只读观察员");

    private final String name;

    UserRole(String name) {
        this.name = name;
    }

    public String code() {
        return name();
    }

    public String displayName() {
        return name;
    }

    public static UserRole fromCode(String code) {
        return Arrays.stream(values())
            .filter(role -> role.name().equals(code))
            .findFirst()
            .orElseThrow(() -> new BusinessException("ROLE_NOT_FOUND", "用户角色不存在"));
    }
}
