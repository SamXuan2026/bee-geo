package com.beegeo.integration.adapter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.integration.domain.PublishCredentialEntity;
import com.beegeo.integration.repository.PublishCredentialRepository;
import com.beegeo.integration.security.CredentialCryptoService;
import com.beegeo.publish.domain.PublishAccountEntity;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.repository.PublishAccountRepository;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class JpaCredentialAdapterTest {
    private final PublishCredentialRepository credentialRepository = mock(PublishCredentialRepository.class);
    private final PublishAccountRepository accountRepository = mock(PublishAccountRepository.class);
    private final CredentialCryptoService cryptoService = mock(CredentialCryptoService.class);
    private final AuditEventPublisher auditEventPublisher = mock(AuditEventPublisher.class);
    private final JpaCredentialAdapter adapter = new JpaCredentialAdapter(
        credentialRepository,
        accountRepository,
        cryptoService,
        auditEventPublisher,
        "******"
    );

    @Test
    void shouldEncryptAndSaveCredentialAndMarkAccountValid() {
        PublishAccountEntity account = account("site-main", "OWNED_SITE", "EXPIRED");
        when(accountRepository.findByAccountIdAndPlatformCode("site-main", "OWNED_SITE")).thenReturn(Optional.of(account));
        when(credentialRepository.findByAccountId("site-main")).thenReturn(Optional.empty());
        when(cryptoService.encrypt("plain-secret")).thenReturn("encrypted-secret");

        adapter.encryptAndSave("site-main", "OWNED_SITE", "plain-secret");

        ArgumentCaptor<PublishCredentialEntity> credentialCaptor = ArgumentCaptor.forClass(PublishCredentialEntity.class);
        verify(credentialRepository).save(credentialCaptor.capture());
        assertEquals("site-main", credentialCaptor.getValue().getAccountId());
        assertEquals("OWNED_SITE", credentialCaptor.getValue().getPlatformCode());
        assertEquals("encrypted-secret", credentialCaptor.getValue().getEncryptedSecret());
        assertEquals("VALID", account.getStatus());
        verify(auditEventPublisher).publish("integration", "saveCredential", "site-main", "system", true);
    }

    @Test
    void shouldLoadMaskedAndPlainCredential() {
        PublishCredentialEntity entity = new PublishCredentialEntity("site-main", "OWNED_SITE", "encrypted-secret");
        when(credentialRepository.findByAccountId("site-main")).thenReturn(Optional.of(entity));
        when(cryptoService.decrypt("encrypted-secret")).thenReturn("plain-secret");

        assertEquals("******", adapter.loadMasked("site-main"));
        PublishCredential credential = adapter.loadPlainForPublish("site-main", "OWNED_SITE");

        assertEquals("site-main", credential.accountId());
        assertEquals("OWNED_SITE", credential.platformCode());
        assertEquals("plain-secret", credential.secretValue());
    }

    @Test
    void shouldRejectPlatformMismatchWhenLoadPlainCredential() {
        PublishCredentialEntity entity = new PublishCredentialEntity("site-main", "OWNED_SITE", "encrypted-secret");
        when(credentialRepository.findByAccountId("site-main")).thenReturn(Optional.of(entity));

        BusinessException exception = assertThrows(BusinessException.class, () -> adapter.loadPlainForPublish("site-main", "FREE_MEDIA"));

        assertEquals("CREDENTIAL_PLATFORM_MISMATCH", exception.code());
    }

    @Test
    void shouldMarkCredentialAndAccountExpired() {
        PublishCredentialEntity credential = new PublishCredentialEntity("site-main", "OWNED_SITE", "encrypted-secret");
        PublishAccountEntity account = account("site-main", "OWNED_SITE", "VALID");
        when(credentialRepository.findByAccountId("site-main")).thenReturn(Optional.of(credential));
        when(accountRepository.findByAccountId("site-main")).thenReturn(Optional.of(account));

        adapter.markExpired("site-main");

        assertNotNull(credential.getExpiredAt());
        assertEquals("EXPIRED", account.getStatus());
        verify(auditEventPublisher).publish("integration", "expireCredential", "site-main", "system", true);
    }

    private PublishAccountEntity account(String accountId, String platformCode, String status) {
        PublishAccountEntity account = instantiate(PublishAccountEntity.class);
        setField(account, "accountId", accountId);
        setField(account, "platformCode", platformCode);
        setField(account, "platformName", "自有站点");
        setField(account, "name", "主站账号");
        setField(account, "endpoint", "https://site.local");
        setField(account, "status", status);
        return account;
    }

    private <T> T instantiate(Class<T> type) {
        try {
            Constructor<T> constructor = type.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("创建凭据测试实体失败", ex);
        }
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("设置凭据测试字段失败", ex);
        }
    }
}
