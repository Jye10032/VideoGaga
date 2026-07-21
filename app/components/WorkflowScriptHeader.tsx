"use client";

import { useMemo, useState, type ReactNode } from "react";

type WorkflowScriptHeaderProps = {
  initialName?: string;
  className?: string;
  children?: ReactNode;
};

export default function WorkflowScriptHeader({
  initialName,
  className,
  children,
}: WorkflowScriptHeaderProps) {
  const normalized = initialName?.trim() ?? "";
  const [name, setName] = useState(normalized || "未命名");
  const displayName =
    name === "未命名" && normalized ? normalized : name;

  const inputSize = useMemo(() => {
    const length = displayName.length || 4;
    return Math.min(24, Math.max(8, length));
  }, [displayName]);

  const handleBlur = () => {
    const trimmed = displayName.trim();
    setName(trimmed || "未命名");
  };

  return (
    <div className={className ?? "mt-4"}>
      <div className="flex items-center gap-2 justify-center">
        <input
          value={displayName}
          onChange={(event) => setName(event.target.value)}
          onBlur={handleBlur}
          size={inputSize}
          className="rounded-full  px-4 py-1 text-center text-xl font-semibold text-[var(--text-primary)] outline-none transition focus:border-white/40"
          aria-label="剧本名"
        />
      </div>
      {children}
    </div>
  );
}
