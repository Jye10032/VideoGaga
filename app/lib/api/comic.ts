import { apiRequest } from "./client";

export type CreateComicProjectRequest = {
  title: string;
  description?: string;
};

export type CreateComicProjectResponse = {
  project_id: string;
  message: string;
};

export type ComicProjectListItem = {
  id: string;
  name: string;
  description?: string | null;
  current_step: number;
  status: "CREATED" | "CONFIGURED" | "GENERATING" | "COMPLETED" | "FAILED";
  created_at: string;
  updated_at: string;
};

export type ComicProjectListResponse = {
  total: number;
  items: ComicProjectListItem[];
};

export type SaveComicProjectConfigRequest = {
  config: {
    aspect_ratio: string;
    creation_mode: string;
    script_mode: string;
    style: string;
  };
};

export type SaveComicProjectConfigResponse = {
  project_id: string;
  message: string;
};

export type GenerateComicScriptRequest = {
  original_content?: string;
};

export type GenerateComicScriptResponse = {
  project_id: string;
  task_id: string;
  message: string;
};

export type ComicProjectScene = {
  id: string;
  name: string;
  description?: string | null;
  prompt: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ComicProjectScript = {
  id: string;
  original_content: string;
  processed_content?: string | null;
  dialogues?: unknown[] | null;
  extracted_characters?: Array<{ id?: string; name?: string; description?: string } | string> | null;
  extracted_props?: Array<{ id?: string; name?: string; description?: string } | string> | null;
  created_at: string;
  updated_at: string;
};

export type ComicProjectDetail = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  aspect_ratio: string;
  creation_mode: string;
  script_mode: string;
  style_id?: string | null;
  script?: ComicProjectScript | null;
  scenes: ComicProjectScene[];
  current_step: number;
  status: "CREATED" | "CONFIGURED" | "GENERATING" | "COMPLETED" | "FAILED";
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

export function createComicProject(payload: CreateComicProjectRequest) {
  return apiRequest<CreateComicProjectResponse>("/api/v1/comic/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listComicProjects(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (typeof params?.limit === "number") {
    query.set("limit", String(params.limit));
  }
  if (typeof params?.offset === "number") {
    query.set("offset", String(params.offset));
  }

  const serialized = query.toString();
  return apiRequest<ComicProjectListResponse>(
    `/api/v1/comic/projects${serialized ? `?${serialized}` : ""}`,
  );
}

export function saveComicProjectConfig(
  projectId: string,
  payload: SaveComicProjectConfigRequest,
) {
  return apiRequest<SaveComicProjectConfigResponse>(
    `/api/v1/comic/projects/${projectId}/config`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function generateComicScript(
  projectId: string,
  payload: GenerateComicScriptRequest,
) {
  return apiRequest<GenerateComicScriptResponse>(
    `/api/v1/comic/projects/${projectId}/generate`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getComicProject(projectId: string) {
  return apiRequest<ComicProjectDetail>(`/api/v1/comic/projects/${projectId}`);
}
