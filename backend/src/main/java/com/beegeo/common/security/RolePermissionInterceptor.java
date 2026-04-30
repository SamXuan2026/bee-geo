package com.beegeo.common.security;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RolePermissionInterceptor implements HandlerInterceptor {
    private final CurrentOperatorResolver currentOperatorResolver;
    private final AuditEventPublisher auditEventPublisher;

    public RolePermissionInterceptor(CurrentOperatorResolver currentOperatorResolver, AuditEventPublisher auditEventPublisher) {
        this.currentOperatorResolver = currentOperatorResolver;
        this.auditEventPublisher = auditEventPublisher;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }
        CurrentOperator operator = currentOperatorResolver.resolve(request);
        CurrentOperatorHolder.set(operator);
        RequireRole requireRole = findRequireRole(handlerMethod);
        if (requireRole == null || operator.hasAnyRole(requireRole.value())) {
            return true;
        }
        auditEventPublisher.publish("security", "deny", request.getRequestURI(), operator.account(), false);
        throw new BusinessException("PERMISSION_DENIED", "当前角色无权执行该操作");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception exception) {
        CurrentOperatorHolder.clear();
    }

    private RequireRole findRequireRole(HandlerMethod handlerMethod) {
        RequireRole methodRole = handlerMethod.getMethodAnnotation(RequireRole.class);
        if (methodRole != null) {
            return methodRole;
        }
        return handlerMethod.getBeanType().getAnnotation(RequireRole.class);
    }
}
