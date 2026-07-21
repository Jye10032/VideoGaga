"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import StoryModeToggle from "./StoryModeToggle";
import WorkflowStepNav from "./WorkflowStepNav";
import { useStorySetting } from "../../hooks/workflow/useStorySetting";
import { useWorkflowParams } from "../../hooks/workflow/useWorkflowParams";
import { generateComicScript, saveComicProjectConfig } from "../../lib/api/comic";

type StorySettingClientProps = {
  projectName?: string;
  projectId?: string;
  backHref: string;
  nextHref: string;
  stepId?: number;
  shouldGenerateScript?: boolean;
  hideFinalizedNav?: boolean;
};

const promptSuggestions = [
  "赛博都市里的失忆侦探",
  "一场婚礼前夜的身份反转",
  "从一句台词延展三段冲突",
] as const;

export default function StorySettingClient(props: StorySettingClientProps) {
  const {
    projectName,
    projectId,
    nextHref,
    stepId = 1,
    shouldGenerateScript = false,
    hideFinalizedNav = false,
  } = props;
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const {
    storySetting,
    setMode,
    setInput,
    setDraft,
    finalize,
    resetFinalized,
  } = useStorySetting(projectName, stepId);
  const { params } = useWorkflowParams(projectName);
  const { mode, input, draft, finalized, finalStory } = storySetting;
  const [saveError, setSaveError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const persistProjectConfig = async (storyContent: string) => {
    if (!shouldGenerateScript) {
      return true;
    }
    if (!projectId) {
      setSaveError("缺少 project_id，无法保存项目配置。");
      return false;
    }

    setSaveError("");
    try {
      await saveComicProjectConfig(projectId, {
        config: {
          aspect_ratio: params.ratio,
          creation_mode: params.creationMode,
          script_mode: params.storyboardMode,
          style: "2D 动漫",
        },
      });
      await generateComicScript(projectId, {
        original_content: storyContent,
      });
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存项目配置失败");
      return false;
    }
  };

  const handleSubmitDraft = async () => {
    const content = draft.trim();
    if (!content) {
      return;
    }
    finalize(content);
    setIsSubmitting(true);
    const success = await persistProjectConfig(content);
    setIsSubmitting(false);
    if (!success) {
      return;
    }
    router.push(nextHref);
  };

  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerate = () => {
    const seed = input.trim();
    if (!seed) return;
    setAiGenerating(true);
    setTimeout(() => {
      const generated = `在${seed}的世界里，一个普通人被卷入了一场无法回避的漩涡。内心的挣扎与外部的压迫同时袭来，他必须在失去一切之前做出选择。整个故事笼罩在压抑却不失温度的氛围中，结局指向最初那个关于身份与归属的命题。`;
      setDraft(generated);
      setInput("");
      setAiGenerating(false);
    }, 1200);
  };

  const handleRefine = () => {
    if (!draft.trim()) return;
    setAiGenerating(true);
    setTimeout(() => {
      setDraft(draft + "\n\n在这之后，隐藏的真相逐渐浮出水面，冲突升级至无法调和的临界点。");
      setAiGenerating(false);
    }, 1000);
  };

  const handleEdit = () => {
    resetFinalized();
    if (finalStory) {
      setDraft(finalStory);
    }
  };

  const handleFinalizedNext = async () => {
    setIsSubmitting(true);
    const success = await persistProjectConfig(finalStory);
    setIsSubmitting(false);
    if (!success) {
      return;
    }
    router.push(nextHref);
  };

  if (!hydrated) {
    return <div className="flex h-full min-h-0 flex-col" />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {!finalized ? (
        <div className="shrink-0 flex items-center justify-between">
          <StoryModeToggle value={mode} onChange={setMode} />
          <button
            type="button"
            onClick={handleSubmitDraft}
            disabled={!draft.trim() || isSubmitting}
            className="btn-pill btn-pill-primary btn-pill-sm"
          >
            {isSubmitting ? "保存中…" : "保存并进入下一步"}
          </button>
        </div>
      ) : null}

      {finalized ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden gap-4">
          <div className="flex-1 min-h-0 overflow-y-auto clean-scrollbar pr-2">
            <div className="section-stack">
              <div className="rounded-[26px] border border-[var(--surface-border)] bg-[var(--workspace-panel-bg)] p-5 text-sm text-[var(--text-primary)] whitespace-pre-line shadow-[var(--workspace-shadow)]">
                {finalStory}
              </div>
            </div>
          </div>
        </div>
      ) : mode === "ai" ? (
        <div className="mt-6 flex flex-1 flex-col min-h-0 overflow-hidden gap-4">
          {/* 种子输入区 */}
          <div className="shrink-0 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              placeholder="一句话描述故事种子，例如：赛博都市里的失忆侦探…"
              className="flex-1 rounded-[22px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--surface-border-strong)] transition"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiGenerating || !input.trim()}
              className="btn-pill btn-pill-primary btn-pill-sm shrink-0"
            >
              {aiGenerating ? "生成中…" : "生成"}
            </button>
            <button
              type="button"
              onClick={handleRefine}
              disabled={aiGenerating || !draft.trim()}
              className="btn-pill btn-pill-secondary btn-pill-sm shrink-0"
            >
              继续完善
            </button>
          </div>

          {/* 提示词快捷选项 */}
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--surface-border-strong)] hover:bg-[var(--surface-bg-hover)] hover:text-[var(--text-primary)]"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* 主编辑区 */}
          <div className="workflow-workspace-grid flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[var(--surface-border)] bg-[var(--workspace-panel-bg)] p-5 shadow-[var(--workspace-shadow)]">
            {!draft.trim() ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-tertiary)]">
                输入故事种子，点击「生成故事设定」开始
              </div>
            ) : (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-0 h-full w-full flex-1 resize-none bg-transparent text-sm leading-7 text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none clean-scrollbar"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col min-h-0 overflow-hidden gap-4">
          <div className="workflow-workspace-grid flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[var(--surface-border)] bg-[var(--workspace-panel-bg)] p-5 shadow-[var(--workspace-shadow)]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="写下你的完整故事…背景、人物、冲突、基调都可以自由叙述，提交后会自动拆解为场景与角色。"
              className="min-h-0 h-full w-full flex-1 resize-none bg-transparent text-sm leading-7 text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none clean-scrollbar"
            />
          </div>
        </div>
      )}

      {saveError ? (
        <div className="mt-4 text-sm text-red-500 dark:text-red-300/90">
          {saveError}
        </div>
      ) : null}

      {finalized && !hideFinalizedNav ? (
        <WorkflowStepNav
          leftContent={(
            <button
              type="button"
              onClick={handleEdit}
              className="btn-pill btn-pill-secondary"
            >
              重新编辑
            </button>
          )}
          nextHref={nextHref}
          nextLabel="下一步"
          nextLoadingLabel="保存中…"
          onNext={handleFinalizedNext}
          stepId={stepId}
          projectName={projectName}
        />
      ) : null}
    </div>
  );
}
