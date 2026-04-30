package com.beegeo.integration.repository;

import com.beegeo.integration.domain.PublishCredentialEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublishCredentialRepository extends JpaRepository<PublishCredentialEntity, Long> {

    Optional<PublishCredentialEntity> findByAccountId(String accountId);
}
