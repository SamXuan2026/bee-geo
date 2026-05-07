package com.beegeo.creation.application;

import java.util.List;

public record AiCreationCommand(
    String topic,
    List<Long> keywordIds,
    List<Long> knowledgeIds,
    String personaName,
    String brand,
    String platform
) {
}
