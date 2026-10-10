"use client";

import { useEffect, useState } from "react";
import { authApi } from "../lib/api/auth";
import { setToken } from "../lib/api/client";

type LoginOverlayProps = {
  open: boolean;
  onClose: () => void;
  onLogin: (account: string) => void;
};

export default function LoginOverlay(props: LoginOverlayProps) {
  return props.open ? <LoginForm {...props} /> : null;
}

function LoginForm({ open, onClose, onLogin }: LoginOverlayProps) {
  const googleAuthEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const [isRegister, setIsRegister] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [typedText, setTypedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    const target = "创造你的故事";
    let index = 0;
    let forward = true;
    let timeoutId: number;

    const step = () => {
      if (forward) {
        index = Math.min(index + 1, target.length);
        setTypedText(target.slice(0, index));
        if (index === target.length) {
          forward = false;
          timeoutId = window.setTimeout(step, 1200);
          return;
        }
        timeoutId = window.setTimeout(step, 120);
      } else {
        index = Math.max(index - 1, 0);
        setTypedText(target.slice(0, index));
        if (index === 0) {
          forward = true;
          timeoutId = window.setTimeout(step, 600);
          return;
        }
        timeoutId = window.setTimeout(step, 60);
      }
    };

    timeoutId = window.setTimeout(step, 120);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      isRegister &&
      (password.length < 10 || new TextEncoder().encode(password).length > 72)
    ) {
      setFeedback({ type: "error", message: "密码至少 10 位，最多 72 字节" });
      return;
    }
    if (!account || !password) {
      setFeedback({ type: "error", message: "请输入账号和密码" });
      return;
    }
    if (isRegister && !inviteCode) {
      setFeedback({ type: "error", message: "请输入邀请码" });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      if (isRegister) {
        await authApi.register({
          username: account,
          password,
          invite_code: inviteCode,
        });
        setIsRegister(false);
        setPassword("");
        setInviteCode("");
        setFeedback({ type: "success", message: "注册成功，请登录" });
        return;
      }
      const res = await authApi.login({ account, password });
      setToken(res.access_token);
      localStorage.setItem("gaga_user", account);
      onLogin(account);
      onClose();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "请求失败",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      authApi.startGoogleLogin({
        redirect: "/auth/google/callback",
        next: "/",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Google 登录启动失败",
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative flex h-screen w-screen overflow-hidden rounded-none border border-[var(--surface-border-strong)] bg-black/60 shadow-2xl backdrop-blur-xl">
        <button
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10"
          onClick={onClose}
          aria-label="关闭登录"
        >
          ×
        </button>
        <div className="relative hidden w-1/2 items-center justify-center bg-[var(--surface-bg-hover)] sm:flex">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="https://ehrtt5psqrsjiec7xeiv.exp.bcevod.com/mda-gbdwu6kj6we10vi9/_output/transgbdvch1pj69sr5k12wef/mda-gbdwu6kj6we10vi9.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
          <div className="absolute inset-0 flex items-center justify-start px-10">
            <div className="text-left">
              <div className="text-lg tracking-[0.3em] text-white/60">
                在这里，
              </div>
              <div className="mt-3 text-2xl font-medium tracking-wide text-white">
                {typedText}
                <span className="ml-1 inline-block h-5 w-[2px] animate-pulse bg-white align-middle" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col justify-center bg-black/30 px-8 py-12 sm:w-1/2">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-white/60">
                {isRegister ? "欢迎加入" : "欢迎回来"}
              </div>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="on">
            <div>
              <label className="text-xs text-white/60" htmlFor="login-username">
                账号
              </label>
              <input
                id="login-username"
                name={isRegister ? "register-username" : "username"}
                autoComplete={isRegister ? "username" : "username"}
                className="input-dark"
                placeholder="请输入账号"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-white/60" htmlFor="login-password">
                密码
              </label>
              <input
                id="login-password"
                type="password"
                name={isRegister ? "new-password" : "current-password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="input-dark"
                placeholder={
                  isRegister ? "至少 10 位，最多 72 字节" : "请输入密码"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {isRegister ? (
              <div>
                <label
                  className="text-xs text-white/60"
                  htmlFor="register-invite-code"
                >
                  邀请码
                </label>
                <input
                  id="register-invite-code"
                  name="invite-code"
                  autoComplete="off"
                  className="input-dark"
                  placeholder="请输入邀请码"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                />
              </div>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
            >
              {submitting ? "处理中..." : isRegister ? "注册" : "登录"}
            </button>

            {!isRegister && googleAuthEnabled ? (
              <>
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-white/20" />
                  <span className="text-xs text-white/60">or</span>
                  <div className="h-px flex-1 bg-white/20" />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/30 bg-black/40 py-3 text-sm font-medium text-white hover:bg-black/60"
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                >
                  使用 Google 登录
                </button>
              </>
            ) : null}
          </form>
          {feedback ? (
            <p
              className={`mt-3 text-xs ${
                feedback.type === "error" ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}
          <div className="mt-4 text-center text-xs text-white/60">
            {isRegister ? (
              <button
                className="text-white hover:text-white/80"
                type="button"
                onClick={() => setIsRegister(false)}
              >
                已有账号？去登录
              </button>
            ) : (
              <button
                className="text-white hover:text-white/80"
                type="button"
                onClick={() => setIsRegister(true)}
              >
                没有账号？去注册
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
