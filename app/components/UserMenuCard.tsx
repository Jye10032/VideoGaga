"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

type UserMenuCardProps = {
  user: string | null;
  onLogout: () => void;
  open: boolean;
};

export default function UserMenuCard({
  user,
  onLogout,
  open,
}: UserMenuCardProps) {
  const { theme, setTheme } = useTheme();
  const [showAppearance, setShowAppearance] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "system";

  return (
    <div
      className={`absolute right-0 top-full z-[9999] w-72 origin-top-right rounded-2xl border border-[var(--surface-border-strong)] bg-white dark:bg-[#1a1a1a] text-[var(--text-primary)] shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl transition duration-200 ${open
        ? "pointer-events-auto opacity-100 mt-2"
        : "pointer-events-none opacity-0"
        }`}
    // onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-3 border-b border-[var(--surface-border)] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-bg-active)] text-sm font-semibold text-[var(--text-primary)]">
          U
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            {user || "用户"}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">视频处理 Agent</div>
        </div>
      </div>
      <div className="py-1 text-sm text-[var(--text-primary)]">
        <button
          type="button"
          onClick={() => setShowAppearance((prev) => !prev)}
          className="menu-item"
        >
          <span>外观</span>
          <span className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            {currentTheme === "light"
              ? "浅色"
              : currentTheme === "dark"
                ? "深色"
                : "跟随系统"}
            <span
              className={`text-base leading-none transition ${showAppearance ? "rotate-90" : ""
                }`}
            >
              ›
            </span>
          </span>
        </button>
        {showAppearance ? (
          <div className="px-2 pb-2">
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] text-xs text-[var(--text-primary)]">
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex w-full items-center justify-between rounded-t-xl px-3 py-2 transition hover:bg-[var(--surface-bg-hover)] ${currentTheme === "system" ? "bg-[var(--surface-bg-hover)] text-[var(--text-primary)]" : ""
                  }`}
              >
                跟随系统
                {currentTheme === "system" ? (
                  <span className="text-[10px] text-[var(--text-tertiary)]">当前</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex w-full items-center justify-between px-3 py-2 transition hover:bg-[var(--surface-bg-hover)] ${currentTheme === "light" ? "bg-[var(--surface-bg-hover)] text-[var(--text-primary)]" : ""
                  }`}
              >
                浅色
                {currentTheme === "light" ? (
                  <span className="text-[10px] text-[var(--text-tertiary)]">当前</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex w-full items-center justify-between rounded-b-xl px-3 py-2 transition hover:bg-[var(--surface-bg-hover)] ${currentTheme === "dark" ? "bg-[var(--surface-bg-hover)] text-[var(--text-primary)]" : ""
                  }`}
              >
                深色
                {currentTheme === "dark" ? (
                  <span className="text-[10px] text-[var(--text-tertiary)]">当前</span>
                ) : null}
              </button>
            </div>
          </div>
        ) : null}
        <button className="menu-item">
          <span>语言</span>
          <span className="text-base leading-none text-[var(--text-tertiary)]">›</span>
        </button>
        <button className="menu-item">
          <span>切换账号</span>
          <span className="text-base leading-none text-[var(--text-tertiary)]">›</span>
        </button>
        <div className="my-1 border-t border-[var(--surface-border)]" />
        <button className="menu-item">
          <span>设置</span>
        </button>
        <button className="menu-item">
          <span>帮助中心</span>
        </button>
        <div className="my-1 border-t border-[var(--surface-border)]" />
        <button
          className="menu-item text-red-400"
          onClick={onLogout}
        >
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
