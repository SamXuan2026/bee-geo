package com.beegeo.common.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class DeepSeekAiProviderTest {

    @Test
    void shouldGenerateGeoQuestions() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"怎么选型更适合企业内部协作？\\n在 AI 搜索结果中如何提升品牌曝光？\\n与竞品相比有哪些可验证优势？"}}]}
            """, 200);

        List<String> questions = provider.generateGeoQuestions("企业协同平台");

        assertEquals(3, questions.size());
        assertTrue(questions.get(0).contains("选型"));
    }

    @Test
    void shouldGenerateArticle() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"# 企业协同平台选型指南\\n\\n## 摘要\\n本文分析企业协同平台的选型要点"}}]}
            """, 200);

        String article = provider.generateArticle("企业协同平台", "品牌顾问");

        assertNotNull(article);
        assertTrue(article.contains("选型"));
    }

    @Test
    void shouldGenerateStructuredGeoInsights() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"{\\\"items\\\":[{\\\"question\\\":\\\"企业协同平台怎么私有化部署？\\\",\\\"aiTitle\\\":\\\"企业协同平台私有化部署指南\\\",\\\"description\\\":\\\"围绕私有化部署、权限审计和系统集成说明品牌内容缺口。\\\"}]}"}}]}
            """, 200);

        List<GeoInsight> insights = provider.generateGeoInsights("企业协同平台");

        assertEquals(1, insights.size());
        assertEquals("企业协同平台怎么私有化部署？", insights.get(0).question());
        assertEquals("企业协同平台私有化部署指南", insights.get(0).aiTitle());
        assertTrue(insights.get(0).description().contains("权限审计"));
    }

    @Test
    void shouldKeepCompatibilityWithGeoInsightArray() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"[{\\\"question\\\":\\\"问题\\\",\\\"aiTitle\\\":\\\"标题\\\",\\\"description\\\":\\\"说明\\\"}]"}}]}
            """, 200);

        List<GeoInsight> insights = provider.generateGeoInsights("企业协同平台");

        assertEquals(1, insights.size());
        assertEquals("标题", insights.get(0).aiTitle());
    }

    @Test
    void shouldFallbackTitleWhenGeoInsightMissingAiTitle() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"{\\\"items\\\":[{\\\"question\\\":\\\"企业级知识协同平台如何提升组织知识复用？\\\",\\\"description\\\":\\\"围绕知识沉淀、权限控制和跨部门协作说明内容机会。\\\"}]}"}}]}
            """, 200);

        List<GeoInsight> insights = provider.generateGeoInsights("企业级知识协同平台");

        assertEquals(1, insights.size());
        assertEquals("企业级知识协同平台如何提升组织知识复用？", insights.get(0).aiTitle());
    }

    @Test
    void shouldBuildOfficialDeepSeekEndpoint() {
        assertEquals("https://api.deepseek.com/chat/completions", DeepSeekAiProvider.buildEndpoint("https://api.deepseek.com"));
        assertEquals("https://api.deepseek.com/chat/completions", DeepSeekAiProvider.buildEndpoint("https://api.deepseek.com/"));
        assertEquals("https://api.deepseek.com/v1/chat/completions", DeepSeekAiProvider.buildEndpoint("https://api.deepseek.com/v1"));
        assertEquals("https://proxy.local/chat/completions", DeepSeekAiProvider.buildEndpoint("https://proxy.local/chat/completions"));
    }

    @Test
    void shouldRejectMalformedStructuredGeoInsights() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"不是JSON数组"}}]}
            """, 200);

        assertThrows(AiProviderException.class, () -> provider.generateGeoInsights("企业协同平台"));
    }

    @Test
    void shouldGeneratePersona() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"专业、克制、关注业务价值和风险提示的企业内容顾问。"}}]}
            """, 200);

        String persona = provider.generatePersona("某企业SaaS品牌的市场定位和内容风格说明");

        assertNotNull(persona);
        assertTrue(persona.contains("专业"));
    }

    @Test
    void shouldThrowOnNon200Response() {
        DeepSeekAiProvider provider = new StubProvider("{\"error\":\"Invalid API Key\"}", 401);

        assertThrows(AiProviderException.class, () -> provider.generateGeoQuestions("test"));
    }

    @Test
    void shouldThrowOnEmptyChoices() {
        DeepSeekAiProvider provider = new StubProvider("{\"choices\":[]}", 200);

        assertThrows(AiProviderException.class, () -> provider.generateArticle("test", "test"));
    }

    @Test
    void shouldThrowOnNullContent() {
        DeepSeekAiProvider provider = new StubProvider("{\"choices\":[{\"message\":{\"content\":null}}]}", 200);

        assertThrows(AiProviderException.class, () -> provider.generatePersona("test"));
    }

    @Test
    void shouldThrowOnMalformedJson() {
        DeepSeekAiProvider provider = new StubProvider("not json", 200);

        assertThrows(AiProviderException.class, () -> provider.generateGeoQuestions("test"));
    }

    @Test
    void shouldTrimBlankLinesFromQuestions() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"问题A\\n  \\n问题B\\n\\n问题C"}}]}
            """, 200);

        List<String> questions = provider.generateGeoQuestions("test");

        assertEquals(3, questions.size());
        assertEquals("问题A", questions.get(0));
        assertEquals("问题B", questions.get(1));
        assertEquals("问题C", questions.get(2));
    }

    @Test
    void shouldPreserveArticleFormatting() {
        DeepSeekAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"# 标题\\n\\n## 摘要\\n摘要内容\\n\\n## 正文\\n正文内容"}}]}
            """, 200);

        String article = provider.generateArticle("key", "persona");

        assertTrue(article.contains("# 标题"));
        assertTrue(article.contains("## 摘要"));
        assertTrue(article.contains("## 正文"));
    }

    private static class StubProvider extends DeepSeekAiProvider {
        private final String responseBody;
        private final int statusCode;

        StubProvider(String responseBody, int statusCode) {
            super(null, "test-api-key", "deepseek-chat",
                "https://api.deepseek.com/v1/chat/completions",
                new ObjectMapper());
            this.responseBody = responseBody;
            this.statusCode = statusCode;
        }

        @Override
        String chat(String systemPrompt, String userPrompt) {
            return stubChat();
        }

        @Override
        String chat(String systemPrompt, String userPrompt, boolean jsonOutput) {
            return stubChat();
        }

        private String stubChat() {
            if (statusCode != 200) {
                throw new AiProviderException("DeepSeek API 调用失败，状态码：" + statusCode);
            }
            try {
                ObjectMapper mapper = new ObjectMapper();
                ChatResponse cr = mapper.readValue(responseBody, ChatResponse.class);
                if (cr.choices == null || cr.choices.isEmpty()) {
                    throw new AiProviderException("DeepSeek API 返回空响应");
                }
                String content = cr.choices.get(0).message.content;
                if (content == null || content.isBlank()) {
                    throw new AiProviderException("DeepSeek API 返回空内容");
                }
                return content.trim();
            } catch (AiProviderException e) {
                throw e;
            } catch (Exception e) {
                throw new AiProviderException("DeepSeek API 调用失败：" + e.getMessage(), e);
            }
        }
    }
}
