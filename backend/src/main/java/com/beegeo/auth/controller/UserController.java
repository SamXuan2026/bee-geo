package com.beegeo.auth.controller;

import com.beegeo.auth.application.UserApplicationService;
import com.beegeo.auth.application.UserCommand;
import com.beegeo.auth.domain.AppUserEntity;
import com.beegeo.auth.domain.UserRole;
import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.security.RequireRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Arrays;
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
@RequestMapping("/api/users")
@RequireRole({UserRole.SUPER_ADMIN})
public class UserController {
    private final UserApplicationService userApplicationService;

    public UserController(UserApplicationService userApplicationService) {
        this.userApplicationService = userApplicationService;
    }

    @GetMapping
    public ApiResponse<List<UserView>> list(@RequestParam(required = false) String keyword) {
        return ApiResponse.ok(userApplicationService.list(keyword).stream().map(this::toView).toList());
    }

    @GetMapping("/{id}")
    public ApiResponse<UserView> detail(@PathVariable Long id) {
        return ApiResponse.ok(toView(userApplicationService.detail(id)));
    }

    @PostMapping
    public ApiResponse<UserView> create(@Valid @RequestBody UserRequest request) {
        return ApiResponse.ok(toView(userApplicationService.create(toCommand(request))));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserView> update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ApiResponse.ok(toView(userApplicationService.update(id, toCommand(request))));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        userApplicationService.delete(id);
        return ApiResponse.ok(Boolean.TRUE);
    }

    @GetMapping("/roles")
    public ApiResponse<List<RoleView>> roles() {
        return ApiResponse.ok(Arrays.stream(UserRole.values())
            .map(role -> new RoleView(role.code(), role.displayName()))
            .toList());
    }

    private UserCommand toCommand(UserRequest request) {
        return new UserCommand(request.name(), request.account(), request.roleCode(), request.status());
    }

    private UserView toView(AppUserEntity entity) {
        return new UserView(
            entity.getId(),
            entity.getName(),
            entity.getAccount(),
            entity.getRoleCode(),
            entity.getRoleName(),
            entity.getStatus()
        );
    }

    public record UserRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 120) String account,
        @NotBlank @Size(max = 60) String roleCode,
        @Size(max = 40) String status
    ) {
    }

    public record RoleView(String code, String name) {
    }

    public record UserView(Long id, String name, String account, String roleCode, String role, String status) {
    }
}
