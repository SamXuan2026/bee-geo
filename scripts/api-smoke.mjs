#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const baseUrl = (process.env.BEE_GEO_API_BASE || 'http://127.0.0.1:8088').replace(/\/$/, '');
const operatorAccount = process.env.BEE_GEO_SMOKE_OPERATOR || '13677889001';
const execFileAsync = promisify(execFile);

const checks = [];

function assertResult(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path) {
  const url = `${baseUrl}${path}`;
  let stdout;
  try {
    const result = await execFileAsync('curl', [
      '-sS',
      '-H',
      'Accept: application/json',
      '-H',
      `X-Bee-Account: ${operatorAccount}`,
      '-w',
      '\n%{http_code}',
      url
    ], { maxBuffer: 1024 * 1024 * 4 });
    stdout = result.stdout;
  } catch (error) {
    const detail = error.stderr || error.message;
    throw new Error(`接口连接失败：${path}，请确认后端已启动且地址可访问。详情：${detail}`);
  }
  const separatorIndex = stdout.lastIndexOf('\n');
  const text = stdout.slice(0, separatorIndex);
  const status = Number(stdout.slice(separatorIndex + 1).trim());
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new Error(`接口返回不是 JSON：${path}，状态码：${status}`);
  }
  if (status < 200 || status >= 300 || payload.success !== true) {
    throw new Error(`接口检查失败：${path}，状态码：${status}，业务码：${payload.code || 'UNKNOWN'}`);
  }
  return payload.data;
}

function record(name) {
  checks.push(name);
}

async function checkList(name, path, validateItem) {
  const data = await request(path);
  assertResult(Array.isArray(data), `${name} 应返回数组`);
  if (data.length > 0 && validateItem) {
    validateItem(data[0]);
  }
  record(name);
  return data;
}

async function main() {
  const health = await request('/api/health');
  assertResult(health.status === 'UP', '健康检查状态必须为 UP');
  record('健康检查');

  await checkList('关键词列表', '/api/keywords', item => assertResult(Boolean(item.name), '关键词必须包含名称'));
  await checkList('知识库列表', '/api/knowledge', item => assertResult(Boolean(item.name), '知识库必须包含名称'));
  await checkList('素材列表', '/api/assets', item => assertResult(Boolean(item.name), '素材必须包含名称'));
  await checkList('人设列表', '/api/personas', item => assertResult(Boolean(item.name), '人设必须包含名称'));
  await checkList('用户列表', '/api/users', item => assertResult(Boolean(item.account), '用户必须包含账号'));
  await checkList('用户角色', '/api/users/roles', item => assertResult(Boolean(item.code), '角色必须包含编码'));

  const aiProvider = await request('/api/ai/provider');
  assertResult(Boolean(aiProvider.providerName), 'AI Provider 必须返回名称');
  assertResult(Boolean(aiProvider.modelName), 'AI Provider 必须返回模型名');
  assertResult(typeof aiProvider.remoteProvider === 'boolean', 'AI Provider 必须返回远程模型标记');
  record('AI Provider 状态');

  const geoTasks = await checkList('GEO 任务', '/api/geo/tasks', item => assertResult(Boolean(item.keyword), 'GEO 任务必须包含关键词'));
  if (geoTasks.length > 0) {
    const detail = await request(`/api/geo/tasks/${geoTasks[0].id}`);
    assertResult(detail.id === geoTasks[0].id, 'GEO 详情 ID 必须匹配');
    await checkList('GEO 结果', `/api/geo/tasks/${geoTasks[0].id}/results`);
  }

  await checkList('创作列表', '/api/creations', item => assertResult(Boolean(item.title), '创作必须包含标题'));
  const publishTasks = await checkList('发布任务', '/api/publish/tasks', item => assertResult(Boolean(item.title), '发布任务必须包含标题'));
  await checkList('发布账号', '/api/publish/tasks/accounts', item => assertResult(Boolean(item.accountId), '发布账号必须包含账号 ID'));
  if (publishTasks.length > 0) {
    const detail = await request(`/api/publish/tasks/${publishTasks[0].id}`);
    assertResult(detail.id === publishTasks[0].id, '发布详情 ID 必须匹配');
    await checkList('发布回执', `/api/publish/tasks/${publishTasks[0].id}/receipts`);
  }

  const integrationAccounts = await checkList('集成账号', '/api/integrations/accounts', item => {
    assertResult(Boolean(item.accountId), '集成账号必须包含账号 ID');
    assertResult(!Object.prototype.hasOwnProperty.call(item, 'secretValue'), '集成账号禁止返回明文凭据字段');
  });
  integrationAccounts.forEach(item => {
    assertResult(item.maskedCredential === '' || item.maskedCredential === '******', '集成账号只能返回空值或脱敏凭据');
  });

  await checkList('权限矩阵', '/api/security/permissions', item => assertResult(Boolean(item.permission), '权限点必须包含编码'));
  const auditPage = await request('/api/audit/logs/page?page=1&pageSize=5');
  assertResult(Array.isArray(auditPage.items), '审计分页必须包含 items 数组');
  assertResult(typeof auditPage.total === 'number', '审计分页必须包含 total 数字');
  record('审计分页');

  const auditExport = await request('/api/audit/logs/export');
  assertResult(auditExport.contentType === 'text/csv;charset=utf-8', '审计导出类型必须为 CSV');
  assertResult(auditExport.content.includes('模块,动作,对象编号'), '审计导出必须包含 CSV 表头');
  record('审计导出');

  console.log(`运行态 API 冒烟检查通过：${checks.length} 项，地址：${baseUrl}，操作人：${operatorAccount}`);
}

main().catch(error => {
  console.error(`运行态 API 冒烟检查失败：${error.message}`);
  process.exit(1);
});
