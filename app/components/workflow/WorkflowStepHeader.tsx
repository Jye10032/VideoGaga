"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workflowSteps, getWorkflowStepRoute } from "../../config/workflowSteps";
import { useHydrated } from "../../hooks/useHydrated";
import { useProjectState } from "../../hooks/workflow/useProjectState";
import { buildWorkflowQuery } from "../../lib/workflowQuery";

type WorkflowStepHeaderProps = {
  currentStep: number;
  rightContent?: ReactNode;
};

export default function WorkflowStepHeader({
  currentStep,
  rightContent,
}: WorkflowStepHeaderProps) {
  const searchParams = useSearchParams();
  const projectName = searchParams.get("name")?.trim() || "";
  const projectId = searchParams.get("pid")?.trim() || "";
  const nameQuery = buildWorkflowQuery({ name: projectName, pid: projectId });
  const hydrated = useHydrated();
  const steps = useMemo(
    () => workflowSteps.filter((step) => step.enabled !== false),
    [],
  );
  const { project, projectKey, setStepStatus } = useProjectState(projectName);
  const statusMap = useMemo(
    () => (hydrated ? project.progress : {}),
    [hydrated, project.progress],
  );
  const displayTitle = projectName || "未命名";
  const [editableTitle, setEditableTitle] = useState(displayTitle);
  const [titleDraft, setTitleDraft] = useState(displayTitle);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);

  useEffect(() => {
    setEditableTitle(displayTitle);
    setTitleDraft(displayTitle);
  }, [displayTitle]);

  useEffect(() => {
    steps.forEach((step) => {
      if (step.id < currentStep && !statusMap[step.id]) {
        setStepStatus(projectKey, step.id, "skipped");
      }
    });
  }, [currentStep, projectKey, setStepStatus, statusMap, steps]);

  const backHref = "/projects";

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

  return (
    <>
      <div className="workflow-step-header">
        <div className="workflow-step-header-side workflow-step-header-side-left">
          <Link
            href={backHref}
            className="workflow-step-back topbar-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--surface-border)] text-[var(--text-primary)] transition hover:border-[var(--surface-border-strong)]"
            aria-label="返回"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.1} />
          </Link>

          <button
            type="button"
            onClick={openTitleDialog}
            className="workflow-project-title shrink-0 bg-transparent text-left outline-none"
            aria-label="编辑项目名"
          >
            <span className="block max-w-[24ch] truncate text-base font-semibold text-[var(--text-primary)] md:text-lg">
              {editableTitle}
            </span>
          </button>
        </div>

        <div className="workflow-step-header-center">
          <nav
            className="workflow-step-strip overflow-x-auto no-scrollbar"
            aria-label="工作流步骤"
          >
            <ol className="flex min-w-max items-center justify-center gap-2 md:gap-3">
              {steps.map((step, index) => {
                const status = statusMap[step.id];
                const isDone = status === "done";
                const isSkipped = status === "skipped";
                const isCurrent = step.id === currentStep;
                const href = getWorkflowStepRoute(step.id, nameQuery);
                const indicatorLabel = isDone ? "✓" : String(index + 1);

                return (
                  <li key={step.id} className="workflow-step-item flex items-center gap-3">
                    <Link
                      href={href}
                      className={`workflow-step-chip group ${isCurrent ? "workflow-step-chip-current" : ""} ${isDone ? "workflow-step-chip-done" : ""} ${isSkipped ? "workflow-step-chip-skipped" : ""}`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span className="workflow-step-indicator">
                        {indicatorLabel}
                      </span>
                      <span className="workflow-step-label">{step.label}</span>
                    </Link>
                    {step.id !== steps[steps.length - 1]?.id ? (
                      <span
                        className={`workflow-step-connector ${isDone ? "workflow-step-connector-done" : ""}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {rightContent ? (
          <div className="workflow-step-header-side workflow-step-header-side-right">
            <div className="workflow-step-actions flex shrink-0 items-center gap-3">
              {rightContent}
            </div>
          </div>
        ) : (
          <div className="workflow-step-header-side workflow-step-header-side-right" />
        )}
      </div>

      <Dialog open={titleDialogOpen} onOpenChange={setTitleDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl border-[var(--surface-border-strong)] bg-zinc-100 p-8 text-[var(--text-primary)] ring-white/10 dark:bg-zinc-900"
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
    </>
  );
}
