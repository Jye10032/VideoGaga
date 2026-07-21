import { apiRequest } from "./client";

export type AssetType = "scene" | "character" | "prop";

export const assetsApi = {
  list: (projectId: string, type: AssetType) =>
    apiRequest(`/api/v1/projects/${projectId}/${type}s`),
  create: (projectId: string, type: AssetType, payload: Record<string, unknown>) =>
    apiRequest(`/api/v1/projects/${projectId}/${type}s`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (
    projectId: string,
    type: AssetType,
    assetId: string,
    payload: Record<string, unknown>
  ) =>
    apiRequest(`/api/v1/projects/${projectId}/${type}s/${assetId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (projectId: string, type: AssetType, assetId: string) =>
    apiRequest(`/api/v1/projects/${projectId}/${type}s/${assetId}`, {
      method: "DELETE",
    }),
  generate: (
    projectId: string,
    type: AssetType,
    assetId: string,
    payload: Record<string, unknown>
  ) =>
    apiRequest(`/api/v1/projects/${projectId}/${type}s/${assetId}/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
