package com.beegeo.common.ai;

import java.util.List;

public interface AiProvider {

    default String providerName() {
        return "AI Provider";
    }

    default String modelName() {
        return "未配置";
    }

    default boolean remoteProvider() {
        return false;
    }

    default List<GeoInsight> generateGeoInsights(String keyword) {
        return generateGeoQuestions(keyword).stream()
            .map(question -> new GeoInsight(
                question,
                question,
                providerName() + " 基于关键词「" + keyword + "」生成的 GEO 研究问题。"
            ))
            .toList();
    }

    List<String> generateGeoQuestions(String keyword);

    String generateArticle(String keyword, String personaName);

    String generatePersona(String sourceText);
}
