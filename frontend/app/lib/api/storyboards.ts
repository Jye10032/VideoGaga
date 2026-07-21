import { apiRequest } from "./client";

export const storyboardsApi = {
  list: (projectId: string) =>
    apiRequest(`/api/v1/projects/${projectId}/storyboards`),
  generate: (projectId: string, payload: { regenerate?: boolean }) =>
    apiRequest(`/api/v1/projects/${projectId}/storyboards/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  create: (projectId: string, payload: Record<string, unknown>) =>
    apiRequest(`/api/v1/projects/${projectId}/storyboards`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (
    projectId: string,
    storyboardId: string,
    payload: Record<string, unknown>
  ) =>
    apiRequest(`/api/v1/projects/${projectId}/storyboards/${storyboardId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (projectId: string, storyboardId: string) =>
    apiRequest(`/api/v1/projects/${projectId}/storyboards/${storyboardId}`, {
      method: "DELETE",
    }),
  reorder: (projectId: string, payload: { order: string[] }) =>
    apiRequest(`/api/v1/projects/${projectId}/storyboards/reorder`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
