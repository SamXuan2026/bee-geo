package com.beegeo.integration.security;

import com.beegeo.common.api.BusinessException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CredentialCryptoService {
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;

    private final SecretKeySpec secretKeySpec;
    private final SecureRandom secureRandom = new SecureRandom();

    public CredentialCryptoService(@Value("${bee-geo.security.credential-secret}") String credentialSecret) {
        this.secretKeySpec = new SecretKeySpec(normalizeKey(credentialSecret), "AES");
    }

    public String encrypt(String plainText) {
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(iv) + ":" + Base64.getEncoder().encodeToString(encrypted);
        } catch (GeneralSecurityException exception) {
            throw new BusinessException("CREDENTIAL_ENCRYPT_FAILED", "凭据加密失败");
        }
    }

    public String decrypt(String encryptedText) {
        try {
            String[] parts = encryptedText.split(":", 2);
            if (parts.length != 2) {
                throw new BusinessException("CREDENTIAL_FORMAT_INVALID", "凭据密文格式无效");
            }
            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] encrypted = Base64.getDecoder().decode(parts[1]);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException | GeneralSecurityException exception) {
            throw new BusinessException("CREDENTIAL_DECRYPT_FAILED", "凭据解密失败");
        }
    }

    private byte[] normalizeKey(String credentialSecret) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(credentialSecret.getBytes(StandardCharsets.UTF_8));
            return Arrays.copyOf(digest, 32);
        } catch (GeneralSecurityException exception) {
            throw new BusinessException("CREDENTIAL_KEY_INVALID", "凭据密钥不可用");
        }
    }
}
