package com.beegeo.geo.repository;

import com.beegeo.geo.domain.GeoTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GeoTaskRepository extends JpaRepository<GeoTaskEntity, Long> {
}
