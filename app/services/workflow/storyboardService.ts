import { storyboardsApi } from "../../lib/api/storyboards";

export const storyboardService = {
  list: (projectId: string) => storyboardsApi.list(projectId),
  generate: (projectId: string, regenerate = false) =>
    storyboardsApi.generate(projectId, { regenerate }),
  create: (projectId: string, payload: Record<string, unknown>) =>
    storyboardsApi.create(projectId, payload),
  update: (
    projectId: string,
    storyboardId: string,
    payload: Record<string, unknown>
  ) => storyboardsApi.update(projectId, storyboardId, payload),
  remove: (projectId: string, storyboardId: string) =>
    storyboardsApi.remove(projectId, storyboardId),
  reorder: (projectId: string, order: string[]) =>
    storyboardsApi.reorder(projectId, { order }),
};
