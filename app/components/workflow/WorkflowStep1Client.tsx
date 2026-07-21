"use client";

import WorkflowStepNav from "./WorkflowStepNav";
import { useWorkflowParams } from "../../hooks/workflow/useWorkflowParams";

type WorkflowStep1ClientProps = {
  projectName?: string;
  nextHref: string;
  stepId?: number;
};

const ratios = ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"];
const creationModes = ["图生视频模式", "多参生视频模式"];
const storyboardModes = ["自动生成单张分镜图", "自动生成九宫格机位分镜图"];

function getOptionButtonClass(selected: boolean) {
  return selected
    ? "border-transparent bg-[rgba(var(--brand-rgb),0.12)] text-[rgb(var(--brand-rgb))] shadow-[0_10px_24px_rgba(88,58,184,0.14)] ring-1 ring-[rgba(var(--brand-rgb),0.12)]"
    : "border-[var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62))] dark:[background-image:none] dark:bg-[var(--surface-bg)] text-[var(--text-primary)] shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:shadow-none hover:border-[rgba(var(--brand-rgb),0.22)] hover:bg-[rgba(var(--brand-rgb),0.04)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:hover:shadow-none";
}

function getRatioMeta(ratio: string) {
  switch (ratio) {
    case "16:9": return "横屏";
    case "9:16": return "竖屏";
    case "4:3": return "横屏标准";
    case "3:4": return "竖屏标准";
    case "1:1": return "方形";
    case "21:9": return "宽银幕";
    default: return "标准";
  }
}

function getRatioVisual(ratio: string): { w: string; h: string } {
  switch (ratio) {
    case "16:9": return { w: "w-14", h: "h-8" };
    case "9:16": return { w: "w-8", h: "h-14" };
    case "4:3":  return { w: "w-12", h: "h-9" };
    case "3:4":  return { w: "w-9", h: "h-12" };
    case "1:1":  return { w: "w-10", h: "h-10" };
    case "21:9": return { w: "w-[62px]", h: "h-[26px]" };
    default:     return { w: "w-10", h: "h-8" };
  }
}

export default function WorkflowStep1Client(props: WorkflowStep1ClientProps) {
  const { projectName, nextHref, stepId = 1 } = props;
  const {
    params,
    setRatio,
    setCreationMode,
    setStoryboardMode,
    isComplete,
  } = useWorkflowParams(projectName);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mt-3 shrink-0">
        <p className="section-copy">先确定项目基础配置与风格基调。</p>
      </div>

      <div className="mt-7 max-h-[calc(100vh_-_240px)] flex-1 min-h-0 overflow-y-auto pr-2 clean-scrollbar">
        <div className="section-stack max-w-4xl">
          <section className="section-block">
            <div className="section-title flex items-center gap-2">
              选择画面比例
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {ratios.map((ratio) => {
                const selected = params.ratio === ratio;
                const { w, h } = getRatioVisual(ratio);
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setRatio(ratio)}
                    className={`flex flex-col items-center gap-2.5 rounded-[18px] border px-3 py-4 transition-all duration-150 ${
                      selected
                        ? "border-transparent bg-[rgba(var(--brand-rgb),0.12)] ring-1 ring-[rgba(var(--brand-rgb),0.22)] shadow-[0_8px_20px_rgba(88,58,184,0.14)]"
                        : "border-[var(--surface-border)] bg-[var(--surface-bg)] hover:border-[rgba(var(--brand-rgb),0.2)] hover:bg-[var(--surface-bg-hover)]"
                    }`}
                  >
                    <div className="flex h-14 items-center justify-center">
                      <div
                        className={`rounded-[4px] border-2 ${
                          selected
                            ? "border-[rgb(var(--brand-rgb))] bg-[rgba(var(--brand-rgb),0.15)]"
                            : "border-[var(--surface-border-strong)] bg-[var(--surface-bg-hover)]"
                        } ${w} ${h}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 leading-none">
                      <span className={`text-sm font-semibold ${
                        selected ? "text-[rgb(var(--brand-rgb))]" : "text-[var(--text-primary)]"
                      }`}>{ratio}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{getRatioMeta(ratio)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section-block">
            <div className="section-title flex items-center gap-2">
              选择创作模式
              <span className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--surface-border-strong)] text-[10px] text-[var(--text-tertiary)]">
                i
                <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 w-48 -translate-y-1/2 rounded-lg border border-black/10 bg-white/95 px-2 py-1 text-[10px] text-[var(--text-primary)] opacity-0 shadow-lg transition group-hover:opacity-100 dark:border-[var(--surface-border-strong)] dark:bg-zinc-900/80">
                  画面参考方式：使用单张参考图，或使用多张参考图综合生成。
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {creationModes.map((mode) => (
                <button
                  key={mode}
                  className={`btn-segment border px-4 ${getOptionButtonClass(params.creationMode === mode)}`}
                  type="button"
                  onClick={() => setCreationMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>

          <section className="section-block">
            <div className="section-title flex items-center gap-2">
              选择分镜图生成模式
              <span className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--surface-border-strong)] text-[10px] text-[var(--text-tertiary)]">
                i
                <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 w-56 -translate-y-1/2 rounded-lg border border-black/10 bg-white/95 px-2 py-1 text-[10px] text-[var(--text-primary)] opacity-0 shadow-lg transition group-hover:opacity-100 dark:border-[var(--surface-border-strong)] dark:bg-zinc-900/80">
                  你想一次看到几种镜头：一张，或九张一套。
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {storyboardModes.map((mode) => (
                <button
                  key={mode}
                  className={`btn-segment border px-4 ${getOptionButtonClass(params.storyboardMode === mode)}`}
                  type="button"
                  onClick={() => setStoryboardMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>

          <section className="section-block">
            <div className="section-title flex items-center gap-2">
              选择画面风格
            </div>
            <div className="section-note">当前仅支持 2D 动漫风格</div>
            <div className="flex flex-wrap gap-4">
              <div className="w-32 rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,242,255,0.96))] dark:[background-image:none] dark:bg-[var(--surface-bg-active)] p-2.5 text-center text-[var(--text-primary)] shadow-[0_14px_32px_rgba(88,58,184,0.10)] ring-1 ring-[rgba(var(--brand-rgb),0.14)]">
                <div className="flex h-22 items-center justify-center overflow-hidden rounded-[16px] bg-[var(--surface-bg-hover)] text-xs text-[var(--text-primary)]">
                  <img src="/placeholder-1.jpeg" alt="2D 动漫示例" className="h-full w-full object-cover" />
                </div>
                <div className="mt-2.5 text-[11px] font-medium text-[rgb(var(--brand-rgb))]">2D 动漫</div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <WorkflowStepNav
        nextHref={nextHref}
        nextLabel="下一步"
        nextLoadingLabel="保存中..."
        nextDisabled={!isComplete}
        stepId={stepId}
        projectName={projectName}
      />
    </div>
  );
}
