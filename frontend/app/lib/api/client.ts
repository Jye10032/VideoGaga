const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.videogaga.cc"
    : "http://localhost:8000");

const AUTH_UPDATED_EVENT = "gaga-auth-updated";
const AUTH_EXPIRED_EVENT = "gaga-auth-expired";

function notifyAuthUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

function notifyAuthExpired(reason?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT, {
      detail: reason,
    }),
  );
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
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
  const payload = localStorage.getItem("token");
  if (payload) {
    try {
      const sub = JSON.parse(
        atob(payload.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).sub;
      localStorage.removeItem(`gaga-providers:v1:${sub}`);
    } catch {
      /* malformed tokens are removed below */
    }
  }
  localStorage.removeItem("gaga-project-store");
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("gaga-projects-cache:")) localStorage.removeItem(key);
  }
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

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function apiBase() {
  return API_BASE;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(200_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError("连接失败或请求超时，请检查服务后重试", 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : `请求失败 (${response.status})`;
    // Permission denied is not an expired login.
    if (
      token &&
      response.status === 401 &&
      localStorage.getItem("token") === token
    )
      clearAuthSession({ notifyExpired: true, reason: detail });
    throw new ApiError(detail, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
