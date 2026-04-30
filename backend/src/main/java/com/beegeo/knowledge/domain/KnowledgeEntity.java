package com.beegeo.knowledge.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "knowledge_items")
public class KnowledgeEntity extends BaseEntity {
    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Column(length = 4000)
    private String content;

    @Column(nullable = false)
    private Boolean enabled = true;

    protected KnowledgeEntity() {
    }

    public KnowledgeEntity(String name, String type, String groupName, String content, Boolean enabled) {
        update(name, type, groupName, content, enabled);
    }

    public void update(String name, String type, String groupName, String content, Boolean enabled) {
        this.name = name;
        this.type = type;
        this.groupName = groupName;
        this.content = content;
        this.enabled = enabled;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getContent() {
        return content;
    }

    public Boolean getEnabled() {
        return enabled;
    }
}
