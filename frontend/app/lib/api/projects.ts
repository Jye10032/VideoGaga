import { apiRequest } from "./client";

export type Project = {
  id: string;
  name: string;
  description?: string;
  current_step?: number;
};

export const projectsApi = {
  list: () => apiRequest<Project[]>("/api/v1/projects"),
  create: (payload: { name: string; description?: string }) =>
    apiRequest<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  get: (projectId: string) => apiRequest<Project>(`/api/v1/projects/${projectId}`),
  update: (projectId: string, payload: Partial<Project>) =>
    apiRequest<Project>(`/api/v1/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
