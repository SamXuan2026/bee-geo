package com.beegeo.integration.controller;

import com.beegeo.auth.domain.UserRole;
import com.beegeo.common.api.ApiResponse;
import com.beegeo.common.security.RequireRole;
import com.beegeo.integration.port.CredentialPort;
import com.beegeo.publish.domain.PublishAccountEntity;
import com.beegeo.publish.repository.PublishAccountRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {
    private final CredentialPort credentialPort;
    private final PublishAccountRepository publishAccountRepository;

    public IntegrationController(CredentialPort credentialPort, PublishAccountRepository publishAccountRepository) {
        this.credentialPort = credentialPort;
        this.publishAccountRepository = publishAccountRepository;
    }

    @GetMapping("/accounts")
    public ApiResponse<List<IntegrationAccountView>> listAccounts() {
        return ApiResponse.ok(publishAccountRepository.findAll(Sort.by(Sort.Direction.ASC, "platformCode", "name")).stream()
            .map(this::toView)
            .toList());
    }

    @PostMapping("/accounts")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.PUBLISHER})
    public ApiResponse<Void> saveCredential(@Valid @RequestBody SaveCredentialRequest request) {
        credentialPort.encryptAndSave(request.accountId(), request.platformCode(), request.secretValue());
        return ApiResponse.ok(null);
    }

    @PostMapping("/accounts/expire")
    @RequireRole({UserRole.SUPER_ADMIN, UserRole.PUBLISHER})
    public ApiResponse<Void> expireCredential(@Valid @RequestBody ExpireCredentialRequest request) {
        credentialPort.markExpired(request.accountId());
        return ApiResponse.ok(null);
    }

    private IntegrationAccountView toView(PublishAccountEntity account) {
        return new IntegrationAccountView(
            account.getId(),
            account.getAccountId(),
            account.getName(),
            account.getPlatformCode(),
            account.getPlatformName(),
            account.getEndpoint(),
            credentialPort.loadMasked(account.getAccountId()),
            account.getStatus(),
            account.getExpiresAt() == null ? "" : account.getExpiresAt().toString()
        );
    }

    public record IntegrationAccountView(
        Long id,
        String accountId,
        String name,
        String platformCode,
        String platformName,
        String endpoint,
        String maskedCredential,
        String status,
        String expiresAt
    ) {
    }

    public record SaveCredentialRequest(
        @NotBlank @Size(max = 80) String accountId,
        @NotBlank @Size(max = 60) String platformCode,
        @NotBlank @Size(max = 4000) String secretValue
    ) {
    }

    public record ExpireCredentialRequest(@NotBlank @Size(max = 80) String accountId) {
    }
}
