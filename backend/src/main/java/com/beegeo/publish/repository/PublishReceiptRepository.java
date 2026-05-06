package com.beegeo.publish.repository;

import com.beegeo.publish.domain.PublishReceiptEntity;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublishReceiptRepository extends JpaRepository<PublishReceiptEntity, Long> {

    List<PublishReceiptEntity> findByTaskId(Long taskId, Sort sort);
}
