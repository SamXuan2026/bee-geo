package com.beegeo.creation.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "creations")
public class CreationEntity extends BaseEntity {
    @Column(name = "geo_task_id")
    private Long geoTaskId;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 80)
    private String brand;

    @Column(nullable = false, length = 80)
    private String platform;

    @Column(length = 500)
    private String summary;

    @Column(nullable = false, length = 8000)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private CreationStatus status;

    @Column(name = "publish_at")
    private LocalDateTime publishAt;

    protected CreationEntity() {
    }

    public CreationEntity(Long geoTaskId, String title, String brand, String platform, String summary, String body) {
        this.geoTaskId = geoTaskId;
        this.title = title;
        this.brand = brand;
        this.platform = platform;
        this.summary = summary;
        this.body = body;
        this.status = CreationStatus.DRAFT;
    }

    public void updateContent(String title, String brand, String platform, String summary, String body) {
        this.title = title;
        this.brand = brand;
        this.platform = platform;
        this.summary = summary;
        this.body = body;
    }

    public void submitReview() {
        this.status = CreationStatus.PENDING_REVIEW;
    }

    public void approve() {
        this.status = CreationStatus.APPROVED;
    }

    public void reject() {
        this.status = CreationStatus.REJECTED;
    }

    public void schedule(LocalDateTime publishAt) {
        this.publishAt = publishAt;
        this.status = CreationStatus.SCHEDULED;
    }

    public Long getGeoTaskId() {
        return geoTaskId;
    }

    public String getTitle() {
        return title;
    }

    public String getBrand() {
        return brand;
    }

    public String getPlatform() {
        return platform;
    }

    public String getSummary() {
        return summary;
    }

    public String getBody() {
        return body;
    }

    public CreationStatus getStatus() {
        return status;
    }

    public LocalDateTime getPublishAt() {
        return publishAt;
    }
}
