package com.beegeo.integration.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "publish_credentials")
public class PublishCredentialEntity extends BaseEntity {
    @Column(name = "account_id", nullable = false, unique = true, length = 80)
    private String accountId;

    @Column(name = "platform_code", nullable = false, length = 60)
    private String platformCode;

    @Column(name = "encrypted_secret", nullable = false, length = 4000)
    private String encryptedSecret;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    protected PublishCredentialEntity() {
    }

    public PublishCredentialEntity(String accountId, String platformCode, String encryptedSecret) {
        this.accountId = accountId;
        this.platformCode = platformCode;
        this.encryptedSecret = encryptedSecret;
    }

    public void refresh(String platformCode, String encryptedSecret) {
        this.platformCode = platformCode;
        this.encryptedSecret = encryptedSecret;
        this.expiredAt = null;
    }

    public void markExpired() {
        this.expiredAt = LocalDateTime.now();
    }

    public String getAccountId() {
        return accountId;
    }

    public String getPlatformCode() {
        return platformCode;
    }

    public String getEncryptedSecret() {
        return encryptedSecret;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }
}
