import WorkflowStepNav from "../../../components/workflow/WorkflowStepNav";
import WorkflowStepLayout from "../../../components/workflow/WorkflowStepLayout";
import { buildWorkflowQuery } from "../../../lib/workflowQuery";

export default async function ProStep5Page({
  searchParams,
}: {
  searchParams?: Promise<{ name?: string; pid?: string }>;
}) {
  const resolvedParams = await (searchParams ?? Promise.resolve<{ name?: string; pid?: string }>({}));
  const projectName = resolvedParams?.name?.trim();
  const projectId = resolvedParams?.pid?.trim();
  const nameQuery = buildWorkflowQuery({ name: projectName, pid: projectId });

  return (
    <WorkflowStepLayout
      currentStep={5}
      projectName={projectName}
      projectId={projectId}
      nameQuery={nameQuery}
    >
      <div className="mt-6">
        <p className="text-sm text-[var(--text-primary)]">基于分镜批量输出视频片段。</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5 text-sm text-[var(--text-primary)]">
          <div className="text-xs text-[var(--text-tertiary)]">说明</div>
          <ul className="mt-3 space-y-2">
            <li>批量输出分镜视频</li>
            <li>统一样式与节奏</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5 text-sm text-[var(--text-primary)]">
          这里将承载批量生成与进度展示（后续补充）。
        </div>
      </div>

      <WorkflowStepNav
        nextHref={`/workflows/pro/step-6${nameQuery}`}
        stepId={5}
        projectName={projectName}
      />
    </WorkflowStepLayout>
  );
}
