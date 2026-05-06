package com.beegeo.publish.application;

import com.beegeo.common.api.BusinessException;
import com.beegeo.common.audit.AuditEventPublisher;
import com.beegeo.integration.port.CredentialPort;
import com.beegeo.publish.domain.PublishAccountEntity;
import com.beegeo.publish.domain.PublishAccountView;
import com.beegeo.publish.domain.PublishCommand;
import com.beegeo.publish.domain.PublishCredential;
import com.beegeo.publish.domain.PublishReceipt;
import com.beegeo.publish.domain.PublishReceiptEntity;
import com.beegeo.publish.domain.PublishReceiptView;
import com.beegeo.publish.domain.PublishStatus;
import com.beegeo.publish.domain.PublishTaskCommand;
import com.beegeo.publish.domain.PublishTaskEntity;
import com.beegeo.publish.domain.PublishTaskView;
import com.beegeo.publish.port.PublishAdapter;
import com.beegeo.publish.repository.PublishAccountRepository;
import com.beegeo.publish.repository.PublishReceiptRepository;
import com.beegeo.publish.repository.PublishTaskRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublishTaskApplicationService {
    private static final int DEFAULT_MAX_RETRY_COUNT = 3;

    private final List<PublishAdapter> adapters;
    private final CredentialPort credentialPort;
    private final AuditEventPublisher auditEventPublisher;
    private final PublishTaskRepository publishTaskRepository;
    private final PublishAccountRepository publishAccountRepository;
    private final PublishReceiptRepository publishReceiptRepository;
    private final long retryDelaySeconds;

    public PublishTaskApplicationService(
        List<PublishAdapter> adapters,
        CredentialPort credentialPort,
        AuditEventPublisher auditEventPublisher,
        PublishTaskRepository publishTaskRepository,
        PublishAccountRepository publishAccountRepository,
        PublishReceiptRepository publishReceiptRepository,
        @Value("${bee-geo.publish.scheduler.retry-delay-seconds:300}") long retryDelaySeconds
    ) {
        this.adapters = adapters;
        this.credentialPort = credentialPort;
        this.auditEventPublisher = auditEventPublisher;
        this.publishTaskRepository = publishTaskRepository;
        this.publishAccountRepository = publishAccountRepository;
        this.publishReceiptRepository = publishReceiptRepository;
        this.retryDelaySeconds = retryDelaySeconds;
    }

    @Transactional(readOnly = true)
    public List<PublishTaskView> listTasks(String keyword, String platformCode, PublishStatus status) {
        return publishTaskRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
            .filter(task -> matchesKeyword(task, keyword))
            .filter(task -> matchesPlatform(task, platformCode))
            .filter(task -> status == null || task.getStatus() == status)
            .map(this::toTaskView)
            .toList();
    }

    @Transactional(readOnly = true)
    public PublishTaskView detail(Long id) {
        return toTaskView(findTask(id));
    }

    @Transactional(readOnly = true)
    public List<PublishAccountView> listAccounts() {
        return publishAccountRepository.findAll(Sort.by(Sort.Direction.ASC, "platformCode", "name")).stream()
            .map(this::toAccountView)
            .toList();
    }

    @Transactional
    public PublishTaskView create(PublishTaskCommand command) {
        PublishAccountEntity account = findPublishAccount(command.accountId(), command.platformCode());
        if (!"VALID".equals(account.getStatus())) {
            throw new BusinessException("PUBLISH_ACCOUNT_INVALID", "发布账号状态不可用，请先完成重新授权");
        }
        PublishTaskEntity task = new PublishTaskEntity(
            command.contentId() == null ? 0L : command.contentId(),
            command.title().trim(),
            command.body().trim(),
            account,
            command.scheduledAt() == null ? LocalDateTime.now() : command.scheduledAt(),
            normalizeMaxRetryCount(command.maxRetryCount())
        );
        PublishTaskEntity saved = publishTaskRepository.save(task);
        auditEventPublisher.publish("publish", "createTask", String.valueOf(saved.getId()), "system", true);
        return toTaskView(saved);
    }

    @Transactional
    public PublishReceipt retry(Long id) {
        PublishTaskEntity task = findTask(id);
        if (task.getStatus() == PublishStatus.PUBLISHED) {
            throw new BusinessException("PUBLISH_TASK_ALREADY_SUCCESS", "发布成功的任务不能重试");
        }
        if (task.getStatus() == PublishStatus.REVOKED) {
            throw new BusinessException("PUBLISH_TASK_REVOKED", "已撤回的任务不能重试");
        }
        if (task.getRetryCount() >= task.getMaxRetryCount()) {
            PublishReceipt receipt = new PublishReceipt(false, task.getExternalPublishId(), task.getPublishUrl(), "超过最大重试次数，已转人工介入", LocalDateTime.now());
            task.markManualRequired(receipt.message());
            saveReceipt(task, receipt, task.getRetryCount());
            auditEventPublisher.publish("publish", "retry", String.valueOf(id), "system", false);
            return receipt;
        }
        return executeTask(task);
    }

    @Transactional
    public PublishReceipt revoke(Long id) {
        PublishTaskEntity task = findTask(id);
        if (task.getStatus() == PublishStatus.REVOKED) {
            return new PublishReceipt(true, task.getExternalPublishId(), task.getPublishUrl(), "任务已撤回", LocalDateTime.now());
        }
        PublishReceipt receipt;
        if (task.getExternalPublishId() == null || task.getExternalPublishId().isBlank()) {
            receipt = new PublishReceipt(true, "", "", "未产生外部发布记录，已撤回本地排期", LocalDateTime.now());
        } else {
            PublishAdapter adapter = findAdapter(task.getPlatformCode());
            PublishCredential credential = credentialPort.loadPlainForPublish(task.getAccountId(), task.getPlatformCode());
            if (!adapter.validateCredential(credential)) {
                receipt = new PublishReceipt(false, task.getExternalPublishId(), task.getPublishUrl(), "撤回失败：发布账号授权无效", LocalDateTime.now());
                task.markManualRequired(receipt.message());
                saveReceipt(task, receipt, task.getRetryCount());
                auditEventPublisher.publish("publish", "revoke", String.valueOf(id), "system", false);
                return receipt;
            }
            receipt = adapter.revoke(task.getExternalPublishId(), credential);
        }
        task.markRevoked(receipt);
        saveReceipt(task, receipt, task.getRetryCount());
        auditEventPublisher.publish("publish", "revoke", String.valueOf(id), "system", receipt.success());
        return receipt;
    }

    @Transactional(readOnly = true)
    public List<PublishReceiptView> listReceipts(Long taskId) {
        findTask(taskId);
        return publishReceiptRepository.findByTaskId(taskId, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .map(this::toReceiptView)
            .toList();
    }

    @Transactional
    public PublishReceipt execute(PublishCommand command) {
        PublishTaskCommand taskCommand = new PublishTaskCommand(
            command.contentId(),
            command.title(),
            command.body(),
            command.platformCode(),
            command.accountId(),
            command.scheduledAt(),
            DEFAULT_MAX_RETRY_COUNT
        );
        PublishTaskView task = create(taskCommand);
        return retry(task.id());
    }

    @Transactional
    public int dispatchDueTasks(int limit) {
        int effectiveLimit = Math.max(1, Math.min(limit, 100));
        LocalDateTime now = LocalDateTime.now();
        List<PublishTaskEntity> scheduledTasks = publishTaskRepository.findByStatusAndScheduledAtLessThanEqual(
            PublishStatus.SCHEDULED,
            now,
            PageRequest.of(0, effectiveLimit, Sort.by(Sort.Direction.ASC, "scheduledAt"))
        );
        int dispatchedCount = 0;
        for (PublishTaskEntity task : scheduledTasks) {
            executeTask(task);
            dispatchedCount++;
        }
        int remainingLimit = effectiveLimit - dispatchedCount;
        if (remainingLimit <= 0) {
            return dispatchedCount;
        }
        List<PublishTaskEntity> retryTasks = publishTaskRepository.findByStatus(
            PublishStatus.FAILED,
            Sort.by(Sort.Direction.ASC, "lastAttemptAt", "scheduledAt")
        ).stream()
            .filter(this::canAutoRetry)
            .limit(remainingLimit)
            .toList();
        for (PublishTaskEntity task : retryTasks) {
            executeTask(task);
            dispatchedCount++;
        }
        return dispatchedCount;
    }

    private PublishReceipt executeTask(PublishTaskEntity task) {
        PublishAccountEntity account = findPublishAccount(task.getAccountId(), task.getPlatformCode());
        if (!"VALID".equals(account.getStatus())) {
            PublishReceipt receipt = new PublishReceipt(false, task.getExternalPublishId(), task.getPublishUrl(), "发布账号状态不可用，请先完成重新授权", LocalDateTime.now());
            task.markManualRequired(receipt.message());
            saveReceipt(task, receipt, task.getRetryCount());
            auditEventPublisher.publish("publish", "validateAccount", task.getAccountId(), "system", false);
            return receipt;
        }
        PublishAdapter adapter = findAdapter(task.getPlatformCode());
        PublishCredential credential = credentialPort.loadPlainForPublish(task.getAccountId(), task.getPlatformCode());
        if (!adapter.validateCredential(credential)) {
            PublishReceipt receipt = new PublishReceipt(false, task.getExternalPublishId(), task.getPublishUrl(), "发布账号授权无效，请重新授权", LocalDateTime.now());
            task.markManualRequired(receipt.message());
            saveReceipt(task, receipt, task.getRetryCount());
            auditEventPublisher.publish("publish", "validateCredential", task.getAccountId(), "system", false);
            return receipt;
        }
        task.markPublishing();
        PublishCommand command = new PublishCommand(
            task.getContentId(),
            task.getTitle(),
            task.getBody(),
            task.getPlatformCode(),
            task.getAccountId(),
            task.getScheduledAt(),
            account.getEndpoint()
        );
        PublishReceipt receipt = adapter.publish(command, credential);
        if (receipt.success()) {
            task.markPublished(receipt);
        } else {
            task.markFailed(receipt);
        }
        saveReceipt(task, receipt, task.getRetryCount());
        auditEventPublisher.publish("publish", "publish", String.valueOf(task.getId()), "system", receipt.success());
        return receipt;
    }

    private PublishAdapter findAdapter(String platformCode) {
        return adapters.stream()
            .filter(adapter -> adapter.platformCode().equals(platformCode))
            .findFirst()
            .orElseThrow(() -> new BusinessException("PUBLISH_ADAPTER_NOT_FOUND", "未找到发布平台适配器"));
    }

    private PublishTaskEntity findTask(Long id) {
        return publishTaskRepository.findById(id)
            .orElseThrow(() -> new BusinessException("PUBLISH_TASK_NOT_FOUND", "发布任务不存在"));
    }

    private PublishAccountEntity findPublishAccount(String accountId, String platformCode) {
        return publishAccountRepository.findByAccountIdAndPlatformCode(accountId, platformCode)
            .orElseThrow(() -> new BusinessException("PUBLISH_ACCOUNT_NOT_FOUND", "发布账号不存在"));
    }

    private void saveReceipt(PublishTaskEntity task, PublishReceipt receipt, Integer attemptNo) {
        publishReceiptRepository.save(new PublishReceiptEntity(task, receipt, attemptNo));
    }

    private boolean matchesKeyword(PublishTaskEntity task, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String normalized = keyword.trim().toLowerCase(Locale.ROOT);
        return task.getTitle().toLowerCase(Locale.ROOT).contains(normalized)
            || task.getAccountName().toLowerCase(Locale.ROOT).contains(normalized)
            || task.getPlatformName().toLowerCase(Locale.ROOT).contains(normalized);
    }

    private boolean matchesPlatform(PublishTaskEntity task, String platformCode) {
        return platformCode == null || platformCode.isBlank() || task.getPlatformCode().equals(platformCode);
    }

    private int normalizeMaxRetryCount(Integer maxRetryCount) {
        if (maxRetryCount == null) {
            return DEFAULT_MAX_RETRY_COUNT;
        }
        return Math.max(0, Math.min(10, maxRetryCount));
    }

    private boolean canAutoRetry(PublishTaskEntity task) {
        if (task.getRetryCount() >= task.getMaxRetryCount()) {
            return false;
        }
        LocalDateTime lastAttemptAt = task.getLastAttemptAt();
        return lastAttemptAt == null || lastAttemptAt.plusSeconds(retryDelaySeconds).isBefore(LocalDateTime.now());
    }

    private PublishTaskView toTaskView(PublishTaskEntity task) {
        return new PublishTaskView(
            task.getId(),
            task.getContentId(),
            task.getTitle(),
            task.getPlatformName(),
            task.getPlatformCode(),
            task.getAccountName(),
            task.getAccountId(),
            task.getScheduledAt(),
            task.getStatus(),
            task.getRetryCount(),
            task.getMaxRetryCount(),
            task.getLastReceiptMessage(),
            task.getPublishUrl(),
            task.getExternalPublishId(),
            task.getLastAttemptAt(),
            task.getPublishedAt()
        );
    }

    private PublishAccountView toAccountView(PublishAccountEntity account) {
        return new PublishAccountView(
            account.getId(),
            account.getAccountId(),
            account.getName(),
            account.getPlatformCode(),
            account.getPlatformName(),
            account.getEndpoint(),
            account.getStatus(),
            account.getExpiresAt()
        );
    }

    private PublishReceiptView toReceiptView(PublishReceiptEntity receipt) {
        return new PublishReceiptView(
            receipt.getId(),
            receipt.getTaskId(),
            receipt.getPlatformCode(),
            receipt.getAccountId(),
            receipt.getAttemptNo(),
            receipt.getSuccess(),
            receipt.getExternalPublishId(),
            receipt.getUrl(),
            receipt.getMessage(),
            receipt.getPublishedAt(),
            receipt.getCreatedAt()
        );
    }
}
