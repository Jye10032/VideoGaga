"use client";

import { useEffect, useRef, useState } from "react";
import UserMenuCard from "./UserMenuCard";
import { useHydrated } from "../hooks/useHydrated";

type UserMenuProps = {
  isLoggedIn: boolean;
  user: string | null;
  onLogin: () => void;
  onLogout: () => void;
  className?: string;
  inline?: boolean;
};

export default function UserMenu({
  isLoggedIn,
  user,
  onLogin,
  onLogout,
  className,
  inline = false,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const rootClassName = inline
    ? className
      ? `relative z-[80] ${className}`
      : "relative z-[80]"
    : className
      ? `absolute right-6 top-6 z-[80] ${className}`
      : "absolute right-6 top-6 z-[80]";
  const effectiveLoggedIn = hydrated ? isLoggedIn : false;
  const effectiveUser = hydrated ? user : null;

  useEffect(() => {
    //菜单关闭时清理计时器
    if (!open) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const startTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setOpen(false);
      }, 5000);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      //这次点击的元素 是不是 菜单容器里的 子元素
      if (menuRef.current && target && menuRef.current.contains(target)) {
        startTimer();
      } else {
        setOpen(false);
      }
    };

    //菜单打开时启动“5秒自动关闭”
    startTimer();
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open]);

  return (
    <div className={rootClassName}>
      {effectiveLoggedIn ? (
        <div className="relative" ref={menuRef}>
          <button
            className="topbar-icon flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-primary)]"
            aria-label="用户头像"
            title="用户"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
          >
            U
          </button>
          <UserMenuCard user={effectiveUser} onLogout={onLogout} open={open} />
        </div>
      ) : (
        <button
          className="login-text text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)]"
          onClick={onLogin}
        >
          登录
        </button>
      )}
    </div>
  );
}
