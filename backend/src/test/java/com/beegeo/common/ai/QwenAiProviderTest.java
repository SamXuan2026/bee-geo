package com.beegeo.common.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class QwenAiProviderTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldGenerateGeoQuestions() {
        QwenAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"怎么选型更适合企业内部协作？\\n在 AI 搜索结果中如何提升品牌曝光？\\n与竞品相比有哪些可验证优势？"}}]}
            """, 200);

        List<String> questions = provider.generateGeoQuestions("企业协同平台");

        assertEquals(3, questions.size());
        assertTrue(questions.get(0).contains("选型"));
    }

    @Test
    void shouldGenerateArticle() {
        QwenAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"# 企业协同平台选型指南\\n\\n## 摘要\\n本文分析企业协同平台的选型要点"}}]}
            """, 200);

        String article = provider.generateArticle("企业协同平台", "品牌顾问");

        assertNotNull(article);
        assertTrue(article.contains("选型"));
    }

    @Test
    void shouldGeneratePersona() {
        QwenAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"专业、克制、关注业务价值和风险提示的企业内容顾问。"}}]}
            """, 200);

        String persona = provider.generatePersona("某企业SaaS品牌的市场定位和内容风格说明");

        assertNotNull(persona);
        assertTrue(persona.contains("专业"));
    }

    @Test
    void shouldThrowOnNon200Response() {
        QwenAiProvider provider = new StubProvider("{\"error\":\"Invalid API Key\"}", 401);

        assertThrows(AiProviderException.class, () -> provider.generateGeoQuestions("test"));
    }

    @Test
    void shouldThrowOnEmptyChoices() {
        QwenAiProvider provider = new StubProvider("{\"choices\":[]}", 200);

        assertThrows(AiProviderException.class, () -> provider.generateArticle("test", "test"));
    }

    @Test
    void shouldThrowOnNullContent() {
        QwenAiProvider provider = new StubProvider("{\"choices\":[{\"message\":{\"content\":null}}]}", 200);

        assertThrows(AiProviderException.class, () -> provider.generatePersona("test"));
    }

    @Test
    void shouldThrowOnMalformedJson() {
        QwenAiProvider provider = new StubProvider("not json", 200);

        assertThrows(AiProviderException.class, () -> provider.generateGeoQuestions("test"));
    }

    @Test
    void shouldTrimBlankLinesFromQuestions() {
        QwenAiProvider provider = new StubProvider("""
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
        QwenAiProvider provider = new StubProvider("""
            {"choices":[{"message":{"content":"# 标题\\n\\n## 摘要\\n摘要内容\\n\\n## 正文\\n正文内容"}}]}
            """, 200);

        String article = provider.generateArticle("key", "persona");

        assertTrue(article.contains("# 标题"));
        assertTrue(article.contains("## 摘要"));
        assertTrue(article.contains("## 正文"));
    }

    private static class StubProvider extends QwenAiProvider {
        private final String responseBody;
        private final int statusCode;

        StubProvider(String responseBody, int statusCode) {
            super(null, "test-api-key", "qwen-plus",
                "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                new ObjectMapper());
            this.responseBody = responseBody;
            this.statusCode = statusCode;
        }

        @Override
        String chat(String systemPrompt, String userPrompt) {
            if (statusCode != 200) {
                throw new AiProviderException("通义千问 API 调用失败，状态码：" + statusCode);
            }
            try {
                ObjectMapper mapper = new ObjectMapper();
                ChatResponse cr = mapper.readValue(responseBody, ChatResponse.class);
                if (cr.choices == null || cr.choices.isEmpty()) {
                    throw new AiProviderException("通义千问 API 返回空响应");
                }
                String content = cr.choices.get(0).message.content;
                if (content == null || content.isBlank()) {
                    throw new AiProviderException("通义千问 API 返回空内容");
                }
                return content.trim();
            } catch (AiProviderException e) {
                throw e;
            } catch (Exception e) {
                throw new AiProviderException("通义千问 API 调用失败：" + e.getMessage(), e);
            }
        }
    }
}
