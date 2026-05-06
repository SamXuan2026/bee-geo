package com.beegeo.keyword.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "keywords")
public class KeywordEntity extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Boolean enabled = true;

    protected KeywordEntity() {
    }

    public KeywordEntity(String name, String groupName, String description, Boolean enabled) {
        update(name, groupName, description, enabled);
    }

    public void update(String name, String groupName, String description, Boolean enabled) {
        this.name = name;
        this.groupName = groupName;
        this.description = description;
        this.enabled = enabled;
    }

    public String getName() {
        return name;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getDescription() {
        return description;
    }

    public Boolean getEnabled() {
        return enabled;
    }
}
