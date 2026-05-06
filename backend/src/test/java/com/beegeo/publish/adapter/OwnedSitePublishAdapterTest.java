package com.beegeo.publish.adapter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.beegeo.publish.domain.PublishCommand;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.domain.PublishReceipt;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import org.junit.jupiter.api.Test;

class OwnedSitePublishAdapterTest {

    @Test
    void shouldPublishToOwnedSiteHttpEndpointWhenEnabled() {
        FakeHttpClient httpClient = new FakeHttpClient(200, """
            {
              "success": true,
              "externalPublishId": "site-real-100",
              "url": "https://site.local/articles/100",
              "message": "真实发布成功",
              "publishedAt": "2026-05-06T12:00:00"
            }
            """);
        OwnedSitePublishAdapter adapter = new OwnedSitePublishAdapter(httpClient, new ObjectMapper(), true);
        PublishCommand command = new PublishCommand(
            100L,
            "真实发布标题",
            "真实发布正文",
            "OWNED_SITE",
            "site-main",
            LocalDateTime.of(2026, 5, 6, 11, 50),
            "https://site.local"
        );

        PublishReceipt receipt = adapter.publish(command, new PublishCredential("site-main", "OWNED_SITE", "token-abc"));

        assertTrue(receipt.success());
        assertEquals("site-real-100", receipt.externalPublishId());
        assertEquals("https://site.local/articles/100", receipt.url());
        assertEquals("真实发布成功", receipt.message());
        assertEquals(URI.create("https://site.local/api/publish/articles"), httpClient.request.uri());
        assertEquals("Bearer token-abc", httpClient.request.headers().firstValue("Authorization").orElse(""));
        assertTrue(httpClient.body.contains("真实发布标题"));
        assertTrue(httpClient.body.contains("真实发布正文"));
    }

    @Test
    void shouldReturnFailedReceiptWhenOwnedSiteRejectsRequest() {
        FakeHttpClient httpClient = new FakeHttpClient(429, "{\"message\":\"限流\"}");
        OwnedSitePublishAdapter adapter = new OwnedSitePublishAdapter(httpClient, new ObjectMapper(), true);
        PublishCommand command = new PublishCommand(
            101L,
            "发布标题",
            "发布正文",
            "OWNED_SITE",
            "site-main",
            LocalDateTime.of(2026, 5, 6, 11, 50),
            "https://site.local/custom/publish"
        );

        PublishReceipt receipt = adapter.publish(command, new PublishCredential("site-main", "OWNED_SITE", "token-abc"));

        assertFalse(receipt.success());
        assertEquals("自有站点发布失败，HTTP 状态码：429", receipt.message());
        assertEquals(URI.create("https://site.local/custom/publish"), httpClient.request.uri());
    }

    private static final class FakeHttpClient extends HttpClient {
        private final int statusCode;
        private final String responseBody;
        private HttpRequest request;
        private String body = "";

        private FakeHttpClient(int statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }

        @Override
        public Optional<CookieHandler> cookieHandler() {
            return Optional.empty();
        }

        @Override
        public Optional<Duration> connectTimeout() {
            return Optional.empty();
        }

        @Override
        public Redirect followRedirects() {
            return Redirect.NEVER;
        }

        @Override
        public Optional<ProxySelector> proxy() {
            return Optional.empty();
        }

        @Override
        public SSLContext sslContext() {
            try {
                return SSLContext.getDefault();
            } catch (Exception ex) {
                throw new IllegalStateException("获取 SSL 上下文失败", ex);
            }
        }

        @Override
        public SSLParameters sslParameters() {
            return new SSLParameters();
        }

        @Override
        public Optional<Authenticator> authenticator() {
            return Optional.empty();
        }

        @Override
        public Version version() {
            return Version.HTTP_1_1;
        }

        @Override
        public Optional<Executor> executor() {
            return Optional.empty();
        }

        @Override
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler) throws IOException {
            this.request = request;
            this.body = readBody(request);
            HttpResponse.ResponseInfo responseInfo = new HttpResponse.ResponseInfo() {
                @Override
                public int statusCode() {
                    return statusCode;
                }

                @Override
                public HttpHeaders headers() {
                    return HttpHeaders.of(java.util.Map.of(), (name, value) -> true);
                }

                @Override
                public Version version() {
                    return Version.HTTP_1_1;
                }
            };
            HttpResponse.BodySubscriber<T> subscriber = responseBodyHandler.apply(responseInfo);
            subscriber.onSubscribe(new java.util.concurrent.Flow.Subscription() {
                @Override
                public void request(long n) {
                }

                @Override
                public void cancel() {
                }
            });
            subscriber.onNext(java.util.List.of(java.nio.ByteBuffer.wrap(responseBody.getBytes(StandardCharsets.UTF_8))));
            subscriber.onComplete();
            T response = subscriber.getBody().toCompletableFuture().join();
            return new FakeHttpResponse<>(request, statusCode, response);
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler) {
            throw new UnsupportedOperationException("测试不需要异步请求");
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(
            HttpRequest request,
            HttpResponse.BodyHandler<T> responseBodyHandler,
            HttpResponse.PushPromiseHandler<T> pushPromiseHandler
        ) {
            throw new UnsupportedOperationException("测试不需要异步请求");
        }

        private String readBody(HttpRequest request) {
            if (request.bodyPublisher().isEmpty()) {
                return "";
            }
            CapturingSubscriber subscriber = new CapturingSubscriber();
            request.bodyPublisher().get().subscribe(subscriber);
            return subscriber.body();
        }
    }

    private record FakeHttpResponse<T>(HttpRequest request, int statusCode, T body) implements HttpResponse<T> {
        @Override
        public Optional<HttpResponse<T>> previousResponse() {
            return Optional.empty();
        }

        @Override
        public HttpHeaders headers() {
            return HttpHeaders.of(java.util.Map.of(), (name, value) -> true);
        }

        @Override
        public Optional<javax.net.ssl.SSLSession> sslSession() {
            return Optional.empty();
        }

        @Override
        public URI uri() {
            return request.uri();
        }

        @Override
        public HttpClient.Version version() {
            return HttpClient.Version.HTTP_1_1;
        }
    }

    private static final class CapturingSubscriber implements java.util.concurrent.Flow.Subscriber<java.nio.ByteBuffer> {
        private final StringBuilder builder = new StringBuilder();

        @Override
        public void onSubscribe(java.util.concurrent.Flow.Subscription subscription) {
            subscription.request(Long.MAX_VALUE);
        }

        @Override
        public void onNext(java.nio.ByteBuffer item) {
            byte[] bytes = new byte[item.remaining()];
            item.get(bytes);
            builder.append(new String(bytes, StandardCharsets.UTF_8));
        }

        @Override
        public void onError(Throwable throwable) {
            throw new IllegalStateException("读取请求体失败", throwable);
        }

        @Override
        public void onComplete() {
        }

        private String body() {
            return builder.toString();
        }
    }
}
