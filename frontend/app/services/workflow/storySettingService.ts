import { workflowsApi } from "../../lib/api/workflows";

export const storySettingService = {
  get: (projectId: string) => workflowsApi.getStorySetting(projectId),
  update: (projectId: string, content: string) =>
    workflowsApi.updateStorySetting(projectId, { content }),
};
