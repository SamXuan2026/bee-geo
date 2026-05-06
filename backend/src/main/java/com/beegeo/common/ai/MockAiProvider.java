package com.beegeo.common.ai;

import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("T(System).getenv('DEEPSEEK_API_KEY') == null || T(System).getenv('DEEPSEEK_API_KEY').isBlank()")
public class MockAiProvider implements AiProvider {

    @Override
    public List<String> generateGeoQuestions(String keyword) {
        return List.of(
            keyword + "怎么选型更适合企业内部协作？",
            keyword + "在 AI 搜索结果中如何提升品牌曝光？",
            keyword + "与竞品相比有哪些可验证优势？"
        );
    }

    @Override
    public String generateArticle(String keyword, String personaName) {
        return "基于 " + keyword + " 和 " + personaName + " 人设生成的文章草稿。";
    }

    @Override
    public String generatePersona(String sourceText) {
        return "专业、克制、关注业务价值和风险提示的企业内容顾问。";
    }
}
