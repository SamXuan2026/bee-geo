package com.beegeo.common.api;

import com.beegeo.common.ai.AiProviderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Void> handleBusinessException(BusinessException exception) {
        return ApiResponse.fail(exception.code(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleValidationException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getField() + " " + error.getDefaultMessage())
            .orElse("参数校验失败");
        return ApiResponse.fail("VALIDATION_ERROR", message);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ApiResponse<Void> handleDataIntegrityViolationException(DataIntegrityViolationException exception) {
        LOGGER.warn("数据库约束异常", exception);
        return ApiResponse.fail("DATA_CONSTRAINT_VIOLATION", "数据不满足唯一性或关联约束，请检查后重试");
    }

    @ExceptionHandler(AiProviderException.class)
    public ApiResponse<Void> handleAiProviderException(AiProviderException exception) {
        LOGGER.warn("AI Provider 调用异常：{}", exception.getMessage());
        return ApiResponse.fail("AI_PROVIDER_ERROR", exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception exception) {
        LOGGER.error("未处理系统异常", exception);
        return ApiResponse.fail("SERVER_ERROR", "系统繁忙，请稍后重试");
    }
}
