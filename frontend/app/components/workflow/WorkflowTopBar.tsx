import Link from "next/link";
import type { ReactNode } from "react";

type WorkflowTopBarProps = {
  backHref: string;
  backLabel: string;
  tag?: string;
  rightContent?: ReactNode;
  showBack?: boolean;
};

export default function WorkflowTopBar({
  backHref,
  backLabel,
  tag,
  rightContent,
  showBack = true,
}: WorkflowTopBarProps) {
  return (
    <div className="flex items-center justify-between">
      {showBack ? (
        <Link
          className="btn-pill btn-pill-secondary"
          href={backHref}
        >
          {backLabel}
        </Link>
      ) : (
        <span />
      )}
      {rightContent ?? (tag ? <span className="text-xs text-[var(--text-tertiary)]">{tag}</span> : null)}
    </div>
  );
}
