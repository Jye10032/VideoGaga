import { workflowsApi } from "../../lib/api/workflows";

export const paramsService = {
  get: (projectId: string) => workflowsApi.getParams(projectId),
  update: (
    projectId: string,
    payload: { ratio: string; creationMode: string; storyboardMode: string }
  ) => workflowsApi.updateParams(projectId, payload),
};
