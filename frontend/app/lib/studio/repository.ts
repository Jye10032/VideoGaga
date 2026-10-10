import { apiRequest } from "../api/client";
import {
  newData,
  StudioProject,
  ProjectSummary,
  Run,
  Provider,
  Modality,
} from "./types";

import { localGet, localList, localPut, localRemove } from "./localDatabase";

const PREFIX = "gaga-demo:v1:";
export function isDemo(id: string) {
  return id.startsWith("demo-");
}
export async function demoProjects(): Promise<ProjectSummary[]> {
  // One-time migration from the first localStorage draft format.
  for (const key of Object.keys(localStorage).filter((k) =>
    k.startsWith(PREFIX),
  )) {
    let project: StudioProject;
    try {
      project = JSON.parse(localStorage.getItem(key)!);
    } catch {
      continue;
    }
    if (!(await localGet(project.id))) await localPut(project);
    localStorage.removeItem(key);
  }
  return (await localList()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
export async function listProjects() {
  return apiRequest<ProjectSummary[]>("/api/v1/studio/projects");
}
export async function createProject(name: string, demo: boolean) {
  if (!demo)
    return apiRequest<StudioProject>("/api/v1/studio/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  const p: StudioProject = {
    id: "demo-" + crypto.randomUUID(),
    name,
    mode: "demo",
    updatedAt: new Date().toISOString(),
    revision: 0,
    data: newData(),
  };
  await localPut(p);
  return p;
}
export async function createAcceptanceProject(
  onProgress: (message: string) => void,
) {
  const { acceptanceSampleData, ACCEPTANCE_SAMPLE_NAME } =
    await import("./examples/extreme-night");
  // Finish preparation before writing, so failed downloads leave no partial project.
  const data = await acceptanceSampleData(onProgress);
  const project: StudioProject = {
    id: "demo-" + crypto.randomUUID(),
    name: ACCEPTANCE_SAMPLE_NAME,
    mode: "demo",
    updatedAt: new Date().toISOString(),
    revision: 0,
    data,
  };
  await localPut(project);
  return project;
}
export async function loadProject(id: string): Promise<StudioProject> {
  if (!isDemo(id))
    return apiRequest<StudioProject>(
      `/api/v1/studio/projects/${encodeURIComponent(id)}`,
    );
  let project = await localGet(id);
  if (!project) {
    const raw = localStorage.getItem(PREFIX + id);
    if (raw) {
      project = JSON.parse(raw);
      await localPut(project!);
      localStorage.removeItem(PREFIX + id);
    }
  }
  if (!project) throw new Error("演示项目不存在，或已被浏览器清理");
  return project;
}
export async function saveProject(project: StudioProject) {
  if (!isDemo(project.id))
    return apiRequest<{ revision: number; updatedAt: string }>(
      `/api/v1/studio/projects/${project.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: project.name,
          revision: project.revision,
          data: project.data,
        }),
      },
    );
  await loadProject(project.id);
  const meta = {
    revision: project.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  await localPut({ ...project, ...meta }, project.revision);
  return meta;
}
export async function deleteProject(id: string) {
  if (isDemo(id)) {
    await localRemove(id);
    localStorage.removeItem(PREFIX + id);
    return;
  }
  await apiRequest(`/api/v1/studio/projects/${id}`, { method: "DELETE" });
}
export const listRuns = (id: string) =>
  isDemo(id)
    ? Promise.resolve([] as Run[])
    : apiRequest<Run[]>(`/api/v1/studio/projects/${id}/runs`);
export function generate(
  id: string,
  payload: {
    requestId: string;
    kind: Modality;
    targetId: string;
    sourceHash: string;
    prompt: string;
    provider: Provider;
    duration?: number;
    ratio?: string;
    voice?: string;
    acknowledgeDuplicate?: boolean;
  },
) {
  return apiRequest<Run>(`/api/v1/studio/projects/${id}/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export const pollRun = (id: string, run: Run, provider: Provider) =>
  apiRequest<Run>(`/api/v1/studio/projects/${id}/runs/${run.id}/poll`, {
    method: "POST",
    body: JSON.stringify(provider),
  });
export const getRun = (id: string, runId: string) =>
  apiRequest<Run>(`/api/v1/studio/projects/${id}/runs/${runId}`);
