package com.beegeo.common.config;

import com.beegeo.common.security.RolePermissionInterceptor;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    private final RolePermissionInterceptor rolePermissionInterceptor;

    public WebConfig(RolePermissionInterceptor rolePermissionInterceptor) {
        this.rolePermissionInterceptor = rolePermissionInterceptor;
    }

    @Bean
    @ConfigurationProperties(prefix = "bee-geo.cors")
    public CorsProperties corsProperties() {
        return new CorsProperties();
    }

    @Bean
    public WebMvcConfigurer webMvcConfigurer(CorsProperties corsProperties) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins(corsProperties.allowedOrigins().toArray(String[]::new))
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .maxAge(3600);
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(rolePermissionInterceptor)
                    .addPathPatterns("/api/**");
            }
        };
    }

    public static class CorsProperties {
        private List<String> allowedOrigins = List.of("http://127.0.0.1:5178", "http://localhost:5178");

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public List<String> allowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }
}
