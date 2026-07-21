import WorkflowContent from "./WorkflowContent";
import WorkflowProjectIdSync from "./WorkflowProjectIdSync";
import type { ReactNode } from "react";

type WorkflowStepLayoutProps = {
  currentStep: number;
  projectName?: string;
  projectId?: string;
  nameQuery?: string;
  children: ReactNode;
  contentClassName?: string;
};

export default function WorkflowStepLayout({
  currentStep: _currentStep,
  projectName,
  projectId,
  nameQuery: _nameQuery = "",
  children,
  contentClassName,
}: WorkflowStepLayoutProps) {
  const contentClasses =
    "workflow-content box-border flex h-full min-h-0 flex-col px-0 pt-2 md:px-2";
  const innerClasses = `flex min-h-0 flex-1 flex-col rounded-[28px]${contentClassName ? ` ${contentClassName}` : ""
    }`;

  return (
    <main className="workflow-bg app-surface page-slide-up relative min-h-0 h-full text-[var(--text-primary)]">
      <div className="workflow-frame workflow-frame--single h-full">
        <WorkflowProjectIdSync
          projectName={projectName}
          projectId={projectId}
        />
        <WorkflowContent className={contentClasses}>
          <div className={innerClasses}>{children}</div>
        </WorkflowContent>
      </div>
    </main>
  );
}
