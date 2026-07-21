"use client";

import { useProjectState } from "./useProjectState";

export function useWorkflowParams(projectName?: string | null) {
  const { project, projectKey, setWorkflowParams } =
    useProjectState(projectName);
  const params = project.params;

  const setRatio = (ratio: string) =>
    setWorkflowParams(projectKey, { ratio });
  const setCreationMode = (creationMode: string) =>
    setWorkflowParams(projectKey, { creationMode });
  const setStoryboardMode = (storyboardMode: string) =>
    setWorkflowParams(projectKey, { storyboardMode });

  const isComplete =
    Boolean(params.ratio) &&
    Boolean(params.creationMode) &&
    Boolean(params.storyboardMode);

  return {
    projectId: project.projectId,
    params,
    setRatio,
    setCreationMode,
    setStoryboardMode,
    isComplete,
  };
}
