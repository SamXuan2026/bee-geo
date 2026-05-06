package com.beegeo.persona.controller;

import com.beegeo.common.ai.AiProvider;
import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.security.RequireRole;
import com.beegeo.auth.domain.UserRole;
import com.beegeo.persona.application.PersonaApplicationService;
import com.beegeo.persona.application.PersonaCommand;
import com.beegeo.persona.domain.PersonaEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/personas")
public class PersonaController {
    private final AiProvider aiProvider;
    private final PersonaApplicationService personaApplicationService;

    public PersonaController(AiProvider aiProvider, PersonaApplicationService personaApplicationService) {
        this.aiProvider = aiProvider;
        this.personaApplicationService = personaApplicationService;
    }

    @GetMapping
    public ApiResponse<List<PersonaView>> list(@RequestParam(required = false) String keyword) {
        return ApiResponse.ok(personaApplicationService.list(keyword).stream().map(this::toView).toList());
    }

    @GetMapping("/{id}")
    public ApiResponse<PersonaView> detail(@PathVariable Long id) {
        return ApiResponse.ok(toView(personaApplicationService.detail(id)));
    }

    @PostMapping
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<PersonaView> create(@Valid @RequestBody PersonaRequest request) {
        return ApiResponse.ok(toView(personaApplicationService.create(toCommand(request))));
    }

    @PutMapping("/{id}")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<PersonaView> update(@PathVariable Long id, @Valid @RequestBody PersonaRequest request) {
        return ApiResponse.ok(toView(personaApplicationService.update(id, toCommand(request))));
    }

    @DeleteMapping("/{id}")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        personaApplicationService.delete(id);
        return ApiResponse.ok(Boolean.TRUE);
    }

    @PostMapping("/generate")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN})
    public ApiResponse<String> generate(@Valid @RequestBody GeneratePersonaRequest request) {
        return ApiResponse.ok(aiProvider.generatePersona(request.sourceText()));
    }

    private PersonaCommand toCommand(PersonaRequest request) {
        return new PersonaCommand(
            request.name(),
            request.creator(),
            request.roleName(),
            request.tone(),
            request.status(),
            request.promptTemplate()
        );
    }

    private PersonaView toView(PersonaEntity entity) {
        return new PersonaView(
            entity.getId(),
            entity.getName(),
            entity.getCreator(),
            entity.getRoleName(),
            entity.getTone(),
            entity.getStatus(),
            entity.getPromptTemplate()
        );
    }

    public record PersonaRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 80) String creator,
        @NotBlank @Size(max = 100) String roleName,
        @Size(max = 100) String tone,
        @Size(max = 40) String status,
        @Size(max = 4000) String promptTemplate
    ) {
    }

    public record PersonaView(Long id, String name, String creator, String role, String tone, String status, String promptTemplate) {
    }

    public record GeneratePersonaRequest(@NotBlank String sourceText) {
    }
}
