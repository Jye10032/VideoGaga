"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { id: "inspiration", label: "灵感广场", href: "/inspiration" },
  { id: "projects", label: "我的项目", href: "/projects" },
  { id: "settings", label: "API 设置", href: "/settings" },
];

export default function TopNav({ className }: { className?: string }) {
  const pathname = usePathname() || "/";
  const active = pathname.startsWith("/inspiration")
    ? "inspiration"
    : pathname.startsWith("/projects")
      ? "projects"
      : pathname.startsWith("/settings")
        ? "settings"
        : null;

  return (
    <nav
      className={`inline-flex items-center gap-6 text-base ${className ?? ""}`}
    >
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`topnav-link transition ${
            active === item.id
              ? "topnav-link-active"
              : ""
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
