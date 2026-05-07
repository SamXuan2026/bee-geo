package com.beegeo.common.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "bee-geo.ai", name = "provider", havingValue = "deepseek")
public class DeepSeekAiProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(DeepSeekAiProvider.class);

    private final String apiKey;
    private final String model;
    private final String endpoint;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public DeepSeekAiProvider() {
        this.apiKey = System.getenv("DEEPSEEK_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("DEEPSEEK_API_KEY 环境变量未设置，DeepSeek API Key 为必填项");
        }
        String configModel = System.getenv("DEEPSEEK_MODEL");
        this.model = (configModel != null && !configModel.isBlank()) ? configModel : "deepseek-v4-pro";
        String configBaseUrl = System.getenv("DEEPSEEK_BASE_URL");
        String baseUrl = (configBaseUrl != null && !configBaseUrl.isBlank()) ? configBaseUrl : "https://api.deepseek.com";
        this.endpoint = buildEndpoint(baseUrl);
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .version(HttpClient.Version.HTTP_1_1)
            .build();
        this.objectMapper = new ObjectMapper()
            .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    DeepSeekAiProvider(HttpClient httpClient, String apiKey, String model, String endpoint, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.apiKey = apiKey;
        this.model = model;
        this.endpoint = endpoint;
        this.objectMapper = objectMapper;
    }

    @Override
    public String providerName() {
        return "DeepSeek";
    }

    @Override
    public String modelName() {
        return model;
    }

    @Override
    public boolean remoteProvider() {
        return true;
    }

    @Override
    public List<String> generateGeoQuestions(String keyword) {
        String systemPrompt = "你是企业品牌曝光策略顾问。针对给定关键词，生成3个具体的GEO（生成式引擎优化）研究问题，"
            + "帮助品牌理解潜在客户在AI搜索中可能提出的问题。只返回3个问题，每行一个，不要编号。";
        String userPrompt = "关键词：" + keyword;

        String response = chat(systemPrompt, userPrompt);
        return response.lines()
            .map(String::trim)
            .filter(line -> !line.isBlank())
            .limit(3)
            .toList();
    }

    @Override
    public List<GeoInsight> generateGeoInsights(String keyword) {
        String systemPrompt = "你是企业品牌GEO分析专家。请针对关键词输出3条结构化GEO分析结果。"
            + "必须只返回JSON对象，不要Markdown，不要代码块，不要额外解释。"
            + "顶层字段固定为items，items是数组。"
            + "数组元素字段固定为：question、aiTitle、description。"
            + "question 是潜在客户可能在AI搜索中提出的具体问题；"
            + "aiTitle 是适合生成内容的标题；"
            + "description 是80到160字的品牌曝光机会、内容缺口和建议。"
            + "禁止编造外部链接。";
        String userPrompt = "关键词：" + keyword;
        String response = chat(systemPrompt, userPrompt, true);
        try {
            List<GeoInsightPayload> payloads = readGeoInsightPayloads(response);
            List<GeoInsight> insights = payloads.stream()
                .map(payload -> new GeoInsight(
                    normalizeRequired(payload.question, "question"),
                    normalizeRequired(payload.aiTitle, "aiTitle"),
                    normalizeRequired(payload.description, "description")
                ))
                .limit(3)
                .toList();
            if (insights.isEmpty()) {
                throw new AiProviderException("DeepSeek GEO 结构化结果为空");
            }
            return insights;
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new AiProviderException("DeepSeek GEO 结构化结果解析失败：" + e.getMessage(), e);
        }
    }

    @Override
    public String generateArticle(String keyword, String personaName) {
        String systemPrompt = "你是" + personaName + "。根据关键词创作一篇面向企业决策者的营销内容文章。"
            + "包含标题、摘要和正文。正文需要包含论点、数据支撑和行动建议。控制在800字以内。";
        String userPrompt = "关键词：" + keyword;

        return chat(systemPrompt, userPrompt);
    }

    @Override
    public String generatePersona(String sourceText) {
        String systemPrompt = "你是AI人设分析专家。根据提供的材料，提炼出一个简洁的AI内容创作人设描述，"
            + "包含：角色定位、表达重心、核心视角、情感温度。用一段话描述，不超过100字。";
        String userPrompt = "材料：" + sourceText;

        return chat(systemPrompt, userPrompt);
    }

    String chat(String systemPrompt, String userPrompt) {
        return chat(systemPrompt, userPrompt, false);
    }

    String chat(String systemPrompt, String userPrompt, boolean jsonOutput) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
            ));
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 2048);
            if (jsonOutput) {
                requestBody.put("response_format", Map.of("type", "json_object"));
            }

            String json = objectMapper.writeValueAsString(requestBody);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .version(HttpClient.Version.HTTP_1_1)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("DeepSeek API 返回非200状态码：{}，响应：{}", response.statusCode(), response.body());
                throw new AiProviderException("DeepSeek API 调用失败，状态码：" + response.statusCode());
            }

            ChatResponse chatResponse = objectMapper.readValue(response.body(), ChatResponse.class);
            if (chatResponse.choices == null || chatResponse.choices.isEmpty()) {
                throw new AiProviderException("DeepSeek API 返回空响应");
            }

            String content = chatResponse.choices.get(0).message.content;
            if (content == null || content.isBlank()) {
                throw new AiProviderException("DeepSeek API 返回空内容");
            }

            return content.trim();
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            log.error("DeepSeek API 调用异常", e);
            throw new AiProviderException("DeepSeek API 调用失败：" + e.getMessage(), e);
        }
    }

    static String buildEndpoint(String baseUrl) {
        String normalized = baseUrl.replaceAll("/$", "");
        if (normalized.endsWith("/chat/completions")) {
            return normalized;
        }
        return normalized + "/chat/completions";
    }

    private List<GeoInsightPayload> readGeoInsightPayloads(String content) throws com.fasterxml.jackson.core.JsonProcessingException {
        JsonNode root = objectMapper.readTree(extractJsonPayload(content));
        JsonNode itemsNode = root.isArray() ? root : root.path("items");
        if (!itemsNode.isArray()) {
            throw new AiProviderException("DeepSeek GEO 结构化结果缺少items数组");
        }
        return objectMapper.readValue(
            itemsNode.toString(),
            new TypeReference<List<GeoInsightPayload>>() {
            }
        );
    }

    private String extractJsonPayload(String content) {
        int start = content.indexOf('[');
        int end = content.lastIndexOf(']');
        int objectStart = content.indexOf('{');
        int objectEnd = content.lastIndexOf('}');
        if (objectStart >= 0 && objectEnd > objectStart && (start < 0 || objectStart < start)) {
            return content.substring(objectStart, objectEnd + 1);
        }
        if (start >= 0 && end > start) {
            return content.substring(start, end + 1);
        }
        throw new AiProviderException("DeepSeek GEO 结构化结果不是JSON对象或数组");
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new AiProviderException("DeepSeek GEO 结构化结果缺少字段：" + fieldName);
        }
        return value.trim();
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    static class ChatResponse {
        public List<Choice> choices;
    }

    static class Choice {
        public Message message;
    }

    static class Message {
        public String content;
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    static class GeoInsightPayload {
        public String question;
        public String aiTitle;
        public String description;
    }
}
