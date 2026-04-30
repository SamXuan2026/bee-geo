package com.beegeo.geo.controller;

import com.beegeo.auth.domain.UserRole;
import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.security.RequireRole;
import com.beegeo.creation.domain.CreationView;
import com.beegeo.geo.application.GeoApplicationService;
import com.beegeo.geo.domain.GeoResultView;
import com.beegeo.geo.domain.GeoTaskView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/geo/tasks")
public class GeoController {
    private final GeoApplicationService geoApplicationService;

    public GeoController(GeoApplicationService geoApplicationService) {
        this.geoApplicationService = geoApplicationService;
    }

    @GetMapping
    public ApiResponse<List<GeoTaskView>> list() {
        return ApiResponse.ok(geoApplicationService.listTasks());
    }

    @GetMapping("/{id}")
    public ApiResponse<GeoTaskView> detail(@PathVariable Long id) {
        return ApiResponse.ok(geoApplicationService.detail(id));
    }

    @GetMapping("/{id}/results")
    public ApiResponse<List<GeoResultView>> listResults(@PathVariable Long id) {
        return ApiResponse.ok(geoApplicationService.listResults(id));
    }

    @PostMapping
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<GeoTaskView> create(@Valid @RequestBody CreateGeoTaskRequest request) {
        return ApiResponse.ok(geoApplicationService.createTask(request.keyword()));
    }

    @PostMapping("/{id}/create-draft")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<CreationView> createDraft(@PathVariable Long id) {
        return ApiResponse.ok(geoApplicationService.createDraft(id));
    }

    public record CreateGeoTaskRequest(@NotBlank @Size(max = 120) String keyword) {
    }
}
