package com.beegeo.creation.controller;

import com.beegeo.auth.domain.UserRole;
import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.security.RequireRole;
import com.beegeo.creation.application.CreationApplicationService;
import com.beegeo.creation.application.CreationPublishCommand;
import com.beegeo.creation.application.CreationUpdateCommand;
import com.beegeo.creation.domain.CreationView;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/creations")
public class CreationController {
    private final CreationApplicationService creationApplicationService;

    public CreationController(CreationApplicationService creationApplicationService) {
        this.creationApplicationService = creationApplicationService;
    }

    @GetMapping
    public ApiResponse<List<CreationView>> list() {
        return ApiResponse.ok(creationApplicationService.list());
    }

    @PutMapping("/{id}")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<CreationView> update(@PathVariable Long id, @Valid @RequestBody CreationUpdateRequest request) {
        return ApiResponse.ok(creationApplicationService.update(id, new CreationUpdateCommand(
            request.title(),
            request.brand(),
            request.platform(),
            request.summary(),
            request.body()
        )));
    }

    @PostMapping("/{id}/submit-review")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<CreationView> submitReview(@PathVariable Long id) {
        return ApiResponse.ok(creationApplicationService.submitReview(id));
    }

    @PostMapping("/{id}/approve")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.REVIEWER})
    public ApiResponse<CreationView> approve(@PathVariable Long id) {
        return ApiResponse.ok(creationApplicationService.approve(id));
    }

    @PostMapping("/{id}/reject")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.REVIEWER})
    public ApiResponse<CreationView> reject(@PathVariable Long id) {
        return ApiResponse.ok(creationApplicationService.reject(id));
    }

    @PostMapping("/{id}/schedule-publish")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.PUBLISHER})
    public ApiResponse<PublishTaskView> schedulePublish(@PathVariable Long id, @Valid @RequestBody CreationPublishRequest request) {
        return ApiResponse.ok(creationApplicationService.schedulePublish(id, new CreationPublishCommand(
            request.platformCode(),
            request.accountId(),
            request.scheduledAt(),
            request.maxRetryCount()
        )));
    }

    public record CreationUpdateRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 80) String brand,
        @NotBlank @Size(max = 80) String platform,
        @Size(max = 500) String summary,
        @NotBlank @Size(max = 8000) String body
    ) {
    }

    public record CreationPublishRequest(
        @NotBlank @Size(max = 60) String platformCode,
        @NotBlank @Size(max = 80) String accountId,
        LocalDateTime scheduledAt,
        @Min(0) @Max(10) Integer maxRetryCount
    ) {
    }
}
