package com.beegeo.knowledge.repository;

import com.beegeo.knowledge.domain.KnowledgeEntity;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeRepository extends JpaRepository<KnowledgeEntity, Long> {

    List<KnowledgeEntity> findByNameContainingIgnoreCaseOrGroupNameContainingIgnoreCase(String name, String groupName, Sort sort);
}
