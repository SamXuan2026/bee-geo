package com.beegeo.common.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "bee-geo.publish.scheduler.enabled=false",
    "bee-geo.security.seed-demo-credentials=true"
})
@AutoConfigureMockMvc
class BackendApiIntegrationTest {
    private static final String SUPER_ADMIN_ACCOUNT = "13677889001";
    private static final String PUBLISHER_ACCOUNT = "13988762210";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldExposeCoreReadApis() throws Exception {
        assertSuccessfulGet("/api/health").andExpect(jsonPath("$.data.status").value("UP"));
        assertSuccessfulGet("/api/keywords").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/knowledge").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/assets").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/personas").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/users").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/users/roles").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/geo/tasks").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/geo/tasks/1/results").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/creations").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/publish/tasks").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/publish/tasks/accounts").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/integrations/accounts").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/security/permissions").andExpect(jsonPath("$.data.length()", greaterThan(0)));
        assertSuccessfulGet("/api/audit/logs/page?page=1&pageSize=5").andExpect(jsonPath("$.data.items").isArray());
        assertSuccessfulGet("/api/audit/logs/export")
            .andExpect(jsonPath("$.data.contentType").value("text/csv;charset=utf-8"))
            .andExpect(jsonPath("$.data.content", containsString("模块,动作,对象编号")));
    }

    @Test
    void shouldRunGeoCreationPublishRouteFlow() throws Exception {
        long geoTaskId = postAndReadDataId("/api/geo/tasks", """
            {"keyword":"浏览器点击回归"}
            """);

        long creationId = postAndReadDataId("/api/geo/tasks/" + geoTaskId + "/create-draft", "{}");

        mockMvc.perform(put("/api/creations/" + creationId)
                .header("X-Bee-Account", SUPER_ADMIN_ACCOUNT)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title":"浏览器点击回归内容",
                      "brand":"BeeWorks",
                      "platform":"自有站点",
                      "summary":"用于验证后端真实路由主链路",
                      "body":"覆盖 GEO、创作、审核和发布排期的后端集成测试正文。"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.title").value("浏览器点击回归内容"));

        postOk("/api/creations/" + creationId + "/submit-review", "{}")
            .andExpect(jsonPath("$.data.status").value("PENDING_REVIEW"));
        postOk("/api/creations/" + creationId + "/approve", "{}")
            .andExpect(jsonPath("$.data.status").value("APPROVED"));

        mockMvc.perform(post("/api/creations/" + creationId + "/schedule-publish")
                .header("X-Bee-Account", SUPER_ADMIN_ACCOUNT)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "platformCode":"OWNED_SITE",
                      "accountId":"site-main",
                      "scheduledAt":"2026-05-07T10:00:00",
                      "maxRetryCount":3
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.title").value("浏览器点击回归内容"))
            .andExpect(jsonPath("$.data.status").value("SCHEDULED"));
    }

    @Test
    void shouldDenyUnauthorizedWriteApiAndRecordAudit() throws Exception {
        mockMvc.perform(post("/api/keywords")
                .header("X-Bee-Account", PUBLISHER_ACCOUNT)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name":"无权限关键词",
                      "groupName":"权限测试",
                      "description":"发布员不应能维护关键词",
                      "enabled":true
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.code").value("PERMISSION_DENIED"));

        assertSuccessfulGet("/api/audit/logs/page?keyword=security&page=1&pageSize=5")
            .andExpect(jsonPath("$.data.items.length()", greaterThan(0)))
            .andExpect(jsonPath("$.data.items[0].success").value(false));
    }

    @Test
    void shouldSaveExpireCredentialAndExposeOnlyMaskedValue() throws Exception {
        mockMvc.perform(post("/api/integrations/accounts")
                .header("X-Bee-Account", SUPER_ADMIN_ACCOUNT)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "accountId":"csdn",
                      "platformCode":"FREE_MEDIA",
                      "secretValue":"integration-test-secret"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        assertSuccessfulGet("/api/integrations/accounts")
            .andExpect(jsonPath("$.data[?(@.accountId == 'csdn')].maskedCredential").value("******"));

        mockMvc.perform(post("/api/integrations/accounts/expire")
                .header("X-Bee-Account", SUPER_ADMIN_ACCOUNT)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":"csdn"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        assertSuccessfulGet("/api/audit/logs/page?keyword=integration&page=1&pageSize=10")
            .andExpect(jsonPath("$.data.items.length()", greaterThan(0)));
    }

    private org.springframework.test.web.servlet.ResultActions assertSuccessfulGet(String path) throws Exception {
        return mockMvc.perform(get(path).header("X-Bee-Account", SUPER_ADMIN_ACCOUNT))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    private org.springframework.test.web.servlet.ResultActions postOk(String path, String body) throws Exception {
        return mockMvc.perform(post(path)
                .header("X-Bee-Account", SUPER_ADMIN_ACCOUNT)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    private long postAndReadDataId(String path, String body) throws Exception {
        MvcResult result = postOk(path, body).andReturn();
        JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
        return payload.path("data").path("id").asLong();
    }
}
