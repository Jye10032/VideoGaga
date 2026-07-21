"use client";

import Link from "next/link";
import ThemedIcon from "./ThemedIcon";

type SidebarProps = {
  onFolderClick: () => void;
  active?: "home" | "inspiration" | "projects";
  collapsed?: boolean;
  onCollapse?: () => void;
};

export default function Sidebar({
  onFolderClick,
  active,
  collapsed = false,
  onCollapse,
}: SidebarProps) {
  const iconBase =
    "flex h-10 w-10 items-center justify-center rounded-full transition";
  const iconActive = "bg-white/20 text-[var(--text-primary)] ring-1 ring-white/30";
  const iconIdle = "text-[var(--text-primary)] hover:bg-[var(--surface-bg-active)]";
  const asideClass = collapsed
    ? "group fixed left-0 top-0 z-40 flex h-screen w-3 flex-col items-center justify-between overflow-hidden border-r border-[var(--surface-border)] bg-[var(--surface-bg)] py-8 transition-[width] duration-300 ease-out hover:w-20"
    : "fixed left-0 top-0 z-40 flex h-screen w-20 flex-col items-center justify-between py-8";
  const navClass = collapsed
    ? "flex w-12 translate-x-[-28px] flex-col items-center gap-2 rounded-full border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] py-3 opacity-0 shadow-[0_0_30px_rgba(255,255,255,0.08)] transition duration-300 ease-out pointer-events-none group-hover:translate-x-0 group-hover:opacity-100 group-hover:pointer-events-auto"
    : "flex w-12 flex-col items-center gap-2 rounded-full border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] py-3 shadow-[0_0_30px_rgba(255,255,255,0.08)]";

  return (
    <aside className={`sidebar-shell ${asideClass}`}>
      {onCollapse ? (
        <button
          type="button"
          onClick={onCollapse}
          className="absolute right-2 top-2 rounded-full bg-[var(--surface-bg-hover)] px-2 py-1 text-[10px] text-[var(--text-primary)] transition hover:bg-white/20"
          aria-label="收缩侧边栏"
        >
          收起
        </button>
      ) : null}
      {/* <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-white to-blue text-[10px] font-semibold text-[var(--text-primary)]">
        V
      </div> */}
      <nav className="flex flex-1 items-center justify-center">
        <div className={`sidebar-nav ${navClass}`}>
          <Link
            className={`${iconBase} ${active === "inspiration" ? iconActive : iconIdle}`}
            href="/inspiration"
            aria-label="灵感广场"
          >
            <ThemedIcon name="sparkle" className="h-3.5 w-3.5" />
          </Link>
          <Link
            className={`${iconBase} ${active === "home" ? iconActive : iconIdle}`}
            href="/"
            aria-label="首页"
          >
            <ThemedIcon name="home" className="h-3.5 w-3.5" />
          </Link>
          <button
            className={`${iconBase} ${active === "projects" ? iconActive : iconIdle} rounded-2xl`}
            aria-label="项目"
            onClick={onFolderClick}
          >
            <ThemedIcon name="folder" className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>
      <div className="h-12 w-12" />
    </aside>
  );
}
