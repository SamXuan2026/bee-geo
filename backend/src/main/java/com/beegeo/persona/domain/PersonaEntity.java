package com.beegeo.persona.domain;

import com.beegeo.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "personas")
public class PersonaEntity extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 80)
    private String creator;

    @Column(name = "role_name", nullable = false, length = 100)
    private String roleName;

    @Column(length = 100)
    private String tone;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "prompt_template", length = 4000)
    private String promptTemplate;

    protected PersonaEntity() {
    }

    public PersonaEntity(String name, String creator, String roleName, String tone, String status, String promptTemplate) {
        update(name, creator, roleName, tone, status, promptTemplate);
    }

    public void update(String name, String creator, String roleName, String tone, String status, String promptTemplate) {
        this.name = name;
        this.creator = creator;
        this.roleName = roleName;
        this.tone = tone;
        this.status = status;
        this.promptTemplate = promptTemplate;
    }

    public String getName() {
        return name;
    }

    public String getCreator() {
        return creator;
    }

    public String getRoleName() {
        return roleName;
    }

    public String getTone() {
        return tone;
    }

    public String getStatus() {
        return status;
    }

    public String getPromptTemplate() {
        return promptTemplate;
    }
}
