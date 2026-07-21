"use client";

import { Moon, SunDim } from "lucide-react";
import { flushSync } from "react-dom";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useHydrated } from "../hooks/useHydrated";

export default function ThemeToggleIcon({
  className,
}: {
  className?: string;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const current = resolvedTheme ?? theme ?? "dark";
  const isDarkMode = current === "dark";

  const handleToggle = async () => {
    if (!hydrated) return;
    const next = isDarkMode ? "light" : "dark";
    if (isHome) {
      setTheme(next);
      return;
    }
    const transition = (document as unknown as {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    }).startViewTransition;
    if (!transition || !buttonRef.current) {
      setTheme(next);
      return;
    }

    await transition.call(document, () => {
      flushSync(() => {
        setTheme(next);
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      } as KeyframeAnimationOptions
    );
  };

  return (
    <button
      type="button"
      aria-label="切换主题"
      onClick={handleToggle}
      ref={buttonRef}
      disabled={!hydrated}
      className={`topbar-icon flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-primary)] transition ${className ?? ""}`}
    >
      {!hydrated ? (
        <span className="h-6 w-6" />
      ) : isDarkMode ? (
        <SunDim className="h-6 w-6" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
