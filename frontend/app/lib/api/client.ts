const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.videogaga.cc"
    : "http://localhost:8000");

const AUTH_UPDATED_EVENT = "gaga-auth-updated";
const AUTH_EXPIRED_EVENT = "gaga-auth-expired";

function shouldLogApiDebug(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NODE_ENV !== "production";
}

function maskToken(token: string | null): string {
  if (!token) return "none";
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}...${token.slice(-8)}`;
}

function notifyAuthUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

function notifyAuthExpired(reason?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT, {
      detail: reason,
    })
  );
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const decoded = window.atob(padded);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  if (typeof window === "undefined") return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export function clearAuthSession(options?: {
  notifyExpired?: boolean;
  reason?: string;
}): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("gaga_user");
  notifyAuthUpdated();
  if (options?.notifyExpired) {
    notifyAuthExpired(options.reason);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  if (isTokenExpired(token)) {
    clearAuthSession({
      notifyExpired: true,
      reason: "token_expired",
    });
    return null;
  }
  return token;
}

export function hasValidToken(): boolean {
  return Boolean(getToken());
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
  notifyAuthUpdated();
}

export function removeToken(): void {
  clearAuthSession();
}

function isUnauthorizedResponse(status: number, detail?: string): boolean {
  if (status === 401 || status === 403) {
    return true;
  }
  const normalized = (detail || "").toLowerCase();
  return (
    normalized.includes("invalid token") ||
    normalized.includes("token expired") ||
    normalized.includes("signature has expired") ||
    normalized.includes("请先登录")
  );
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  const method = options.method || "GET";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  if (shouldLogApiDebug()) {
    console.log("[apiRequest:start]", {
      method,
      url,
      hasToken: Boolean(token),
      tokenPreview: maskToken(token),
    });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    if (shouldLogApiDebug()) {
      console.log("[apiRequest:network-error]", {
        method,
        url,
        hasToken: Boolean(token),
        tokenPreview: maskToken(token),
        error: error instanceof Error ? error.message : String(error),
      });
    }
    const isAuthEndpoint =
      endpoint.includes("/auth/register") || endpoint.includes("/auth/login");
    if (!token && !isAuthEndpoint) {
      throw new Error("请先登录");
    }
    throw new Error("网络连接失败，请稍后重试");
  }

  if (shouldLogApiDebug()) {
    console.log("[apiRequest:response]", {
      method,
      url,
      status: response.status,
      ok: response.ok,
      hasToken: Boolean(token),
      tokenPreview: maskToken(token),
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorDetail =
      typeof error.detail === "string"
        ? error.detail
        : typeof error.message === "string"
          ? error.message
          : "";

    if (shouldLogApiDebug()) {
      console.log("[apiRequest:error-body]", {
        method,
        url,
        status: response.status,
        error,
      });
    }

    if (token && isUnauthorizedResponse(response.status, errorDetail)) {
      clearAuthSession({
        notifyExpired: true,
        reason: errorDetail || `http_${response.status}`,
      });
    }

    throw new Error(errorDetail || `Request failed: ${response.status}`);
  }

  return response.json();
}
