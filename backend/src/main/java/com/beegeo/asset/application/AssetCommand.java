package com.beegeo.asset.application;

public record AssetCommand(String name, String type, String tag, String storageUrl, Boolean enabled) {
}
