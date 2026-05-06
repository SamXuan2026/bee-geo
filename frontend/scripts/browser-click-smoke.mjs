import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const root = new URL("..", import.meta.url).pathname;
const distRoot = join(root, "dist");
const host = process.env.BEE_GEO_BROWSER_HOST || "127.0.0.1";
const port = Number(process.env.BEE_GEO_BROWSER_PORT || "4188");
const browserMode = process.env.BEE_GEO_BROWSER_MODE || "file";
const chromePath = findChromePath();
const chromeUserDir = mkdtempSync(join(tmpdir(), "bee-geo-chrome-"));
let appUrl = `http://${host}:${port}/`;
let generatedSmokePage;
let chromeProcess;
let staticServer;
let browserSocket;

const mimeTypes = new Map([
  [".html", "text/html;charset=UTF-8"],
  [".js", "text/javascript;charset=UTF-8"],
  [".css", "text/css;charset=UTF-8"],
  [".json", "application/json;charset=UTF-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
]);

function assertResult(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function findChromePath() {
  const candidates = [
    process.env.BEE_GEO_CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

function contentType(filePath) {
  const dotIndex = filePath.lastIndexOf(".");
  const ext = dotIndex >= 0 ? filePath.slice(dotIndex) : "";
  return mimeTypes.get(ext) ?? "application/octet-stream";
}

function startStaticServer() {
  assertResult(existsSync(join(distRoot, "index.html")), "缺少前端构建产物，请先执行 npm run build");
  staticServer = createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url ?? "/", appUrl).pathname);
    const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
    const absolutePath = resolve(join(distRoot, normalizedPath));
    const safeRoot = resolve(distRoot);
    const targetPath = absolutePath.startsWith(safeRoot) && existsSync(absolutePath) && statSync(absolutePath).isFile()
      ? absolutePath
      : join(distRoot, "index.html");
    response.setHeader("Content-Type", contentType(targetPath));
    response.end(readFileSync(targetPath));
  });
  return new Promise((resolveServer, rejectServer) => {
    staticServer.once("error", rejectServer);
    staticServer.listen(port, host, resolveServer);
  });
}

function createFileSmokePage() {
  const indexPath = join(distRoot, "index.html");
  assertResult(existsSync(indexPath), "缺少前端构建产物，请先执行 npm run build");
  const source = readFileSync(indexPath, "utf8")
    .replaceAll('src="/assets/', 'src="./assets/')
    .replaceAll('href="/assets/', 'href="./assets/');
  generatedSmokePage = join(distRoot, ".browser-click-smoke.html");
  writeFileSync(generatedSmokePage, source);
  appUrl = pathToFileURL(generatedSmokePage).href;
}

function startChrome() {
  assertResult(chromePath, "未找到 Chrome/Chromium，请设置 BEE_GEO_CHROME_PATH 后重试");
  chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--allow-file-access-from-files",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-extensions",
    "--remote-debugging-port=0",
    `--user-data-dir=${chromeUserDir}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  return new Promise((resolveChrome, rejectChrome) => {
    let stderr = "";
    const timer = setTimeout(() => rejectChrome(new Error("Chrome 调试端口启动超时")), 15000);
    chromeProcess.once("error", (error) => {
      clearTimeout(timer);
      rejectChrome(new Error(`Chrome 启动失败：${error.message}`));
    });
    chromeProcess.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolveChrome(match[1]);
      }
    });
    chromeProcess.once("exit", (code, signal) => {
      clearTimeout(timer);
      rejectChrome(new Error(`Chrome 提前退出，退出码：${code ?? "未知"}，信号：${signal ?? "无"}，输出：${stderr.slice(-1000) || "无"}`));
    });
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Chrome 调试接口请求失败：${url}，状态码：${response.status}`);
  }
  return response.json();
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.callbacks = new Map();
    this.events = new Map();
    socket.addEventListener("message", (event) => this.receive(event.data));
  }

  receive(data) {
    const message = JSON.parse(data);
    if (message.id && this.callbacks.has(message.id)) {
      const callback = this.callbacks.get(message.id);
      this.callbacks.delete(message.id);
      if (message.error) {
        callback.reject(new Error(message.error.message));
      } else {
        callback.resolve(message.result);
      }
      return;
    }
    const listeners = this.events.get(message.method) ?? [];
    listeners.forEach((listener) => listener(message.params));
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveSend, rejectSend) => {
      this.callbacks.set(id, { resolve: resolveSend, reject: rejectSend });
    });
  }

  once(method) {
    return new Promise((resolveEvent) => {
      const listener = (params) => {
        const listeners = this.events.get(method) ?? [];
        this.events.set(method, listeners.filter((item) => item !== listener));
        resolveEvent(params);
      };
      this.events.set(method, [...(this.events.get(method) ?? []), listener]);
    });
  }
}

async function connectPage(browserWebSocketUrl) {
  const browserEndpoint = new URL(browserWebSocketUrl);
  const versionUrl = `http://${browserEndpoint.hostname}:${browserEndpoint.port}/json/list`;
  const targets = await fetchJson(versionUrl);
  const target = targets.find((item) => item.type === "page");
  assertResult(target?.webSocketDebuggerUrl, "未找到 Chrome 页面调试目标");
  browserSocket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveSocket, rejectSocket) => {
    browserSocket.addEventListener("open", resolveSocket, { once: true });
    browserSocket.addEventListener("error", rejectSocket, { once: true });
  });
  return new CdpClient(browserSocket);
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "浏览器脚本执行失败");
  }
  if (result.result?.subtype === "error") {
    throw new Error(result.result.description || "浏览器脚本执行失败");
  }
  return result.result?.value;
}

async function waitForPageLoad(client) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  const loadEvent = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url: appUrl });
  await loadEvent;
}

async function injectHelper(client) {
  await evaluate(client, `
    window.__beeGeoClickSmoke = {
      visible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      },
      text(element) {
        return (element.textContent || "").replace(/\\s+/g, " ").trim();
      },
      elements(selector) {
        return Array.from(document.querySelectorAll(selector)).filter((element) => this.visible(element));
      },
      clickButton(label) {
        const buttons = this.elements("button");
        const exact = buttons.find((button) => this.text(button) === label && !button.disabled);
        const fuzzy = buttons.find((button) => this.text(button).includes(label) && !button.disabled);
        const target = exact || fuzzy;
        if (!target) {
          throw new Error("找不到可点击按钮：" + label);
        }
        target.click();
        return this.text(target);
      },
      setFieldByPlaceholder(placeholder, value) {
        const fields = this.elements("input, textarea");
        const target = fields.find((field) => field.getAttribute("placeholder") === placeholder);
        if (!target) {
          throw new Error("找不到输入框：" + placeholder);
        }
        const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
        descriptor.set.call(target, value);
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      },
      setFieldByLabel(label, value) {
        const labels = this.elements("label.form-field");
        const container = labels.find((item) => this.text(item).includes(label));
        if (!container) {
          throw new Error("找不到表单项：" + label);
        }
        const target = container.querySelector("input, textarea, select");
        if (!target) {
          throw new Error("表单项缺少输入控件：" + label);
        }
        const prototype = target instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : target instanceof HTMLSelectElement
            ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
        descriptor.set.call(target, value);
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      },
      selectRole(value) {
        const target = document.querySelector(".role-switcher");
        if (!target) {
          throw new Error("找不到角色切换器");
        }
        const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
        descriptor.set.call(target, value);
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      },
      bodyText() {
        return document.body.innerText;
      },
      hasText(text) {
        return this.bodyText().includes(text);
      },
      waitForText(text, timeoutMs = 5000) {
        const startedAt = Date.now();
        return new Promise((resolve, reject) => {
          const tick = () => {
            if (this.hasText(text)) {
              resolve(true);
              return;
            }
            if (Date.now() - startedAt > timeoutMs) {
              reject(new Error("等待文本超时：" + text));
              return;
            }
            window.setTimeout(tick, 80);
          };
          tick();
        });
      }
    };
    true;
  `);
}

async function act(client, expression) {
  return evaluate(client, `Promise.resolve((async () => { ${expression} })())`);
}

async function click(client, label, expectedText) {
  await act(client, `window.__beeGeoClickSmoke.clickButton(${JSON.stringify(label)});`);
  if (expectedText) {
    await waitText(client, expectedText);
  }
}

async function waitText(client, text) {
  await act(client, `await window.__beeGeoClickSmoke.waitForText(${JSON.stringify(text)});`);
}

async function runClickFlow(client) {
  await waitText(client, "总览仪表盘");
  await click(client, "GEO分析", "GEO 分析");
  await click(client, "创建分析任务", "GEO 分析任务已完成");
  await click(client, "基于结果开始仿写", "AI 创作");
  await click(client, "添加新的创作", "已创建本地草稿");
  await click(client, "重新生成", "已根据当前摘要重新生成正文草稿");
  await click(client, "保存为草稿", "草稿已保存");
  await click(client, "提交审核", "内容已提交审核");
  await click(client, "审核通过", "内容已审核通过");
  await click(client, "创建排期", "发布中心");
  await click(client, "创建发布任务", "创建发布任务");
  await act(client, `
    window.__beeGeoClickSmoke.setFieldByLabel("内容标题", "浏览器点击测试发布任务");
    window.__beeGeoClickSmoke.setFieldByLabel("发布正文", "用于验证发布中心创建任务按钮、表单和保存动作。");
  `);
  await click(client, "保存任务", "发布任务已创建");
  await click(client, "查看", "发布回执");
  await click(client, "关闭", "发布中心");
  await click(client, "集成设置", "集成设置");
  await click(client, "重新授权", "重新授权");
  await act(client, `window.__beeGeoClickSmoke.setFieldByLabel("Token / Cookie", "browser-click-smoke-token");`);
  await click(client, "加密保存", "授权凭据已加密保存");
  await click(client, "审计日志", "审计日志");
  await click(client, "导出 CSV", "审计导出");
  await click(client, "关闭", "审计日志");
  await act(client, `window.__beeGeoClickSmoke.selectRole("PUBLISHER");`);
  await waitText(client, "当前演示角色已切换为发布员");
}

async function cleanup() {
  if (browserSocket) {
    browserSocket.close();
  }
  if (chromeProcess && !chromeProcess.killed) {
    chromeProcess.kill("SIGTERM");
  }
  if (staticServer) {
    await new Promise((resolveClose) => staticServer.close(resolveClose));
  }
  if (generatedSmokePage && existsSync(generatedSmokePage)) {
    unlinkSync(generatedSmokePage);
  }
  rmSync(chromeUserDir, { recursive: true, force: true });
}

async function main() {
  if (browserMode === "server") {
    await startStaticServer();
  } else {
    createFileSmokePage();
  }
  const browserWebSocketUrl = await startChrome();
  const client = await connectPage(browserWebSocketUrl);
  await waitForPageLoad(client);
  await injectHelper(client);
  await act(client, "localStorage.clear();");
  await waitForPageLoad(client);
  await injectHelper(client);
  await runClickFlow(client);
  console.log("浏览器点击冒烟检查通过：导航、GEO、创作、审核、排期、发布、回执、授权、审计导出和角色切换均有真实点击反馈。");
}

main()
  .catch((error) => {
    console.error(`浏览器点击冒烟检查失败：${error.message}`);
    process.exitCode = 1;
  })
  .finally(cleanup);
