package com.beegeo.common.audit;

import com.beegeo.auth.domain.UserRole;
import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.api.PageResponse;
import com.beegeo.common.security.RequireRole;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit/logs")
@RequireRole({UserRole.SUPER_ADMIN})
public class AuditLogController {
    private final AuditLogApplicationService auditLogApplicationService;

    public AuditLogController(AuditLogApplicationService auditLogApplicationService) {
        this.auditLogApplicationService = auditLogApplicationService;
    }

    @GetMapping
    public ApiResponse<List<AuditLogView>> list(@RequestParam(required = false) String keyword) {
        return ApiResponse.ok(auditLogApplicationService.list(keyword));
    }

    @GetMapping("/page")
    public ApiResponse<PageResponse<AuditLogView>> page(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Boolean success,
        @RequestParam(required = false) LocalDate startDate,
        @RequestParam(required = false) LocalDate endDate,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int pageSize
    ) {
        return ApiResponse.ok(auditLogApplicationService.page(keyword, success, startDate, endDate, page, pageSize));
    }

    @GetMapping("/export")
    public ApiResponse<AuditExportView> export(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Boolean success,
        @RequestParam(required = false) LocalDate startDate,
        @RequestParam(required = false) LocalDate endDate
    ) {
        return ApiResponse.ok(auditLogApplicationService.export(keyword, success, startDate, endDate));
    }
}
