package com.beegeo.keyword.repository;

import com.beegeo.keyword.domain.KeywordEntity;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KeywordRepository extends JpaRepository<KeywordEntity, Long> {

    List<KeywordEntity> findByNameContainingIgnoreCaseOrGroupNameContainingIgnoreCase(String name, String groupName, Sort sort);
}
