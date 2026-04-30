package com.beegeo.geo.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "geo_results")
public class GeoResultEntity extends BaseEntity {
    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(nullable = false, length = 120)
    private String keyword;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(name = "ai_title", nullable = false, length = 180)
    private String aiTitle;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false, length = 80)
    private String media;

    @Column(nullable = false, length = 1000)
    private String description;

    protected GeoResultEntity() {
    }

    public GeoResultEntity(Long taskId, String keyword, String question, String aiTitle, String url, String media, String description) {
        this.taskId = taskId;
        this.keyword = keyword;
        this.question = question;
        this.aiTitle = aiTitle;
        this.url = url;
        this.media = media;
        this.description = description;
    }

    public Long getTaskId() {
        return taskId;
    }

    public String getKeyword() {
        return keyword;
    }

    public String getQuestion() {
        return question;
    }

    public String getAiTitle() {
        return aiTitle;
    }

    public String getUrl() {
        return url;
    }

    public String getMedia() {
        return media;
    }

    public String getDescription() {
        return description;
    }
}
