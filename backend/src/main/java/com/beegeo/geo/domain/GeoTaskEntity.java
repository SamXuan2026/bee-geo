package com.beegeo.geo.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "geo_tasks")
public class GeoTaskEntity extends BaseEntity {
    @Column(nullable = false, length = 120)
    private String keyword;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount = 0;

    protected GeoTaskEntity() {
    }

    public GeoTaskEntity(String keyword) {
        this.keyword = keyword;
        this.status = "分析中";
    }

    public void markCompleted(int questionCount) {
        this.status = "已完成";
        this.questionCount = questionCount;
    }

    public String getKeyword() {
        return keyword;
    }

    public String getStatus() {
        return status;
    }

    public Integer getQuestionCount() {
        return questionCount;
    }
}
