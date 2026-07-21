import WorkflowTopBar from "../../components/workflow/WorkflowTopBar";
import { buildWorkflowQuery } from "../../lib/workflowQuery";

export default async function BeginnerWorkflowPage({
  searchParams,
}: {
  searchParams?: Promise<{ name?: string; pid?: string }>;
}) {
  const resolvedParams = await (searchParams ?? Promise.resolve<{ name?: string; pid?: string }>({}));
  const projectName = resolvedParams?.name?.trim();
  const projectId = resolvedParams?.pid?.trim();
  const nameQuery = buildWorkflowQuery({ name: projectName, pid: projectId });

  return (
    <main className="page-slide-up relative h-screen overflow-hidden text-[var(--text-primary)] workflow-bg">
      <div className="workflow-frame">
        <div />
        <div className="workflow-content no-scrollbar box-border flex h-full flex-col overflow-y-auto pb-12 pt-24 px-2">
        <WorkflowTopBar
          backHref={`/workflows${nameQuery}`}
          backLabel="← 返回模式选择"
          tag="小白模式"
        />

        <div className="mt-4">
          <h1 className="text-3xl font-semibold tracking-wide">小白模式</h1>
          <p className="mt-3 text-sm text-[var(--text-primary)]">
            输入你的想法，AI 帮你自动构思分镜和剧本。
          </p>
          {projectName ? (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">项目名称：{projectName}</p>
          ) : null}
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-6 text-sm text-[var(--text-primary)]">
          这里将承载小白模式的第一步输入界面（后续补充）。
        </div>
        </div>
      </div>
    </main>
  );
}
