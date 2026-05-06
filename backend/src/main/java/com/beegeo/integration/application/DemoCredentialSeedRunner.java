package com.beegeo.integration.application;

import com.beegeo.integration.port.CredentialPort;
import com.beegeo.integration.repository.PublishCredentialRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "bee-geo.security", name = "seed-demo-credentials", havingValue = "true", matchIfMissing = true)
public class DemoCredentialSeedRunner implements CommandLineRunner {
    private final CredentialPort credentialPort;
    private final PublishCredentialRepository publishCredentialRepository;

    public DemoCredentialSeedRunner(CredentialPort credentialPort, PublishCredentialRepository publishCredentialRepository) {
        this.credentialPort = credentialPort;
        this.publishCredentialRepository = publishCredentialRepository;
    }

    @Override
    public void run(String... args) {
        seedIfMissing("site-main", "OWNED_SITE", "owned-site-token");
        seedIfMissing("cnblogs", "FREE_MEDIA", "free-media-cookie-cnblogs");
    }

    private void seedIfMissing(String accountId, String platformCode, String secretValue) {
        if (publishCredentialRepository.findByAccountId(accountId).isEmpty()) {
            credentialPort.encryptAndSave(accountId, platformCode, secretValue);
        }
    }
}
