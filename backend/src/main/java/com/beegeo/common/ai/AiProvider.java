package com.beegeo.common.ai;

import java.util.List;

public interface AiProvider {

    List<String> generateGeoQuestions(String keyword);

    String generateArticle(String keyword, String personaName);

    String generatePersona(String sourceText);
}
