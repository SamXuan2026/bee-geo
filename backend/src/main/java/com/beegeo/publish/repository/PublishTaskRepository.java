package com.beegeo.publish.repository;

import com.beegeo.publish.domain.PublishStatus;
import com.beegeo.publish.domain.PublishTaskEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublishTaskRepository extends JpaRepository<PublishTaskEntity, Long> {

    List<PublishTaskEntity> findByStatusAndScheduledAtLessThanEqual(PublishStatus status, LocalDateTime scheduledAt, Pageable pageable);

    List<PublishTaskEntity> findByStatus(PublishStatus status, Sort sort);
}
