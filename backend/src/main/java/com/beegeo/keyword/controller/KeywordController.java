package com.beegeo.keyword.controller;

import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.security.RequireRole;
import com.beegeo.auth.domain.UserRole;
import com.beegeo.keyword.application.KeywordApplicationService;
import com.beegeo.keyword.application.KeywordCommand;
import com.beegeo.keyword.domain.KeywordEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@RequestMapping("/api/keywords")
public class KeywordController {
    private final KeywordApplicationService keywordApplicationService;

    public KeywordController(KeywordApplicationService keywordApplicationService) {
        this.keywordApplicationService = keywordApplicationService;
    }

    @GetMapping
    public ApiResponse<List<KeywordView>> list(@RequestParam(required = false) String keyword) {
        return ApiResponse.ok(keywordApplicationService.list(keyword).stream().map(this::toView).toList());
    }

    @GetMapping("/{id}")
    public ApiResponse<KeywordView> detail(@PathVariable Long id) {
        return ApiResponse.ok(toView(keywordApplicationService.detail(id)));
    }

    @PostMapping
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<KeywordView> create(@Valid @RequestBody KeywordRequest request) {
        return ApiResponse.ok(toView(keywordApplicationService.create(toCommand(request))));
    }

    @PutMapping("/{id}")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<KeywordView> update(@PathVariable Long id, @Valid @RequestBody KeywordRequest request) {
        return ApiResponse.ok(toView(keywordApplicationService.update(id, toCommand(request))));
    }

    @DeleteMapping("/{id}")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        keywordApplicationService.delete(id);
        return ApiResponse.ok(Boolean.TRUE);
    }

    private KeywordCommand toCommand(KeywordRequest request) {
        return new KeywordCommand(request.name(), request.groupName(), request.description(), request.enabled());
    }

    private KeywordView toView(KeywordEntity entity) {
        return new KeywordView(
            entity.getId(),
            entity.getName(),
            entity.getGroupName(),
            entity.getDescription(),
            entity.getEnabled(),
            entity.getUpdatedAt().toLocalDate().toString()
        );
    }

    public record KeywordRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String groupName,
        @Size(max = 500) String description,
        Boolean enabled
    ) {
    }

    public record KeywordView(Long id, String name, String groupName, String description, Boolean enabled, String updatedAt) {
    }
}
