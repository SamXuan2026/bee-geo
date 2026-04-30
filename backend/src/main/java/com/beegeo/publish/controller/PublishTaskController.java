package com.beegeo.publish.controller;

import com.beegeo.auth.domain.UserRole;
import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.security.RequireRole;
import com.beegeo.publish.application.PublishTaskApplicationService;
import com.beegeo.publish.domain.PublishAccountView;
import com.beegeo.publish.domain.PublishReceipt;
import com.beegeo.publish.domain.PublishReceiptView;
import com.beegeo.publish.domain.PublishStatus;
import com.beegeo.publish.domain.PublishTaskCommand;
import com.beegeo.publish.domain.PublishTaskView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/publish/tasks")
public class PublishTaskController {
    private final PublishTaskApplicationService publishTaskApplicationService;

    public PublishTaskController(PublishTaskApplicationService publishTaskApplicationService) {
        this.publishTaskApplicationService = publishTaskApplicationService;
    }

    @GetMapping
    public ApiResponse<List<PublishTaskView>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String platformCode,
        @RequestParam(required = false) PublishStatus status
    ) {
        return ApiResponse.ok(publishTaskApplicationService.listTasks(keyword, platformCode, status));
    }

    @GetMapping("/{id}")
    public ApiResponse<PublishTaskView> detail(@PathVariable Long id) {
        return ApiResponse.ok(publishTaskApplicationService.detail(id));
    }

    @GetMapping("/accounts")
    public ApiResponse<List<PublishAccountView>> listAccounts() {
        return ApiResponse.ok(publishTaskApplicationService.listAccounts());
    }

    @PostMapping
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.PUBLISHER})
    public ApiResponse<PublishTaskView> create(@Valid @RequestBody PublishTaskRequest request) {
        return ApiResponse.ok(publishTaskApplicationService.create(toCommand(request)));
    }

    @PostMapping("/dispatch")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.PUBLISHER})
    public ApiResponse<DispatchResult> dispatch() {
        return ApiResponse.ok(new DispatchResult(publishTaskApplicationService.dispatchDueTasks(20)));
    }

    @PostMapping("/{id}/retry")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.PUBLISHER})
    public ApiResponse<PublishReceipt> retry(@PathVariable Long id) {
        return ApiResponse.ok(publishTaskApplicationService.retry(id));
    }

    @PostMapping("/{id}/revoke")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.PUBLISHER})
    public ApiResponse<PublishReceipt> revoke(@PathVariable Long id) {
        return ApiResponse.ok(publishTaskApplicationService.revoke(id));
    }

    @GetMapping("/{id}/receipts")
    public ApiResponse<List<PublishReceiptView>> listReceipts(@PathVariable Long id) {
        return ApiResponse.ok(publishTaskApplicationService.listReceipts(id));
    }

    @GetMapping("/{id}/receipt")
    public ApiResponse<List<PublishReceiptView>> listReceiptAlias(@PathVariable Long id) {
        return ApiResponse.ok(publishTaskApplicationService.listReceipts(id));
    }

    private PublishTaskCommand toCommand(PublishTaskRequest request) {
        return new PublishTaskCommand(
            request.contentId(),
            request.title(),
            request.body(),
            request.platformCode(),
            request.accountId(),
            request.scheduledAt(),
            request.maxRetryCount()
        );
    }

    public record PublishTaskRequest(
        Long contentId,
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 8000) String body,
        @NotBlank @Size(max = 60) String platformCode,
        @NotBlank @Size(max = 80) String accountId,
        LocalDateTime scheduledAt,
        @Min(0) @Max(10) Integer maxRetryCount
    ) {
    }

    public record DispatchResult(int dispatchedCount) {
    }
}
