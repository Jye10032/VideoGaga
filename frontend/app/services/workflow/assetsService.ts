import { assetsApi, type AssetType } from "../../lib/api/assets";

export const assetsService = {
  list: (projectId: string, type: AssetType) =>
    assetsApi.list(projectId, type),
  create: (projectId: string, type: AssetType, payload: Record<string, unknown>) =>
    assetsApi.create(projectId, type, payload),
  update: (
    projectId: string,
    type: AssetType,
    assetId: string,
    payload: Record<string, unknown>
  ) => assetsApi.update(projectId, type, assetId, payload),
  remove: (projectId: string, type: AssetType, assetId: string) =>
    assetsApi.remove(projectId, type, assetId),
  generate: (
    projectId: string,
    type: AssetType,
    assetId: string,
    payload: Record<string, unknown>
  ) => assetsApi.generate(projectId, type, assetId, payload),
};
