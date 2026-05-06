package com.beegeo.persona.application;

public record PersonaCommand(String name, String creator, String roleName, String tone, String status, String promptTemplate) {
}
