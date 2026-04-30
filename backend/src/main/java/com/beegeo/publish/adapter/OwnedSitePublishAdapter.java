package com.beegeo.publish.adapter;

import com.beegeo.publish.domain.PublishCommand;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.domain.PublishReceipt;
import com.beegeo.publish.port.PublishAdapter;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class OwnedSitePublishAdapter implements PublishAdapter {

    @Override
    public String platformCode() {
        return "OWNED_SITE";
    }

    @Override
    public boolean validateCredential(PublishCredential credential) {
        return credential.secretValue() != null && !credential.secretValue().isBlank();
    }

    @Override
    public PublishReceipt publish(PublishCommand command, PublishCredential credential) {
        return new PublishReceipt(true, "site-" + command.contentId(), "https://www.beegeo.local/articles/" + command.contentId(), "发布成功", LocalDateTime.now());
    }

    @Override
    public PublishReceipt revoke(String externalPublishId, PublishCredential credential) {
        return new PublishReceipt(true, externalPublishId, "", "撤回成功", LocalDateTime.now());
    }
}
