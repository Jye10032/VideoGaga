"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import ThemeToggleIcon from "./ThemeToggleIcon";
import TopNav from "./TopNav";
import { useAuthContext } from "../context/AuthContext";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";
  const { isLoggedIn, user, openLogin, handleLogout } = useAuthContext();

  const showTopbar = true;
  const isStartPage = pathname === "/";
  const contentClass = isStartPage ? "home-fixed-dark" : "app-surface";

  useEffect(() => {
    document.documentElement.classList.remove("workflow-scroll-lock");
    document.body.classList.remove("workflow-scroll-lock");
  }, [pathname]);

  return (
    <div className="relative min-h-screen">
      <div className={contentClass}>
        {showTopbar ? (
          <div className="app-topbar fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-6 py-4">
            <TopNav />
            <div className="top-right-controls flex items-center gap-3">
              <ThemeToggleIcon />
              <UserMenu
                inline
                isLoggedIn={isLoggedIn}
                user={user}
                onLogin={openLogin}
                onLogout={handleLogout}
              />
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
