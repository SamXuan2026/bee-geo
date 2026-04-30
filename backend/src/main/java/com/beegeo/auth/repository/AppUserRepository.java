package com.beegeo.auth.repository;

import com.beegeo.auth.domain.AppUserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUserEntity, Long> {

    List<AppUserEntity> findByNameContainingIgnoreCaseOrAccountContainingIgnoreCase(String name, String account, Sort sort);

    Optional<AppUserEntity> findByAccount(String account);

    Optional<AppUserEntity> findFirstByRoleCodeAndStatusOrderByIdAsc(String roleCode, String status);
}
