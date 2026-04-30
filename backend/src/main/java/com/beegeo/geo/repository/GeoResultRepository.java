package com.beegeo.geo.repository;

import com.beegeo.geo.domain.GeoResultEntity;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GeoResultRepository extends JpaRepository<GeoResultEntity, Long> {

    List<GeoResultEntity> findByTaskId(Long taskId, Sort sort);
}
