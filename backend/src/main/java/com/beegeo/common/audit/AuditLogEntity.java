package com.beegeo.common.audit;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_logs")
public class AuditLogEntity extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String module;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(name = "target_id", length = 160)
    private String targetId;

    @Column(name = "operator_account", nullable = false, length = 120)
    private String operatorAccount;

    @Column(name = "operator_name", nullable = false, length = 80)
    private String operatorName;

    @Column(name = "operator_role", nullable = false, length = 60)
    private String operatorRole;

    @Column(name = "client_ip", nullable = false, length = 80)
    private String clientIp;

    @Column(name = "request_uri", nullable = false, length = 300)
    private String requestUri;

    @Column(nullable = false)
    private Boolean success;

    protected AuditLogEntity() {
    }

    public AuditLogEntity(
        String module,
        String action,
        String targetId,
        String operatorAccount,
        String operatorName,
        String operatorRole,
        String clientIp,
        String requestUri,
        Boolean success
    ) {
        this.module = module;
        this.action = action;
        this.targetId = targetId;
        this.operatorAccount = operatorAccount;
        this.operatorName = operatorName;
        this.operatorRole = operatorRole;
        this.clientIp = clientIp;
        this.requestUri = requestUri;
        this.success = success;
    }

    public String getModule() {
        return module;
    }

    public String getAction() {
        return action;
    }

    public String getTargetId() {
        return targetId;
    }

    public String getOperatorAccount() {
        return operatorAccount;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public String getOperatorRole() {
        return operatorRole;
    }

    public String getClientIp() {
        return clientIp;
    }

    public String getRequestUri() {
        return requestUri;
    }

    public Boolean getSuccess() {
        return success;
    }
}
