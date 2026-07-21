"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export type StoryMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
};

export type StorySettingState = {
  mode: "ai" | "self";
  input: string;
  messages: StoryMessage[];
  draft: string;
  finalized: boolean;
  finalStory: string;
};

export type WorkflowParamsState = {
  ratio: string;
  creationMode: string;
  storyboardMode: string;
};

export type WorkflowAssetCategory = "scene" | "character" | "prop";

export type WorkflowAssetCardState = {
  id: string;
  title: string;
  subtitle?: string;
};

export type WorkflowAssetsState = {
  activeTab: WorkflowAssetCategory;
  scenes: WorkflowAssetCardState[];
  characters: WorkflowAssetCardState[];
  propsList: WorkflowAssetCardState[];
  nextSceneId: number;
  nextCharId: number;
  nextPropId: number;
  generatedMap: Record<string, boolean>;
  promptMap: Record<string, string>;
  customSceneIds: string[];
  sceneUploads: Record<string, (string | null)[]>;
  characterUploads: Record<string, string | null>;
  propUploads: Record<string, string | null>;
  projectStatus: string | null;
};

export type WorkflowStoryboardItemState = {
  id: string;
  scene: string;
  characters: string[];
  props: string[];
  description: string;
  dialogue: string;
  speaker: string;
  voiceStyle: string;
  camera: string;
  duration: number;
  mode: string;
};

export type WorkflowStoryboardsState = {
  items: WorkflowStoryboardItemState[];
};

export type ProjectProgressStatus = "done" | "skipped";

export type ProjectState = {
  projectId?: string;
  storySetting: StorySettingState;
  params: WorkflowParamsState;
  assets: WorkflowAssetsState;
  storyboards: WorkflowStoryboardsState;
  progress: Record<number, ProjectProgressStatus>;
};

type ProjectStoreState = {
  projects: Record<string, ProjectState>;
  progressCollapsed: boolean;
  setProgressCollapsed: (collapsed: boolean) => void;
  ensureProject: (projectKey: string) => ProjectState;
  updateProject: (projectKey: string, patch: Partial<ProjectState>) => void;
  setStorySetting: (
    projectKey: string,
    patch: Partial<StorySettingState>
  ) => void;
  setWorkflowParams: (
    projectKey: string,
    patch: Partial<WorkflowParamsState>
  ) => void;
  setWorkflowAssets: (
    projectKey: string,
    patch: Partial<WorkflowAssetsState>
  ) => void;
  setWorkflowStoryboards: (
    projectKey: string,
    patch: Partial<WorkflowStoryboardsState>
  ) => void;
  setStepStatus: (
    projectKey: string,
    stepId: number,
    status: ProjectProgressStatus
  ) => void;
  clearStepStatus: (projectKey: string, stepId: number) => void;
};

const defaultStorySetting: StorySettingState = {
  mode: "ai",
  input: "",
  messages: [],
  draft: "",
  finalized: false,
  finalStory: "",
};

const defaultWorkflowParams: WorkflowParamsState = {
  ratio: "",
  creationMode: "",
  storyboardMode: "",
};

const defaultWorkflowAssets: WorkflowAssetsState = {
  activeTab: "scene",
  scenes: [],
  characters: [],
  propsList: [],
  nextSceneId: 1,
  nextCharId: 1,
  nextPropId: 1,
  generatedMap: {},
  promptMap: {},
  customSceneIds: [],
  sceneUploads: {},
  characterUploads: {},
  propUploads: {},
  projectStatus: null,
};

const defaultWorkflowStoryboards: WorkflowStoryboardsState = {
  items: [],
};

const createDefaultProjectState = (): ProjectState => ({
  storySetting: { ...defaultStorySetting },
  params: { ...defaultWorkflowParams },
  assets: { ...defaultWorkflowAssets },
  storyboards: { ...defaultWorkflowStoryboards },
  progress: {},
});

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore storage unavailability (e.g. private mode / blocked storage).
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(name);
    } catch {
      // Ignore storage unavailability.
    }
  },
};

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      projects: {},
      progressCollapsed: false,
      setProgressCollapsed: (collapsed) => set({ progressCollapsed: collapsed }),
      ensureProject: (projectKey) => {
        const current = get().projects[projectKey];
        if (current) {
          return current;
        }
        const next = createDefaultProjectState();
        set((state) => ({
          projects: {
            ...state.projects,
            [projectKey]: next,
          },
        }));
        return next;
      },
      updateProject: (projectKey, patch) => {
        set((state) => {
          const current = state.projects[projectKey] ?? createDefaultProjectState();
          return {
            projects: {
              ...state.projects,
              [projectKey]: {
                ...current,
                ...patch,
              },
            },
          };
        });
      },
      setStorySetting: (projectKey, patch) => {
        set((state) => {
          const current = state.projects[projectKey] ?? createDefaultProjectState();
          return {
            projects: {
              ...state.projects,
              [projectKey]: {
                ...current,
                storySetting: {
                  ...current.storySetting,
                  ...patch,
                },
              },
            },
          };
        });
      },
      setWorkflowParams: (projectKey, patch) => {
        set((state) => {
          const current = state.projects[projectKey] ?? createDefaultProjectState();
          return {
            projects: {
              ...state.projects,
              [projectKey]: {
                ...current,
                params: {
                  ...current.params,
                  ...patch,
                },
              },
            },
          };
        });
      },
      setWorkflowAssets: (projectKey, patch) => {
        set((state) => {
          const current = state.projects[projectKey] ?? createDefaultProjectState();
          return {
            projects: {
              ...state.projects,
              [projectKey]: {
                ...current,
                assets: {
                  ...current.assets,
                  ...patch,
                },
              },
            },
          };
        });
      },
      setWorkflowStoryboards: (projectKey, patch) => {
        set((state) => {
          const current = state.projects[projectKey] ?? createDefaultProjectState();
          return {
            projects: {
              ...state.projects,
              [projectKey]: {
                ...current,
                storyboards: {
                  ...current.storyboards,
                  ...patch,
                },
              },
            },
          };
        });
      },
      setStepStatus: (projectKey, stepId, status) => {
        set((state) => {
          const current = state.projects[projectKey] ?? createDefaultProjectState();
          return {
            projects: {
              ...state.projects,
              [projectKey]: {
                ...current,
                progress: {
                  ...current.progress,
                  [stepId]: status,
                },
              },
            },
          };
        });
      },
      clearStepStatus: (projectKey, stepId) => {
        set((state) => {
          const current = state.projects[projectKey] ?? createDefaultProjectState();
          if (!current.progress[stepId]) {
            return state;
          }
          const nextProgress = { ...current.progress };
          delete nextProgress[stepId];
          return {
            projects: {
              ...state.projects,
              [projectKey]: {
                ...current,
                progress: nextProgress,
              },
            },
          };
        });
      },
    }),
    {
      name: "gaga-project-store",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        projects: state.projects,
        progressCollapsed: state.progressCollapsed,
      }),
    }
  )
);
