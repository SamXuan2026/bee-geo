package com.beegeo.common.security;

import com.beegeo.auth.domain.UserRole;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PermissionMatrixApplicationService {
    private static final List<PermissionMatrixView> PERMISSIONS = List.of(
        new PermissionMatrixView(
            1L,
            "用户管理",
            "USER_MANAGE",
            "新增、编辑、删除用户和分配角色。",
            "高",
            roles(UserRole.SUPER_ADMIN),
            true
        ),
        new PermissionMatrixView(
            2L,
            "审计日志",
            "AUDIT_READ",
            "查看系统关键操作审计记录。",
            "高",
            roles(UserRole.SUPER_ADMIN),
            true
        ),
        new PermissionMatrixView(
            3L,
            "集成设置",
            "CREDENTIAL_MANAGE",
            "更新发布账号 Token、Cookie 等敏感凭据。",
            "高",
            roles(UserRole.SUPER_ADMIN, UserRole.PUBLISHER),
            true
        ),
        new PermissionMatrixView(
            4L,
            "AI 创作",
            "CONTENT_REVIEW",
            "提交审核、审核通过、驳回创作内容。",
            "中",
            roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN, UserRole.REVIEWER),
            true
        ),
        new PermissionMatrixView(
            5L,
            "发布中心",
            "PUBLISH_EXECUTE",
            "创建发布排期、执行重试、撤回任务。",
            "高",
            roles(UserRole.SUPER_ADMIN, UserRole.PUBLISHER),
            true
        ),
        new PermissionMatrixView(
            6L,
            "GEO 分析",
            "GEO_WRITE",
            "创建分析任务并生成创作草稿。",
            "中",
            roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN),
            true
        ),
        new PermissionMatrixView(
            7L,
            "资产管理",
            "ASSET_WRITE",
            "维护关键词、知识库、素材和 AI 人设。",
            "中",
            roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN),
            true
        ),
        new PermissionMatrixView(
            8L,
            "总览",
            "DASHBOARD_READ",
            "查看仪表盘、待办和发布状态。",
            "低",
            roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN, UserRole.REVIEWER, UserRole.PUBLISHER, UserRole.READONLY_VIEWER),
            false
        )
    );

    public List<PermissionMatrixView> list(String keyword, String roleCode, String riskLevel) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase();
        String normalizedRole = roleCode == null ? "" : roleCode.trim();
        String normalizedRisk = riskLevel == null ? "" : riskLevel.trim();
        return PERMISSIONS.stream()
            .filter(item -> matchesKeyword(item, normalizedKeyword))
            .filter(item -> normalizedRole.isBlank() || item.roles().contains(normalizedRole))
            .filter(item -> normalizedRisk.isBlank() || item.riskLevel().equals(normalizedRisk))
            .toList();
    }

    private boolean matchesKeyword(PermissionMatrixView item, String keyword) {
        if (keyword.isBlank()) {
            return true;
        }
        return item.module().toLowerCase().contains(keyword)
            || item.permission().toLowerCase().contains(keyword)
            || item.description().toLowerCase().contains(keyword);
    }

    private static List<String> roles(UserRole... roles) {
        return java.util.Arrays.stream(roles).map(UserRole::code).toList();
    }
}
