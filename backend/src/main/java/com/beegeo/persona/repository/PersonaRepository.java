package com.beegeo.persona.repository;

import com.beegeo.persona.domain.PersonaEntity;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonaRepository extends JpaRepository<PersonaEntity, Long> {

    List<PersonaEntity> findByNameContainingIgnoreCaseOrRoleNameContainingIgnoreCase(String name, String roleName, Sort sort);
}
