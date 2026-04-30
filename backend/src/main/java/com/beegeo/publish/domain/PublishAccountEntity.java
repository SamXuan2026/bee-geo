package com.beegeo.publish.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "publish_accounts")
public class PublishAccountEntity extends BaseEntity {
    @Column(name = "account_id", nullable = false, unique = true, length = 80)
    private String accountId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "platform_code", nullable = false, length = 60)
    private String platformCode;

    @Column(name = "platform_name", nullable = false, length = 80)
    private String platformName;

    @Column(length = 500)
    private String endpoint;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "expires_at")
    private LocalDate expiresAt;

    protected PublishAccountEntity() {
    }

    public void updateStatus(String status) {
        this.status = status;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getName() {
        return name;
    }

    public String getPlatformCode() {
        return platformCode;
    }

    public String getPlatformName() {
        return platformName;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getStatus() {
        return status;
    }

    public LocalDate getExpiresAt() {
        return expiresAt;
    }
}
