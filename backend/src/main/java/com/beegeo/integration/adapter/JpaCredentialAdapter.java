package com.beegeo.integration.adapter;

import com.beegeo.common.api.BusinessException;
import com.beegeo.integration.domain.PublishCredentialEntity;
import com.beegeo.integration.port.CredentialPort;
import com.beegeo.integration.repository.PublishCredentialRepository;
import com.beegeo.integration.security.CredentialCryptoService;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.repository.PublishAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class JpaCredentialAdapter implements CredentialPort {
    private final PublishCredentialRepository publishCredentialRepository;
    private final PublishAccountRepository publishAccountRepository;
    private final CredentialCryptoService credentialCryptoService;
    private final String credentialMask;

    public JpaCredentialAdapter(
        PublishCredentialRepository publishCredentialRepository,
        PublishAccountRepository publishAccountRepository,
        CredentialCryptoService credentialCryptoService,
        @Value("${bee-geo.security.credential-mask}") String credentialMask
    ) {
        this.publishCredentialRepository = publishCredentialRepository;
        this.publishAccountRepository = publishAccountRepository;
        this.credentialCryptoService = credentialCryptoService;
        this.credentialMask = credentialMask;
    }

    @Override
    @Transactional
    public void encryptAndSave(String accountId, String platformCode, String secretValue) {
        ensureAccountExists(accountId, platformCode);
        String encryptedSecret = credentialCryptoService.encrypt(secretValue);
        PublishCredentialEntity entity = publishCredentialRepository.findByAccountId(accountId)
            .map(existing -> {
                existing.refresh(platformCode, encryptedSecret);
                return existing;
            })
            .orElseGet(() -> new PublishCredentialEntity(accountId, platformCode, encryptedSecret));
        publishCredentialRepository.save(entity);
        publishAccountRepository.findByAccountIdAndPlatformCode(accountId, platformCode)
            .ifPresent(account -> account.updateStatus("VALID"));
    }

    @Override
    @Transactional(readOnly = true)
    public String loadMasked(String accountId) {
        return publishCredentialRepository.findByAccountId(accountId)
            .filter(entity -> entity.getExpiredAt() == null)
            .map(entity -> credentialMask)
            .orElse("");
    }

    @Override
    @Transactional(readOnly = true)
    public PublishCredential loadPlainForPublish(String accountId, String platformCode) {
        PublishCredentialEntity entity = publishCredentialRepository.findByAccountId(accountId)
            .filter(credential -> credential.getExpiredAt() == null)
            .orElseThrow(() -> new BusinessException("CREDENTIAL_NOT_FOUND", "发布凭据不存在或已过期"));
        if (!platformCode.equals(entity.getPlatformCode())) {
            throw new BusinessException("CREDENTIAL_PLATFORM_MISMATCH", "发布凭据与平台不匹配");
        }
        return new PublishCredential(accountId, platformCode, credentialCryptoService.decrypt(entity.getEncryptedSecret()));
    }

    @Override
    @Transactional
    public void markExpired(String accountId) {
        publishCredentialRepository.findByAccountId(accountId).ifPresent(PublishCredentialEntity::markExpired);
        publishAccountRepository.findByAccountId(accountId).ifPresent(account -> account.updateStatus("EXPIRED"));
    }

    private void ensureAccountExists(String accountId, String platformCode) {
        publishAccountRepository.findByAccountIdAndPlatformCode(accountId, platformCode)
            .orElseThrow(() -> new BusinessException("PUBLISH_ACCOUNT_NOT_FOUND", "发布账号不存在"));
    }
}
