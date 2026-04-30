package com.beegeo.creation.repository;

import com.beegeo.creation.domain.CreationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreationRepository extends JpaRepository<CreationEntity, Long> {
}
