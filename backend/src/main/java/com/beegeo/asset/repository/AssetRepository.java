package com.beegeo.asset.repository;

import com.beegeo.asset.domain.AssetEntity;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<AssetEntity, Long> {

    List<AssetEntity> findByNameContainingIgnoreCaseOrTagContainingIgnoreCase(String name, String tag, Sort sort);
}
