package com.beegeo.asset.controller;

import com.beegeo.asset.application.AssetApplicationService;
import com.beegeo.asset.application.AssetCommand;
import com.beegeo.asset.domain.AssetEntity;
import com.beegeo.common.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assets")
public class AssetController {
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private final AssetApplicationService assetApplicationService;

    public AssetController(AssetApplicationService assetApplicationService) {
        this.assetApplicationService = assetApplicationService;
    }

    @GetMapping
    public ApiResponse<List<AssetView>> list(@RequestParam(required = false) String keyword) {
        return ApiResponse.ok(assetApplicationService.list(keyword).stream().map(this::toView).toList());
    }

    @GetMapping("/{id}")
    public ApiResponse<AssetView> detail(@PathVariable Long id) {
        return ApiResponse.ok(toView(assetApplicationService.detail(id)));
    }

    @PostMapping
    public ApiResponse<AssetView> create(@Valid @RequestBody AssetRequest request) {
        return ApiResponse.ok(toView(assetApplicationService.create(toCommand(request))));
    }

    @PutMapping("/{id}")
    public ApiResponse<AssetView> update(@PathVariable Long id, @Valid @RequestBody AssetRequest request) {
        return ApiResponse.ok(toView(assetApplicationService.update(id, toCommand(request))));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        assetApplicationService.delete(id);
        return ApiResponse.ok(Boolean.TRUE);
    }

    private AssetCommand toCommand(AssetRequest request) {
        return new AssetCommand(request.name(), request.type(), request.tag(), request.storageUrl(), request.enabled());
    }

    private AssetView toView(AssetEntity entity) {
        return new AssetView(
            entity.getId(),
            entity.getName(),
            entity.getType(),
            entity.getTag(),
            entity.getStorageUrl(),
            entity.getEnabled(),
            entity.getUpdatedAt().format(DATE_TIME_FORMATTER)
        );
    }

    public record AssetRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 40) String type,
        @NotBlank @Size(max = 120) String tag,
        @Size(max = 500) String storageUrl,
        Boolean enabled
    ) {
    }

    public record AssetView(Long id, String name, String type, String tag, String storageUrl, Boolean enabled, String updatedAt) {
    }
}
