package com.beegeo.publish.adapter;

import com.beegeo.common.api.BusinessException;
import com.beegeo.publish.domain.PublishCommand;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.domain.PublishReceipt;
import com.beegeo.publish.port.PublishAdapter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class OwnedSitePublishAdapter implements PublishAdapter {
    private static final String DEFAULT_PUBLISH_PATH = "/api/publish/articles";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final boolean httpEnabled;

    @Autowired
    public OwnedSitePublishAdapter(
        ObjectMapper objectMapper,
        @Value("${bee-geo.publish.owned-site.http-enabled:false}") boolean httpEnabled
    ) {
        this(HttpClient.newHttpClient(), objectMapper, httpEnabled);
    }

    OwnedSitePublishAdapter(HttpClient httpClient, ObjectMapper objectMapper, boolean httpEnabled) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.httpEnabled = httpEnabled;
    }

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
        if (!httpEnabled) {
            return new PublishReceipt(true, "site-" + command.contentId(), "https://www.beegeo.local/articles/" + command.contentId(), "发布成功", LocalDateTime.now());
        }
        URI endpoint = resolvePublishEndpoint(command.endpoint());
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                "contentId", command.contentId(),
                "title", command.title(),
                "body", command.body(),
                "scheduledAt", command.scheduledAt() == null ? "" : command.scheduledAt().toString()
            ));
            HttpRequest request = HttpRequest.newBuilder(endpoint)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Authorization", "Bearer " + credential.secretValue())
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parsePublishResponse(response);
        } catch (IOException ex) {
            return new PublishReceipt(false, "", "", "自有站点发布请求失败：" + ex.getMessage(), LocalDateTime.now());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return new PublishReceipt(false, "", "", "自有站点发布请求被中断", LocalDateTime.now());
        }
    }

    @Override
    public PublishReceipt revoke(String externalPublishId, PublishCredential credential) {
        if (!httpEnabled) {
            return new PublishReceipt(true, externalPublishId, "", "撤回成功", LocalDateTime.now());
        }
        return new PublishReceipt(false, externalPublishId, "", "自有站点真实撤回需要任务 endpoint，上层暂未提供撤回 endpoint", LocalDateTime.now());
    }

    private URI resolvePublishEndpoint(String endpoint) {
        if (endpoint == null || endpoint.isBlank()) {
            throw new BusinessException("PUBLISH_ENDPOINT_EMPTY", "自有站点发布地址不能为空");
        }
        String normalized = endpoint.trim();
        URI uri = URI.create(normalized);
        if (uri.getPath() == null || uri.getPath().isBlank() || "/".equals(uri.getPath())) {
            return URI.create(trimRight(normalized, "/") + DEFAULT_PUBLISH_PATH);
        }
        return uri;
    }

    private PublishReceipt parsePublishResponse(HttpResponse<String> response) throws IOException {
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return new PublishReceipt(false, "", "", "自有站点发布失败，HTTP 状态码：" + response.statusCode(), LocalDateTime.now());
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode data = root.has("data") ? root.get("data") : root;
        boolean success = !data.has("success") || data.get("success").asBoolean();
        String externalPublishId = text(data, "externalPublishId", "site-" + System.currentTimeMillis());
        String url = text(data, "url", "");
        String message = text(data, "message", success ? "发布成功" : "发布失败");
        LocalDateTime publishedAt = parseTime(text(data, "publishedAt", ""));
        return new PublishReceipt(success, externalPublishId, url, message, publishedAt);
    }

    private String text(JsonNode data, String fieldName, String defaultValue) {
        JsonNode value = data.get(fieldName);
        if (value == null || value.isNull()) {
            return defaultValue;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? defaultValue : text;
    }

    private LocalDateTime parseTime(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            return LocalDateTime.now();
        }
    }

    private String trimRight(String value, String suffix) {
        String result = value;
        while (result.endsWith(suffix)) {
            result = result.substring(0, result.length() - suffix.length());
        }
        return result;
    }
}
