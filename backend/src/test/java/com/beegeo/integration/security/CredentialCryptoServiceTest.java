package com.beegeo.integration.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.beegeo.common.api.BusinessException;
import org.junit.jupiter.api.Test;

class CredentialCryptoServiceTest {

    @Test
    void shouldEncryptAndDecryptCredential() {
        CredentialCryptoService service = new CredentialCryptoService("local-private-secret");

        String encrypted = service.encrypt("token-cookie-secret");
        String decrypted = service.decrypt(encrypted);

        assertNotEquals("token-cookie-secret", encrypted);
        assertTrue(encrypted.contains(":"));
        assertEquals("token-cookie-secret", decrypted);
    }

    @Test
    void shouldRejectInvalidCredentialCipherText() {
        CredentialCryptoService service = new CredentialCryptoService("local-private-secret");

        BusinessException exception = assertThrows(BusinessException.class, () -> service.decrypt("invalid-cipher-text"));

        assertEquals("CREDENTIAL_FORMAT_INVALID", exception.code());
    }

    @Test
    void shouldRejectCipherTextWithWrongSecret() {
        CredentialCryptoService source = new CredentialCryptoService("local-private-secret");
        CredentialCryptoService target = new CredentialCryptoService("another-private-secret");
        String encrypted = source.encrypt("token-cookie-secret");

        BusinessException exception = assertThrows(BusinessException.class, () -> target.decrypt(encrypted));

        assertEquals("CREDENTIAL_DECRYPT_FAILED", exception.code());
    }
}
