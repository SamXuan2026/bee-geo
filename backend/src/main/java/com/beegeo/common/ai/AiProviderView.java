package com.beegeo.common.ai;

public record AiProviderView(
    String providerName,
    String modelName,
    boolean remoteProvider
) {
}
