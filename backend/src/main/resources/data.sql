INSERT INTO keywords (id, name, group_name, description, enabled, created_at, updated_at) VALUES
    (1, '品牌增长策略', '品牌核心词', '用于 GEO 分析的品牌增长主关键词', TRUE, '2026-04-18 09:00:00', '2026-04-18 09:00:00'),
    (2, '品牌口碑提升', '品牌核心词', '用于监测口碑与内容建设方向', TRUE, '2026-04-15 09:00:00', '2026-04-15 09:00:00'),
    (3, '智能投放方案', '行业趋势词', '用于行业趋势与竞品内容分析', TRUE, '2026-04-12 09:00:00', '2026-04-12 09:00:00');

INSERT INTO knowledge_items (id, name, type, group_name, content, enabled, created_at, updated_at) VALUES
    (1, '产品手册', 'md', '品牌资料', '产品能力、部署形态、私有化优势说明。', TRUE, '2026-04-18 10:00:00', '2026-04-18 10:00:00'),
    (2, 'FAQ 问答', 'txt', '品牌资料', '客户高频问题与标准答复。', TRUE, '2026-04-15 10:00:00', '2026-04-15 10:00:00'),
    (3, '行业洞察', 'md', '行业资料', 'GEO、AI 内容与自动化发布趋势材料。', TRUE, '2026-04-12 10:00:00', '2026-04-12 10:00:00');

INSERT INTO assets (id, name, type, tag, storage_url, enabled, created_at, updated_at) VALUES
    (1, '618 活动主视觉', '图片', '电商 / 横幅', '/assets/618-banner.png', TRUE, '2026-04-18 16:42:00', '2026-04-18 16:42:00'),
    (2, '品牌介绍短视频', '视频', '视频 / 宣传', '/assets/brand-intro.mp4', TRUE, '2026-04-16 10:08:00', '2026-04-16 10:08:00'),
    (3, '产品参数模板', '表格', '表格 / Excel', '/assets/product-template.xlsx', TRUE, '2026-04-11 09:15:00', '2026-04-11 09:15:00');

INSERT INTO personas (id, name, creator, role_name, tone, status, prompt_template, created_at, updated_at) VALUES
    (1, '销售经理', '林子墨', '转化型表达', '专业、明确、强调转化', '启用', '以销售经理视角输出内容，强调价值、证据与行动建议。', '2026-04-18 11:00:00', '2026-04-18 11:00:00'),
    (2, '品牌顾问', '苏清越', '专业型表达', '稳健、可信、强调品牌资产', '启用', '以品牌顾问视角输出内容，强调专业解释与长期价值。', '2026-04-15 11:00:00', '2026-04-15 11:00:00');

INSERT INTO app_users (id, name, account, role_code, role_name, status, created_at, updated_at) VALUES
    (1, '林子墨', '13677889001', 'SUPER_ADMIN', '超级管理员', '启用', '2026-04-18 12:00:00', '2026-04-18 12:00:00'),
    (2, '苏清越', '13812345678', 'CONTENT_ADMIN', '内容管理员', '启用', '2026-04-15 12:00:00', '2026-04-15 12:00:00'),
    (3, '周映雪', '13988762210', 'PUBLISHER', '发布员', '启用', '2026-04-12 12:00:00', '2026-04-12 12:00:00');

INSERT INTO geo_tasks (id, keyword, status, question_count, created_at, updated_at) VALUES
    (1, '企业协同平台', '已完成', 3, '2026-04-18 18:40:00', '2026-04-18 18:45:00');

INSERT INTO geo_results (id, task_id, keyword, question, ai_title, url, media, description, created_at, updated_at) VALUES
    (1, 1, '企业协同平台', '企业协同平台怎么选更适合内部协作？', '2026 年 IM 即时通讯方案选型实践', 'https://example.local/articles/im-selection', '自有站点', '内容对厂商稳定性、权限、集成能力和跨端体验进行了综合对比。', '2026-04-18 18:41:00', '2026-04-18 18:41:00'),
    (2, 1, '企业协同平台', '企业即时通讯平台怎么选更适合内部协作？', '企业即时通讯平台选型指南', 'https://example.local/articles/collaboration', '免费媒体', '内容强调组织架构同步、消息留痕、审批协同和系统集成能力。', '2026-04-18 18:42:00', '2026-04-18 18:42:00'),
    (3, 1, '企业协同平台', '企业协同平台在 AI 搜索里如何提升品牌曝光？', 'GEO 内容运营方法论', 'https://example.local/articles/geo-method', '自有站点', '内容沉淀 GEO 分析、AI 创作、审核和自动化发布闭环。', '2026-04-18 18:43:00', '2026-04-18 18:43:00');

INSERT INTO creations (id, geo_task_id, title, brand, platform, summary, body, status, publish_at, created_at, updated_at) VALUES
    (1, 1, '2026 年 IM 即时通讯方案选型实践', 'BeeWorks', '自有站点', '围绕企业 IM 选型的 GEO 内容草稿。', '围绕企业私有化部署、权限审计、跨端协同和发布闭环展开。', 'APPROVED', '2026-04-30 09:00:00', '2026-04-18 19:00:00', '2026-04-18 19:10:00'),
    (2, 1, '企业协同平台如何提升组织效率', 'BeeWorks', '免费媒体', '围绕企业协同效率提升的内容草稿。', '从组织架构同步、消息留痕、流程协作和智能内容生成说明协同效率提升路径。', 'PENDING_REVIEW', '2026-04-30 14:00:00', '2026-04-18 19:20:00', '2026-04-18 19:25:00');

INSERT INTO publish_accounts (id, account_id, name, platform_code, platform_name, endpoint, status, expires_at, created_at, updated_at) VALUES
    (1, 'site-main', '官网主站', 'OWNED_SITE', '自有站点', 'https://www.beegeo.local', 'VALID', '2026-12-31', '2026-04-18 13:00:00', '2026-04-18 13:00:00'),
    (2, 'csdn', 'CSDN', 'FREE_MEDIA', '免费媒体', 'Cookie 已脱敏', 'NEED_REAUTH', '2026-04-29', '2026-04-18 13:10:00', '2026-04-18 13:10:00'),
    (3, 'cnblogs', '博客园', 'FREE_MEDIA', '免费媒体', 'Cookie 已脱敏', 'VALID', '2026-05-20', '2026-04-18 13:20:00', '2026-04-18 13:20:00');

INSERT INTO publish_tasks (id, content_id, title, body, platform_code, platform_name, account_id, account_name, scheduled_at, status, retry_count, max_retry_count, last_receipt_message, external_publish_id, publish_url, last_attempt_at, published_at, created_at, updated_at) VALUES
    (1, 1, '2026 年 IM 即时通讯方案选型实践', '围绕企业私有化部署、权限审计、跨端协同和发布闭环展开。', 'OWNED_SITE', '自有站点', 'site-main', '官网主站', '2026-04-30 09:00:00', 'SCHEDULED', 0, 3, '等待发布', NULL, NULL, NULL, NULL, '2026-04-18 14:00:00', '2026-04-18 14:00:00'),
    (2, 2, '企业协同平台如何提升组织效率', '从组织架构同步、消息留痕、流程协作和智能内容生成说明协同效率提升路径。', 'FREE_MEDIA', '免费媒体', 'csdn', 'CSDN', '2026-04-29 18:00:00', 'FAILED', 2, 3, '免费媒体平台限流，等待重试', NULL, NULL, '2026-04-29 18:05:00', NULL, '2026-04-18 14:10:00', '2026-04-29 18:05:00'),
    (3, 3, 'GEO 内容运营方法论', '沉淀 GEO 分析、AI 创作、审核和自动化发布的运营闭环。', 'FREE_MEDIA', '免费媒体', 'cnblogs', '博客园', '2026-04-28 10:30:00', 'PUBLISHED', 0, 3, '发布成功', 'free-3', 'https://example.local/published/geo-method', '2026-04-28 10:31:00', '2026-04-28 10:31:00', '2026-04-18 14:20:00', '2026-04-28 10:31:00');

INSERT INTO publish_receipts (id, task_id, platform_code, account_id, attempt_no, success, external_publish_id, url, message, published_at, created_at, updated_at) VALUES
    (1, 2, 'FREE_MEDIA', 'csdn', 1, FALSE, NULL, NULL, '免费媒体平台限流，已进入重试队列', '2026-04-29 18:01:00', '2026-04-29 18:01:00', '2026-04-29 18:01:00'),
    (2, 2, 'FREE_MEDIA', 'csdn', 2, FALSE, NULL, NULL, '免费媒体平台限流，等待重试', '2026-04-29 18:05:00', '2026-04-29 18:05:00', '2026-04-29 18:05:00'),
    (3, 3, 'FREE_MEDIA', 'cnblogs', 0, TRUE, 'free-3', 'https://example.local/published/geo-method', '发布成功', '2026-04-28 10:31:00', '2026-04-28 10:31:00', '2026-04-28 10:31:00');

ALTER TABLE keywords ALTER COLUMN id RESTART WITH 100;
ALTER TABLE knowledge_items ALTER COLUMN id RESTART WITH 100;
ALTER TABLE assets ALTER COLUMN id RESTART WITH 100;
ALTER TABLE personas ALTER COLUMN id RESTART WITH 100;
ALTER TABLE app_users ALTER COLUMN id RESTART WITH 100;
ALTER TABLE geo_tasks ALTER COLUMN id RESTART WITH 100;
ALTER TABLE geo_results ALTER COLUMN id RESTART WITH 100;
ALTER TABLE creations ALTER COLUMN id RESTART WITH 100;
ALTER TABLE publish_accounts ALTER COLUMN id RESTART WITH 100;
ALTER TABLE publish_credentials ALTER COLUMN id RESTART WITH 100;
ALTER TABLE publish_tasks ALTER COLUMN id RESTART WITH 100;
ALTER TABLE publish_receipts ALTER COLUMN id RESTART WITH 100;
ALTER TABLE audit_logs ALTER COLUMN id RESTART WITH 100;
