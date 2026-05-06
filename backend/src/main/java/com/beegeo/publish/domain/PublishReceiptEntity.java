package com.beegeo.publish.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "publish_receipts")
public class PublishReceiptEntity extends BaseEntity {
    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "platform_code", nullable = false, length = 60)
    private String platformCode;

    @Column(name = "account_id", nullable = false, length = 80)
    private String accountId;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "external_publish_id", length = 160)
    private String externalPublishId;

    @Column(length = 500)
    private String url;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    protected PublishReceiptEntity() {
    }

    public PublishReceiptEntity(PublishTaskEntity task, PublishReceipt receipt, Integer attemptNo) {
        this.taskId = task.getId();
        this.platformCode = task.getPlatformCode();
        this.accountId = task.getAccountId();
        this.attemptNo = attemptNo;
        this.success = receipt.success();
        this.externalPublishId = blankToNull(receipt.externalPublishId());
        this.url = blankToNull(receipt.url());
        this.message = receipt.message();
        this.publishedAt = receipt.publishedAt();
    }

    public Long getTaskId() {
        return taskId;
    }

    public String getPlatformCode() {
        return platformCode;
    }

    public String getAccountId() {
        return accountId;
    }

    public Integer getAttemptNo() {
        return attemptNo;
    }

    public Boolean getSuccess() {
        return success;
    }

    public String getExternalPublishId() {
        return externalPublishId;
    }

    public String getUrl() {
        return url;
    }

    public String getMessage() {
        return message;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
