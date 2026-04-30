package com.beegeo.publish.repository;

import com.beegeo.publish.domain.PublishAccountEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublishAccountRepository extends JpaRepository<PublishAccountEntity, Long> {

    Optional<PublishAccountEntity> findByAccountIdAndPlatformCode(String accountId, String platformCode);

    Optional<PublishAccountEntity> findByAccountId(String accountId);
}
