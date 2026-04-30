package com.beegeo.knowledge.controller;

import com.beegeo.common.api.ApiResponse;
import com.beegeo.knowledge.application.KnowledgeApplicationService;
import com.beegeo.knowledge.application.KnowledgeCommand;
import com.beegeo.knowledge.domain.KnowledgeEntity;
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
@RequestMapping("/api/knowledge")
public class KnowledgeController {
    private final KnowledgeApplicationService knowledgeApplicationService;

    public KnowledgeController(KnowledgeApplicationService knowledgeApplicationService) {
        this.knowledgeApplicationService = knowledgeApplicationService;
    }

    @GetMapping
    public ApiResponse<List<KnowledgeView>> list(@RequestParam(required = false) String keyword) {
        return ApiResponse.ok(knowledgeApplicationService.list(keyword).stream().map(this::toView).toList());
    }

    @GetMapping("/{id}")
    public ApiResponse<KnowledgeView> detail(@PathVariable Long id) {
        return ApiResponse.ok(toView(knowledgeApplicationService.detail(id)));
    }

    @PostMapping
    public ApiResponse<KnowledgeView> create(@Valid @RequestBody KnowledgeRequest request) {
        return ApiResponse.ok(toView(knowledgeApplicationService.create(toCommand(request))));
    }

    @PutMapping("/{id}")
    public ApiResponse<KnowledgeView> update(@PathVariable Long id, @Valid @RequestBody KnowledgeRequest request) {
        return ApiResponse.ok(toView(knowledgeApplicationService.update(id, toCommand(request))));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        knowledgeApplicationService.delete(id);
        return ApiResponse.ok(Boolean.TRUE);
    }

    private KnowledgeCommand toCommand(KnowledgeRequest request) {
        return new KnowledgeCommand(request.name(), request.type(), request.groupName(), request.content(), request.enabled());
    }

    private KnowledgeView toView(KnowledgeEntity entity) {
        return new KnowledgeView(
            entity.getId(),
            entity.getName(),
            entity.getType(),
            entity.getGroupName(),
            entity.getContent(),
            entity.getEnabled(),
            entity.getUpdatedAt().toLocalDate().toString()
        );
    }

    public record KnowledgeRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 40) String type,
        @NotBlank @Size(max = 100) String groupName,
        @Size(max = 4000) String content,
        Boolean enabled
    ) {
    }

    public record KnowledgeView(Long id, String name, String type, String groupName, String content, Boolean enabled, String updatedAt) {
    }
}
