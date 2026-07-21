"use client";

import { useState } from "react";
import StorySettingClient from "./StorySettingClient";
import WorkflowStepNav from "./WorkflowStepNav";
import { useStorySetting } from "../../hooks/workflow/useStorySetting";
import { useWorkflowParams } from "../../hooks/workflow/useWorkflowParams";
import { generateComicScript, saveComicProjectConfig } from "../../lib/api/comic";

type WorkflowStep2ClientProps = {
  projectName?: string;
  projectId?: string;
  nextHref: string;
  backHref: string;
  stepId?: number;
};

export default function WorkflowStep2Client({
  projectName,
  projectId,
  nextHref,
  backHref,
  stepId = 2,
}: WorkflowStep2ClientProps) {
  const { storySetting, setDraft, resetFinalized } = useStorySetting(projectName, stepId);
  const { params } = useWorkflowParams(projectName);
  const { finalized, finalStory } = storySetting;
  const [saveError, setSaveError] = useState("");

  const handleEdit = () => {
    resetFinalized();
    if (finalStory) {
      setDraft(finalStory);
    }
  };

  const handleNext = async () => {
    if (!projectId) {
      setSaveError("缺少 project_id，无法保存项目配置。");
      return false;
    }
    if (!finalStory.trim()) {
      setSaveError("请先完成故事设定后再进入下一步。");
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
        original_content: finalStory,
      });
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存项目配置失败");
      return false;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <StorySettingClient
          projectName={projectName}
          projectId={projectId}
          backHref={backHref}
          nextHref={nextHref}
          stepId={stepId}
          shouldGenerateScript={false}
          hideFinalizedNav
        />
      </div>

      {saveError ? (
        <div className="px-6 py-2 text-sm text-red-500 dark:text-red-300/90">
          {saveError}
        </div>
      ) : null}

      {finalized ? (
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
          onNext={handleNext}
          stepId={stepId}
          projectName={projectName}
        />
      ) : null}
    </div>
  );
}
