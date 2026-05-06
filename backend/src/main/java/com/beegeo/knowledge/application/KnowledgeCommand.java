package com.beegeo.knowledge.application;

public record KnowledgeCommand(String name, String type, String groupName, String content, Boolean enabled) {
}
