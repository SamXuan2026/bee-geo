package com.beegeo.common.security;

import com.beegeo.auth.domain.AppUserEntity;
import com.beegeo.auth.domain.UserRole;
import com.beegeo.auth.repository.AppUserRepository;
import com.beegeo.common.api.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CurrentOperatorResolver {
    private final AppUserRepository appUserRepository;
    private final boolean requireOperatorHeader;

    public CurrentOperatorResolver(
        AppUserRepository appUserRepository,
        @Value("${bee-geo.security.require-operator-header:false}") boolean requireOperatorHeader
    ) {
        this.appUserRepository = appUserRepository;
        this.requireOperatorHeader = requireOperatorHeader;
    }

    public CurrentOperator resolve(HttpServletRequest request) {
        String account = request.getHeader("X-Bee-Account");
        AppUserEntity user = findUser(account)
            .orElseGet(() -> findFallbackUser(account));
        if (!"启用".equals(user.getStatus())) {
            throw new BusinessException("OPERATOR_DISABLED", "当前操作人已停用");
        }
        return new CurrentOperator(
            user.getAccount(),
            user.getName(),
            UserRole.fromCode(user.getRoleCode()),
            clientIp(request),
            request.getRequestURI()
        );
    }

    private Optional<AppUserEntity> findUser(String account) {
        if (account == null || account.isBlank()) {
            return Optional.empty();
        }
        return appUserRepository.findByAccount(account.trim());
    }

    private AppUserEntity findFallbackUser(String account) {
        if (requireOperatorHeader || (account != null && !account.isBlank())) {
            throw new BusinessException("OPERATOR_NOT_FOUND", "当前操作人不存在或请求头缺失");
        }
        return appUserRepository.findFirstByRoleCodeAndStatusOrderByIdAsc(UserRole.SUPER_ADMIN.code(), "启用")
            .orElseThrow(() -> new BusinessException("OPERATOR_NOT_FOUND", "未配置可用超级管理员"));
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
