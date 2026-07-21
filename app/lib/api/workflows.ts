import { apiRequest } from "./client";

export const workflowsApi = {
  getStorySetting: (projectId: string) =>
    apiRequest(`/api/v1/projects/${projectId}/story-setting`),
  updateStorySetting: (projectId: string, payload: { content: string }) =>
    apiRequest(`/api/v1/projects/${projectId}/story-setting`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getParams: (projectId: string) =>
    apiRequest(`/api/v1/projects/${projectId}/params`),
  updateParams: (
    projectId: string,
    payload: { ratio: string; creationMode: string; storyboardMode: string }
  ) =>
    apiRequest(`/api/v1/projects/${projectId}/params`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
