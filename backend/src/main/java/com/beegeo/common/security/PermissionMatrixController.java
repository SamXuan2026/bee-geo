package com.beegeo.common.security;

import com.beegeo.auth.domain.UserRole;
import com.beegeo.common.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/security/permissions")
@RequireRole({UserRole.SUPER_ADMIN})
public class PermissionMatrixController {
    private final PermissionMatrixApplicationService permissionMatrixApplicationService;

    public PermissionMatrixController(PermissionMatrixApplicationService permissionMatrixApplicationService) {
        this.permissionMatrixApplicationService = permissionMatrixApplicationService;
    }

    @GetMapping
    public ApiResponse<List<PermissionMatrixView>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String roleCode,
        @RequestParam(required = false) String riskLevel
    ) {
        return ApiResponse.ok(permissionMatrixApplicationService.list(keyword, roleCode, riskLevel));
    }
}
