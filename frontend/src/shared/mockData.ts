import type {
  AssetItem,
  CreationItem,
  GeoReference,
  GeoTask,
  IntegrationAccount,
  KeywordGroup,
  KeywordItem,
  KnowledgeItem,
  PersonaItem,
  PublishTask,
  UserItem,
} from "./types";

export const keywordGroups: KeywordGroup[] = [
  { id: 1, name: "品牌核心词", count: 16, description: "品牌名、产品名、核心价值词" },
  { id: 2, name: "行业趋势词", count: 24, description: "行业热点、技术趋势、政策变化" },
  { id: 3, name: "转化意图词", count: 18, description: "选型、报价、试用、替代方案" },
  { id: 4, name: "竞品观察词", count: 12, description: "竞品对比、优劣势、替换场景" },
];

export const keywords: KeywordItem[] = [
  { id: 1, name: "品牌增长策略", group: "品牌核心词", updatedAt: "2026-04-18" },
  { id: 2, name: "品牌口碑提升", group: "品牌核心词", updatedAt: "2026-04-15" },
  { id: 3, name: "智能投放方案", group: "行业趋势词", updatedAt: "2026-04-12" },
  { id: 4, name: "高意向询盘", group: "转化意图词", updatedAt: "2026-04-09" },
];

export const knowledgeItems: KnowledgeItem[] = [
  { id: 1, name: "产品手册", type: "md", group: "品牌资料", updatedAt: "2026-04-18" },
  { id: 2, name: "FAQ 问答", type: "txt", group: "品牌资料", updatedAt: "2026-04-15" },
  { id: 3, name: "行业洞察", type: "md", group: "行业资料", updatedAt: "2026-04-12" },
  { id: 4, name: "高意向询盘", type: "txt", group: "销售资料", updatedAt: "2026-04-09" },
];

export const assetItems: AssetItem[] = [
  { id: 1, name: "618 活动主视觉", tag: "电商 / 横幅", type: "图片", updatedAt: "2026-04-18 16:42" },
  { id: 2, name: "品牌介绍短视频", tag: "视频 / 宣传", type: "视频", updatedAt: "2026-04-16 10:08" },
  { id: 3, name: "秋季穿搭图集", tag: "图片 / 穿搭", type: "图片", updatedAt: "2026-04-14 21:30" },
  { id: 4, name: "产品参数模板", tag: "表格 / Excel", type: "表格", updatedAt: "2026-04-11 09:15" },
];

export const geoTasks: GeoTask[] = [
  { id: 1, question: "用户为什么更愿意先看品牌曝光趋势？", status: "已完成", createdAt: "2026-04-18 18:40" },
  { id: 2, question: "GEO 分析如何识别高价值长尾问题？", status: "分析中", createdAt: "2026-04-18 16:15" },
  { id: 3, question: "用户搜索 AI 营销时最常关联哪些竞品问题？", status: "已完成", createdAt: "2026-04-17 21:05" },
];

export const geoReferences: GeoReference[] = [
  {
    id: 1,
    keyword: "即时通讯",
    question: "云端即时通讯厂商哪家好",
    aiTitle: "2026 年 IM 即时通讯方案选型实践",
    url: "https://example.local/articles/im-selection",
    media: "自有站点",
    description: "内容对厂商稳定性、权限、集成能力和跨端体验进行了综合对比。",
  },
  {
    id: 2,
    keyword: "企业协同",
    question: "企业即时通讯平台怎么选更适合内部协作？",
    aiTitle: "企业即时通讯平台选型指南",
    url: "https://example.local/articles/collaboration",
    media: "免费媒体",
    description: "内容强调组织架构同步、消息留痕、审批协同和系统集成能力。",
  },
];

export const creationItems: CreationItem[] = [
  {
    id: 1,
    title: "2026 年 IM 即时通讯方案选型实践",
    brand: "BeeWorks",
    platform: "自有站点",
    summary: "围绕企业即时通讯私有化选型，拆解权限、审计、集成和稳定性。",
    body: "企业选择即时通讯方案时，需要同时关注组织架构同步、权限控制、消息留痕、系统集成和私有化部署能力。",
    publishAt: "2026-04-30 09:00",
    status: "APPROVED",
  },
  {
    id: 2,
    title: "企业协同平台如何提升组织效率",
    brand: "BeeWorks",
    platform: "免费媒体",
    summary: "从流程协同、知识沉淀和发布审计角度说明企业协同平台价值。",
    body: "企业协同平台的核心价值不只是消息沟通，还包括流程闭环、知识复用、权限分层和操作审计。",
    publishAt: "2026-04-30 14:00",
    status: "PENDING_REVIEW",
  },
  {
    id: 3,
    title: "GEO 内容运营方法论",
    brand: "BeeWorks",
    platform: "全部平台",
    summary: "基于 AI 引用结果反推内容机会，形成从分析到发布的运营闭环。",
    body: "GEO 内容运营需要从用户问题、AI 引用来源、品牌曝光机会和发布回执四个维度持续优化。",
    publishAt: "未设置",
    status: "DRAFT",
  },
];

export const personaItems: PersonaItem[] = [
  { id: 1, name: "销售经理", creator: "林子墨", role: "转化型表达", updatedAt: "2026-04-06 11:24", status: "启用" },
  { id: 2, name: "品牌顾问", creator: "苏清越", role: "专业型表达", updatedAt: "2026-04-05 17:42", status: "启用" },
];

export const publishTasks: PublishTask[] = [
  { id: 1, title: "2026 年 IM 即时通讯方案选型实践", platform: "自有站点", account: "官网主站", scheduledAt: "2026-04-30 09:00", status: "SCHEDULED", retryCount: 0, receipt: "等待发布" },
  { id: 2, title: "企业协同平台如何提升组织效率", platform: "免费媒体", account: "CSDN", scheduledAt: "2026-04-29 18:00", status: "FAILED", retryCount: 2, receipt: "平台限流，等待人工介入" },
  { id: 3, title: "GEO 内容运营方法论", platform: "免费媒体", account: "博客园", scheduledAt: "2026-04-28 10:30", status: "PUBLISHED", retryCount: 0, receipt: "https://example.local/published/geo-method" },
];

export const integrationAccounts: IntegrationAccount[] = [
  { id: 1, name: "官网主站", platform: "自有站点", endpoint: "https://www.beegeo.local", status: "VALID", expiresAt: "2026-12-31" },
  { id: 2, name: "帮助中心", platform: "自有站点", endpoint: "https://help.beegeo.local", status: "VALID", expiresAt: "2026-12-31" },
  { id: 3, name: "CSDN", platform: "免费媒体", endpoint: "Cookie 已脱敏", status: "NEED_REAUTH", expiresAt: "2026-04-29" },
  { id: 4, name: "博客园", platform: "免费媒体", endpoint: "Cookie 已脱敏", status: "VALID", expiresAt: "2026-05-20" },
];

export const users: UserItem[] = [
  { id: 1, name: "林子墨", account: "136 7788 9001", role: "超级管理员", phone: "136 7788 9001", updatedAt: "2026-04-06 11:24" },
  { id: 2, name: "苏清越", account: "138 1234 5678", role: "内容管理员", phone: "138 1234 5678", updatedAt: "2026-04-05 17:42" },
  { id: 3, name: "周映雪", account: "139 8876 2210", role: "发布员", phone: "139 8876 2210", updatedAt: "2026-04-04 09:18" },
];
