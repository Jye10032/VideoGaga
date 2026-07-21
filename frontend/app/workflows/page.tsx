import Link from "next/link";
import WorkflowTopBar from "../components/workflow/WorkflowTopBar";
import { buildWorkflowQuery } from "../lib/workflowQuery";


export default async function WorkflowsPage({
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
          backHref="/projects"
          backLabel="← 返回我的项目"
          tag="主工作流"
        />

        <div className="mt-4">
          <h1 className="text-3xl font-semibold tracking-wide">主工作流</h1>
          <p className="mt-3 text-sm text-[var(--text-primary)]">
            从一个界面开始，按“文字 → 图片 → 视频”的顺序推进。
          </p>
          {projectName ? (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              项目名称：{projectName}
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Link
            href={`/workflows/beginner${nameQuery}`}
            className="group rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-6 shadow-[0_16px_24px_-16px_rgba(0,0,0,0.55)] backdrop-blur-sm transition hover:border-[var(--surface-border-strong)] hover:bg-[var(--surface-bg-hover)]"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
              Beginner
            </div>
            <h3 className="mt-3 text-2xl font-semibold">小白模式</h3>
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">
              输入你的想法，AI 帮你自动构思分镜和剧本。
            </p>
            <div className="badge-pill mt-5">
              一句话快速生成
            </div>
          </Link>

          <Link
            href={`/workflows/pro/step-1${nameQuery}`}
            className="group rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-6 shadow-[0_16px_24px_-16px_rgba(0,0,0,0.55)] backdrop-blur-sm transition hover:border-[var(--surface-border-strong)] hover:bg-[var(--surface-bg-hover)]"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
              Pro
            </div>
            <h3 className="mt-3 text-2xl font-semibold">专业模式</h3>
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">
              1. 故事设定
              <br />
              2. 参数设定
              <br />
              3. 场景 / 角色 / 道具
              <br />
              4. 分镜脚本
              <br />
              5. 视频预览
            </p>
            <div className="badge-pill mt-5">
              全流程可控
            </div>
          </Link>
        </div>
        </div>
      </div>
    </main>
  );
}
