interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8088/api";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
const ENABLE_MOCK_FALLBACK = import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== "false";
const OPERATOR_ACCOUNT = import.meta.env.VITE_OPERATOR_ACCOUNT ?? "13677889001";
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 120000);

export function apiRuntimeMode() {
  return {
    apiBaseUrl: API_BASE_URL,
    mockFallbackEnabled: ENABLE_MOCK_FALLBACK,
    operatorAccount: OPERATOR_ACCOUNT,
  };
}

export async function mockRequest<T>(data: T): Promise<T> {
  return Promise.resolve(data);
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export async function withMockFallback<T>(requester: () => Promise<T>, fallback: T): Promise<T> {
  if (!ENABLE_MOCK_FALLBACK) {
    return requester();
  }
  try {
    return await requester();
  } catch (error) {
    console.warn("后端接口不可用，已使用本地模拟数据。", error);
    return mockRequest(fallback);
  }
}

export async function withMockFallbackFactory<T>(requester: () => Promise<T>, fallbackFactory: () => T): Promise<T> {
  if (!ENABLE_MOCK_FALLBACK) {
    return requester();
  }
  try {
    return await requester();
  } catch (error) {
    console.warn("后端接口不可用，已使用本地模拟数据。", error);
    return mockRequest(fallbackFactory());
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "X-Bee-Account": OPERATOR_ACCOUNT,
        ...init.headers,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`接口请求失败：${response.status}`);
    }
    const payload = (await response.json()) as ApiResponse<T>;
    if (!payload.success) {
      throw new Error(`${payload.code}：${payload.message}`);
    }
    return payload.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`接口请求超时：${Math.round(REQUEST_TIMEOUT_MS / 1000)} 秒内未返回，请稍后在任务列表查看结果`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("接口请求失败：未知错误");
  } finally {
    window.clearTimeout(timer);
  }
}
