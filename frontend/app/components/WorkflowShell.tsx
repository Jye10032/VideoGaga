"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import ThemeToggleIcon from "./ThemeToggleIcon";
import TopNav from "./TopNav";
import WorkflowStepHeader from "./workflow/WorkflowStepHeader";
import { useAuthContext } from "../context/AuthContext";
import { useProjectStore } from "../store/useProjectStore";
import { useHydrated } from "../hooks/useHydrated";

export default function WorkflowShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";
  const { isLoggedIn, user, openLogin, handleLogout } = useAuthContext();
  const hydrated = useHydrated();
  const progressCollapsed = useProjectStore(
    (state) => state.progressCollapsed,
  );

  const stepMatch = pathname.match(/\/workflows\/pro\/step-(\d+)/);
  const stepIndex = stepMatch ? Number(stepMatch[1]) : null;
  const isWorkflowStep = stepIndex !== null;
  const safeProgressCollapsed = hydrated ? progressCollapsed : false;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("workflow-progress-collapsed", safeProgressCollapsed);
    return () => {
      root.classList.remove("workflow-progress-collapsed");
    };
  }, [safeProgressCollapsed]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (!isWorkflowStep) {
      html.classList.remove("workflow-scroll-lock");
      body.classList.remove("workflow-scroll-lock");
      return;
    }
    html.classList.add("workflow-scroll-lock");
    body.classList.add("workflow-scroll-lock");
    return () => {
      html.classList.remove("workflow-scroll-lock");
      body.classList.remove("workflow-scroll-lock");
    };
  }, [isWorkflowStep]);

  const shellClass = isWorkflowStep
    ? "relative text-[var(--text-primary)] workflow-bg h-screen overflow-hidden"
    : "relative app-surface min-h-screen";

  return (
    <div className={shellClass}>
      {stepIndex ? (
        <div className="flex h-full flex-col">
          <div className="workflow-step-header-shell sticky top-0 z-[70]">
            <div className="app-topbar workflow-step-topbar flex items-center py-2">
              <WorkflowStepHeader
                currentStep={stepIndex}
                rightContent={(
                  <>
                    <ThemeToggleIcon />
                    <UserMenu
                      inline
                      isLoggedIn={isLoggedIn}
                      user={user}
                      onLogin={openLogin}
                      onLogout={handleLogout}
                    />
                  </>
                )}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
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
          {children}
        </div>
      )}
    </div>
  );
}
