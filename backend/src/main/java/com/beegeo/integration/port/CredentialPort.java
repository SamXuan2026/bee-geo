package com.beegeo.integration.port;

import com.beegeo.publish.domain.PublishCredential;

public interface CredentialPort {

    void encryptAndSave(String accountId, String platformCode, String secretValue);

    String loadMasked(String accountId);

    PublishCredential loadPlainForPublish(String accountId, String platformCode);

    void markExpired(String accountId);
}
