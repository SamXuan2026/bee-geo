package com.beegeo.auth.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_users")
public class AppUserEntity extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String account;

    @Column(name = "role_code", nullable = false, length = 60)
    private String roleCode;

    @Column(name = "role_name", nullable = false, length = 80)
    private String roleName;

    @Column(nullable = false, length = 40)
    private String status;

    protected AppUserEntity() {
    }

    public AppUserEntity(String name, String account, String roleCode, String roleName, String status) {
        update(name, account, roleCode, roleName, status);
    }

    public void update(String name, String account, String roleCode, String roleName, String status) {
        this.name = name;
        this.account = account;
        this.roleCode = roleCode;
        this.roleName = roleName;
        this.status = status;
    }

    public String getName() {
        return name;
    }

    public String getAccount() {
        return account;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public String getRoleName() {
        return roleName;
    }

    public String getStatus() {
        return status;
    }
}
