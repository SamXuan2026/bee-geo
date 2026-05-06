package com.beegeo.common.controller;

import com.beegeo.common.api.ApiResponse;
import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.ok(Map.of(
            "service", "bee-geo-backend",
            "status", "UP",
            "time", OffsetDateTime.now().toString()
        ));
    }
}
