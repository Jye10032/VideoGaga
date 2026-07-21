"use client";

import { useMemo } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import type { ProjectState } from "../../store/useProjectStore";

const fallbackProjectState: ProjectState = {
  projectId: undefined,
  storySetting: {
    mode: "ai",
    input: "",
    messages: [],
    draft: "",
    finalized: false,
    finalStory: "",
  },
  params: {
    ratio: "",
    creationMode: "",
    storyboardMode: "",
  },
  assets: {
    activeTab: "scene",
    scenes: [],
    characters: [],
    propsList: [],
    nextSceneId: 1,
    nextCharId: 1,
    nextPropId: 1,
    generatedMap: {},
    promptMap: {},
    customSceneIds: [],
    sceneUploads: {},
    characterUploads: {},
    propUploads: {},
    projectStatus: null,
  },
  storyboards: {
    items: [],
  },
  progress: {},
};

export function useProjectKey(projectName?: string | null) {
  return useMemo(() => projectName?.trim() || "default", [projectName]);
}

export function useProjectState(projectName?: string | null) {
  const projectKey = useProjectKey(projectName);
  const project = useProjectStore((state) => state.projects[projectKey]);
  const updateProject = useProjectStore((state) => state.updateProject);
  const setStorySetting = useProjectStore((state) => state.setStorySetting);
  const setWorkflowParams = useProjectStore((state) => state.setWorkflowParams);
  const setWorkflowAssets = useProjectStore((state) => state.setWorkflowAssets);
  const setWorkflowStoryboards = useProjectStore((state) => state.setWorkflowStoryboards);
  const setStepStatus = useProjectStore((state) => state.setStepStatus);
  const clearStepStatus = useProjectStore((state) => state.clearStepStatus);
  const currentProject = project ?? fallbackProjectState;

  return {
    projectKey,
    project: currentProject,
    updateProject,
    setStorySetting,
    setWorkflowParams,
    setWorkflowAssets,
    setWorkflowStoryboards,
    setStepStatus,
    clearStepStatus,
  };
}
