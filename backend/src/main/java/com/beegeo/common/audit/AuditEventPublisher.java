package com.beegeo.common.audit;

import com.beegeo.common.security.CurrentOperator;
import com.beegeo.common.security.CurrentOperatorHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuditEventPublisher {
    private final AuditLogRepository auditLogRepository;

    public AuditEventPublisher(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void publish(String module, String action, String targetId, String operator, boolean success) {
        CurrentOperator currentOperator = CurrentOperatorHolder.get();
        String operatorAccount = operator == null || operator.isBlank() || "system".equals(operator)
            ? currentOperator.account()
            : operator;
        auditLogRepository.save(new AuditLogEntity(
            module,
            action,
            targetId,
            operatorAccount,
            currentOperator.name(),
            currentOperator.role().code(),
            currentOperator.clientIp(),
            currentOperator.requestUri(),
            success
        ));
    }
}
