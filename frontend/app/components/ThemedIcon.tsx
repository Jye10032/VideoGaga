"use client";

import { useTheme } from "next-themes";
import { useHydrated } from "../hooks/useHydrated";

type ThemedIconProps = {
  name: string;
  alt?: string;
  className?: string;
  folder?: "icons" | "icon";
};

export default function ThemedIcon({
  name,
  alt = "",
  className,
  folder = "icons",
}: ThemedIconProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useHydrated();

  const theme = mounted ? resolvedTheme : "dark";
  const base = folder === "icon" ? "/icon" : "/icons";
  const mode = theme === "light" ? "light" : "dark";

  return (
    <img
      src={`${base}/${mode}/${name}.svg`}
      alt={alt}
      className={className}
    />
  );
}
