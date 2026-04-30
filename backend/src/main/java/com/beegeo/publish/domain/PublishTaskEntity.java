package com.beegeo.publish.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "publish_tasks")
public class PublishTaskEntity extends BaseEntity {
    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 8000)
    private String body;

    @Column(name = "platform_code", nullable = false, length = 60)
    private String platformCode;

    @Column(name = "platform_name", nullable = false, length = 80)
    private String platformName;

    @Column(name = "account_id", nullable = false, length = 80)
    private String accountId;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PublishStatus status;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "max_retry_count", nullable = false)
    private Integer maxRetryCount = 3;

    @Column(name = "last_receipt_message", length = 1000)
    private String lastReceiptMessage;

    @Column(name = "external_publish_id", length = 160)
    private String externalPublishId;

    @Column(name = "publish_url", length = 500)
    private String publishUrl;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    protected PublishTaskEntity() {
    }

    public PublishTaskEntity(
        Long contentId,
        String title,
        String body,
        PublishAccountEntity account,
        LocalDateTime scheduledAt,
        Integer maxRetryCount
    ) {
        this.contentId = contentId;
        this.title = title;
        this.body = body;
        this.platformCode = account.getPlatformCode();
        this.platformName = account.getPlatformName();
        this.accountId = account.getAccountId();
        this.accountName = account.getName();
        this.scheduledAt = scheduledAt;
        this.status = PublishStatus.SCHEDULED;
        this.maxRetryCount = maxRetryCount;
        this.lastReceiptMessage = "等待发布";
    }

    public void markPublishing() {
        status = PublishStatus.PUBLISHING;
        lastAttemptAt = LocalDateTime.now();
    }

    public void markPublished(PublishReceipt receipt) {
        status = PublishStatus.PUBLISHED;
        externalPublishId = receipt.externalPublishId();
        publishUrl = receipt.url();
        publishedAt = receipt.publishedAt();
        lastReceiptMessage = receipt.message();
    }

    public void markFailed(PublishReceipt receipt) {
        retryCount = retryCount + 1;
        status = retryCount >= maxRetryCount ? PublishStatus.MANUAL_REQUIRED : PublishStatus.FAILED;
        externalPublishId = blankToNull(receipt.externalPublishId());
        publishUrl = blankToNull(receipt.url());
        lastReceiptMessage = receipt.message();
    }

    public void markManualRequired(String message) {
        status = PublishStatus.MANUAL_REQUIRED;
        lastAttemptAt = LocalDateTime.now();
        lastReceiptMessage = message;
    }

    public void markRevoked(PublishReceipt receipt) {
        status = PublishStatus.REVOKED;
        lastReceiptMessage = receipt.message();
    }

    public Long getContentId() {
        return contentId;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public String getPlatformCode() {
        return platformCode;
    }

    public String getPlatformName() {
        return platformName;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getAccountName() {
        return accountName;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public PublishStatus getStatus() {
        return status;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public Integer getMaxRetryCount() {
        return maxRetryCount;
    }

    public String getLastReceiptMessage() {
        return lastReceiptMessage;
    }

    public String getExternalPublishId() {
        return externalPublishId;
    }

    public String getPublishUrl() {
        return publishUrl;
    }

    public LocalDateTime getLastAttemptAt() {
        return lastAttemptAt;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
