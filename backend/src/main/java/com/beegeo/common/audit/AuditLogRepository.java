package com.beegeo.common.audit;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long>, JpaSpecificationExecutor<AuditLogEntity> {

    List<AuditLogEntity> findByModuleContainingIgnoreCaseOrActionContainingIgnoreCaseOrOperatorAccountContainingIgnoreCase(
        String module,
        String action,
        String operatorAccount,
        Sort sort
    );
}
