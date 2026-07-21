"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useProjectState } from "../../hooks/workflow/useProjectState";

type WorkflowStepNavProps = {
  prevHref?: string;
  prevLabel?: string;
  leftContent?: ReactNode;
  nextHref?: string;
  nextLabel?: string;
  nextLoadingLabel?: string;
  nextDisabled?: boolean;
  onNext?: () => boolean | void | Promise<boolean | void>;
  stepId?: number;
  projectName?: string;
};

export default function WorkflowStepNav({
  prevHref,
  prevLabel = "上一步",
  leftContent,
  nextHref,
  nextLabel = "下一步",
  nextLoadingLabel = "保存中...",
  nextDisabled = false,
  onNext,
  stepId,
  projectName,
}: WorkflowStepNavProps) {
  const router = useRouter();
  const { projectKey, setStepStatus } = useProjectState(projectName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!prevHref && !nextHref && !leftContent) {
    return null;
  }

  const markDone = () => {
    if (!stepId) {
      return;
    }
    setStepStatus(projectKey, stepId, "done");
  };

  return (
    <div className="workflow-step-nav sticky bottom-0 z-20 flex-shrink-0 border-t border-[var(--surface-border)] px-6 py-4">
      <div className="flex items-center justify-between">
        {leftContent ? (
          leftContent
        ) : prevHref ? (
          <Link
            className="btn-pill btn-pill-secondary"
            href={prevHref}
          >
            ← {prevLabel}
          </Link>
        ) : (
          <span />
        )}
        {nextHref ? (
          nextDisabled ? (
            <button
              type="button"
              disabled
              className="btn-pill btn-pill-muted"
            >
              {nextLabel} →
            </button>
          ) : isSubmitting ? (
            <button
              type="button"
              disabled
              className="btn-pill btn-pill-primary"
            >
              {nextLoadingLabel}
            </button>
          ) : (
            onNext ? (
              <button
                type="button"
                className="btn-pill btn-pill-primary"
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const result = await onNext();
                    if (result === false) {
                      return;
                    }
                    markDone();
                    router.push(nextHref);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {nextLabel} →
              </button>
            ) : (
              <Link
                className="btn-pill btn-pill-primary"
                href={nextHref}
                onClick={markDone}
              >
                {nextLabel} →
              </Link>
            )
          )
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
