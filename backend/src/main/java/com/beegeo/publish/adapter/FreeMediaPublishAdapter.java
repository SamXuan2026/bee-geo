package com.beegeo.publish.adapter;

import com.beegeo.publish.domain.PublishCommand;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.domain.PublishReceipt;
import com.beegeo.publish.port.PublishAdapter;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class FreeMediaPublishAdapter implements PublishAdapter {

    @Override
    public String platformCode() {
        return "FREE_MEDIA";
    }

    @Override
    public boolean validateCredential(PublishCredential credential) {
        return credential.secretValue() != null && credential.secretValue().length() >= 8;
    }

    @Override
    public PublishReceipt publish(PublishCommand command, PublishCredential credential) {
        return new PublishReceipt(false, "", "", "免费媒体平台限流，已进入重试队列", LocalDateTime.now());
    }

    @Override
    public PublishReceipt revoke(String externalPublishId, PublishCredential credential) {
        return new PublishReceipt(true, externalPublishId, "", "撤回请求已提交", LocalDateTime.now());
    }
}
