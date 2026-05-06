package com.beegeo.publish.port;

import com.beegeo.publish.domain.PublishCommand;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.domain.PublishReceipt;

public interface PublishAdapter {

    String platformCode();

    boolean validateCredential(PublishCredential credential);

    PublishReceipt publish(PublishCommand command, PublishCredential credential);

    PublishReceipt revoke(String externalPublishId, PublishCredential credential);
}
