"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { workflowSteps, getWorkflowStepRoute } from "../../config/workflowSteps";
import { useProjectState } from "../../hooks/workflow/useProjectState";
import { useHydrated } from "../../hooks/useHydrated";
import ThemedIcon from "../ThemedIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WorkflowProgressProps = {
  currentStep: number;
  nameQuery?: string;
  projectName?: string;
  title?: string;
};

export default function WorkflowProgress({
  currentStep,
  nameQuery = "",
  projectName,
  title,
}: WorkflowProgressProps) {
  const steps = useMemo(
    () => workflowSteps.filter((step) => step.enabled !== false),
    [],
  );
  const hydrated = useHydrated();
  const { project, projectKey, setStepStatus } = useProjectState(projectName);
  const statusMap = useMemo(
    () => (hydrated ? project.progress : {}),
    [hydrated, project.progress],
  );
  const displayTitle = title || projectName?.trim() || "未命名";
  const [editableTitle, setEditableTitle] = useState(displayTitle);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(displayTitle);
  const [previousTitle, setPreviousTitle] = useState(displayTitle);

  // Reset the local edit when its source changes, before children render.
  if (previousTitle !== displayTitle) {
    setPreviousTitle(displayTitle);
    setEditableTitle(displayTitle);
    setTitleDraft(displayTitle);
  }

  const openTitleDialog = () => {
    setTitleDraft(editableTitle);
    setTitleDialogOpen(true);
  };

  const cancelTitleEdit = () => {
    setTitleDialogOpen(false);
    setTitleDraft(editableTitle);
  };

  const confirmTitleEdit = () => {
    setEditableTitle(titleDraft.trim() || "未命名");
    setTitleDialogOpen(false);
  };

  useEffect(() => {
    steps.forEach((step) => {
      if (step.id < currentStep && !statusMap[step.id]) {
        setStepStatus(projectKey, step.id, "skipped");
      }
    });
  }, [currentStep, projectKey, setStepStatus, statusMap, steps]);

  return (
    <div className="workflow-progress sticky top-20 w-full max-w-[180px] pb-12 pr-0">
      <div className="space-y-1 pt-4">
        <button
          type="button"
          onClick={openTitleDialog}
          className="mb-2 max-w-[170px] bg-transparent text-left text-xl font-semibold text-[var(--text-primary)] outline-none transition hover:text-[var(--text-primary)]"
          aria-label="编辑项目名"
        >
          {editableTitle}
        </button>
      </div>

      <div className="relative mt-4">
        <ul className="space-y-4">
          {steps.map((step) => {
            const status = statusMap[step.id];
            const isDone = status === "done";
            const isSkipped = status === "skipped";
            const isCurrent = step.id === currentStep;
            const href = getWorkflowStepRoute(step.id, nameQuery);
            return (
              <li key={step.id}>
                <Link
                  href={href}
                  className={`group flex items-center gap-3 text-sm transition ${
                    isCurrent
                      ? "font-semibold brand-text"
                      : isDone
                        ? "text-[var(--text-primary)] hover:text-white"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center transition ${isCurrent ? "scale-110" : ""}`}>
                    <ThemedIcon
                      name={step.icon}
                      className={`h-5 w-5 ${isCurrent ? "opacity-100" : isDone ? "opacity-80" : "opacity-60 group-hover:opacity-80"}`}
                    />
                  </span>
                  <span className="flex-1">{step.label}</span>
                  {isDone ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(var(--brand-rgb),0.9)] text-[10px] text-white">
                      ✓
                    </span>
                  ) : isSkipped ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--surface-border-strong)] text-[10px] text-[var(--text-tertiary)]">
                      -
                    </span>
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full brand-dot" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <Dialog open={titleDialogOpen} onOpenChange={setTitleDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl border-[var(--surface-border-strong)] bg-zinc-100 dark:bg-zinc-900 p-8 text-[var(--text-primary)] ring-white/10"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
              项目名
            </DialogTitle>
          </DialogHeader>
          <input
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none"
            aria-label="项目名输入"
            autoFocus
          />
          <DialogFooter className="mt-4 -mx-0 -mb-0 border-0 bg-transparent p-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelTitleEdit}
              className="rounded-full border-[var(--surface-border-strong)] bg-[var(--surface-bg)] text-[var(--text-tertiary)] hover:bg-[var(--surface-bg-hover)] hover:text-[var(--text-primary)]"
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmTitleEdit}
              className="rounded-full border-transparent bg-[rgb(var(--brand-rgb))] text-white hover:opacity-90"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
