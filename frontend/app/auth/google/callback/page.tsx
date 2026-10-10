"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authApi } from "../../../lib/api/auth";
import { setToken } from "../../../lib/api/client";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const consumed = useRef(false);
  const [result, setResult] = useState<ReturnType<
    typeof authApi.parseGoogleCallback
  > | null>(null);
  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const expected = sessionStorage.getItem("gaga-oauth-state");
    sessionStorage.removeItem("gaga-oauth-state");
    setResult(
      expected && params.get("client_state") === expected
        ? authApi.parseGoogleCallback(params)
        : { ok: false, error: "登录验证已失效，请从登录按钮重新开始" },
    );
    window.history.replaceState(null, "", window.location.pathname);
  }, [searchParams]);
  const error = result && !result.ok ? result.error : null;

  useEffect(() => {
    if (!result?.ok) {
      return;
    }

    setToken(result.accessToken);
    if (result.account) {
      localStorage.setItem("gaga_user", result.account);
    } else {
      localStorage.setItem("gaga_user", "Google 用户");
    }
    window.dispatchEvent(new Event("gaga-auth-updated"));

    router.replace(result.next || "/");
  }, [result, router]);

  return (
    <main className="app-surface flex min-h-screen items-center justify-center text-[var(--text-primary)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] p-6 text-center backdrop-blur">
        {error ? (
          <>
            <h1 className="text-lg font-semibold">Google 登录失败</h1>
            <p className="mt-3 text-sm text-[var(--text-primary)]">{error}</p>
            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black hover:bg-white/90"
              onClick={() => router.replace("/")}
            >
              返回首页
            </button>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">正在完成登录...</h1>
            <p className="mt-3 text-sm text-[var(--text-primary)]">
              请稍候，正在跳转
            </p>
          </>
        )}
      </div>
    </main>
  );
}
