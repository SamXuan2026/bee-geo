package com.beegeo.common.storage;

public interface FileStoragePort {

    String upload(String filename, byte[] content);

    byte[] download(String storageKey);

    void delete(String storageKey);
}
