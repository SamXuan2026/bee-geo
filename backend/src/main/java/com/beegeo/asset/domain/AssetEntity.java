package com.beegeo.asset.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "assets")
public class AssetEntity extends BaseEntity {
    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 120)
    private String tag;

    @Column(name = "storage_url", length = 500)
    private String storageUrl;

    @Column(nullable = false)
    private Boolean enabled = true;

    protected AssetEntity() {
    }

    public AssetEntity(String name, String type, String tag, String storageUrl, Boolean enabled) {
        update(name, type, tag, storageUrl, enabled);
    }

    public void update(String name, String type, String tag, String storageUrl, Boolean enabled) {
        this.name = name;
        this.type = type;
        this.tag = tag;
        this.storageUrl = storageUrl;
        this.enabled = enabled;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public String getTag() {
        return tag;
    }

    public String getStorageUrl() {
        return storageUrl;
    }

    public Boolean getEnabled() {
        return enabled;
    }
}
