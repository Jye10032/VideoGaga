"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const pipeline = [
  { label: "剧本", desc: "文字脚本与分镜", status: "已生成" },
  { label: "图片", desc: "关键画面与风格", status: "进行中" },
  { label: "视频", desc: "视频合成与输出", status: "待开始" },
];

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <main className="page-slide-up relative h-screen overflow-hidden text-[var(--text-primary)] workflow-bg">
      <div className="workflow-frame">
        <div />
        <div className="workflow-content no-scrollbar box-border flex h-full flex-col overflow-y-auto pb-12 pt-16 px-2">
          <div className="flex items-center justify-between">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1.5 text-xs text-[var(--text-primary)] backdrop-blur transition hover:bg-[var(--surface-bg-hover)] hover:text-[var(--text-primary)]"
              href="/projects"
            >
              ← 返回我的项目
            </Link>
            <span className="text-xs text-[var(--text-tertiary)]">工作流详情</span>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-semibold tracking-wide">
              工作流详情
            </h1>
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">ID：{workflowId}</p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {pipeline.map((stage) => (
              <div
                key={stage.label}
                className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)]">{stage.label}</span>
                  <span className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg-hover)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                    {stage.status}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">
                  {stage.label}阶段
                </h3>
                <p className="mt-2 text-sm text-[var(--text-tertiary)]">{stage.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-6 text-sm text-[var(--text-primary)]">
            该页面后续将展示完整工作流详情，包括脚本内容、图片列表与视频预览。
          </div>
        </div>
      </div>
    </main>
  );
}
