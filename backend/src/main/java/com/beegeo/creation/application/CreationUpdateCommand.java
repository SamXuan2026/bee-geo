package com.beegeo.creation.application;

public record CreationUpdateCommand(
    String title,
    String brand,
    String platform,
    String summary,
    String body
) {
}
