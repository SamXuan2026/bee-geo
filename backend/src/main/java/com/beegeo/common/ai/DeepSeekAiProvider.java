package com.beegeo.common.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "bee-geo.ai.provider", havingValue = "deepseek")
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
        this.model = (configModel != null && !configModel.isBlank()) ? configModel : "deepseek-chat";
        this.endpoint = "https://api.deepseek.com/v1/chat/completions";
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    DeepSeekAiProvider(HttpClient httpClient, String apiKey, String model, String endpoint, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.apiKey = apiKey;
        this.model = model;
        this.endpoint = endpoint;
        this.objectMapper = objectMapper;
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
        try {
            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.7,
                "max_tokens", 2048
            );

            String json = objectMapper.writeValueAsString(requestBody);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
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

    static class ChatResponse {
        public List<Choice> choices;
    }

    static class Choice {
        public Message message;
    }

    static class Message {
        public String content;
    }
}
