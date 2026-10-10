import { apiRequest } from "./client";

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export type GoogleLoginStartOptions = {
  redirect?: string;
  next?: string;
};

export type GoogleCallbackResult =
  | {
      ok: true;
      accessToken: string;
      account?: string;
      next?: string;
    }
  | {
      ok: false;
      error: string;
    };

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.videogaga.cc"
      : "http://localhost:8000")
  );
}

function getGoogleStartPath(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_PATH ||
    "/api/v1/auth/google/login"
  );
}

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

export const authApi = {
  register: (data: {
    username: string;
    password: string;
    invite_code: string;
    email?: string;
  }) =>
    apiRequest<User>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { account: string; password: string }) =>
    apiRequest<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  startGoogleLogin: (options: GoogleLoginStartOptions = {}) => {
    if (typeof window === "undefined") return;

    const redirect = options.redirect || "/auth/google/callback";
    const next = options.next || "/";

    const startPath = getGoogleStartPath();
    const base = getApiBase().replace(/\/+$/, "");
    const fullPath = startPath.startsWith("/") ? startPath : `/${startPath}`;
    const endpoint = `${base}${fullPath}`;

    const callbackUrl = `${window.location.origin}${redirect}`;

    const url = new URL(endpoint);
    url.searchParams.set("redirect_uri", callbackUrl);
    const nonce = crypto.randomUUID();
    sessionStorage.setItem("gaga-oauth-state", nonce);
    url.searchParams.set("client_state", nonce);

    if (isSafeInternalPath(next)) {
      url.searchParams.set("next", next);
    }

    window.location.href = url.toString();
  },

  parseGoogleCallback: (params: URLSearchParams): GoogleCallbackResult => {
    const tokenParam =
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_TOKEN_PARAM || "access_token";
    const userParam = process.env.NEXT_PUBLIC_GOOGLE_AUTH_USER_PARAM || "account";
    const errorParam = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ERROR_PARAM || "error";

    const error = params.get(errorParam);
    if (error) {
      return { ok: false, error };
    }

    const accessToken = params.get(tokenParam);
    if (!accessToken) {
      return { ok: false, error: "缺少 access_token，Google 登录失败" };
    }

    const account = params.get(userParam) || undefined;
    const nextRaw = params.get("next") || undefined;
    const next = nextRaw && isSafeInternalPath(nextRaw) ? nextRaw : "/";

    return {
      ok: true,
      accessToken,
      account,
      next,
    };
  },
};
