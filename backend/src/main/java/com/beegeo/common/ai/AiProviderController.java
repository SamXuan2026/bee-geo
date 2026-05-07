package com.beegeo.common.ai;

import com.beegeo.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/provider")
public class AiProviderController {
    private final AiProvider aiProvider;

    public AiProviderController(AiProvider aiProvider) {
        this.aiProvider = aiProvider;
    }

    @GetMapping
    public ApiResponse<AiProviderView> currentProvider() {
        return ApiResponse.ok(new AiProviderView(
            aiProvider.providerName(),
            aiProvider.modelName(),
            aiProvider.remoteProvider()
        ));
    }
}
