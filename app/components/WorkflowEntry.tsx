import Link from "next/link";

const steps = [
  "故事设定",
  "参数设定",
  "场景/角色/道具",
  "分镜脚本",
  "视频预览",
];

export default function WorkflowEntry() {
  return (
    <section className="mt-6 rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-tertiary)]">
            主工作流入口
          </span>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            从剧本开始，一站式生成视频
          </h2>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            覆盖故事设定、参数设置、场景/角色/道具、分镜与视频预览。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            className="btn-pill btn-pill-secondary"
          >
            创建新项目
          </Link>
          <Link
            href="/projects"
            className="btn-pill btn-pill-secondary"
          >
            我的项目
          </Link>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {steps.map((step) => (
          <span
            key={step}
            className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-[11px] text-[var(--text-primary)]"
          >
            {step}
          </span>
        ))}
      </div>
    </section>
  );
}
