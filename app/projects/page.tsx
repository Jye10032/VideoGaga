"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, Clapperboard, FolderOpen, Sparkles } from "lucide-react";
import { workflowSteps } from "../config/workflowSteps";
import { useProjectStore } from "../store/useProjectStore";
import ThemedIcon from "../components/ThemedIcon";
import {
  createComicProject,
  listComicProjects,
  type ComicProjectListItem,
} from "../lib/api/comic";
import { buildWorkflowQuery } from "../lib/workflowQuery";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProjectItem = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  currentStep?: number;
  status?: string;
  updatedAt?: string;
};

type AssetItem = {
  id: string;
  title: string;
  imageUrl?: string;
};

type AssetFolder = {
  id: string;
  title: string;
  items: AssetItem[];
};

type ProjectsCacheSnapshot = {
  items: ProjectItem[];
  cachedAt: number;
};

const PROJECTS_CACHE_TTL = 5 * 60 * 1000;
const PROJECTS_CACHE_NAMESPACE = "gaga-projects-cache";

const mockProjects: ProjectItem[] = [
  { id: "p1", title: "鲸落之城", updatedAt: "2026-03-21T08:30:00.000Z" },
  { id: "p2", title: "星海回声", updatedAt: "2026-03-20T12:10:00.000Z" },
  { id: "p3", title: "极夜漫游", updatedAt: "2026-03-19T15:20:00.000Z" },
  { id: "p4", title: "微光旅人", updatedAt: "2026-03-18T09:00:00.000Z" },
  { id: "p5", title: "晨雾小镇", updatedAt: "2026-03-17T05:45:00.000Z" },
  { id: "p6", title: "孤岛信号", updatedAt: "2026-03-16T11:25:00.000Z" },
];

const mockAssetFolders: AssetFolder[] = [
  {
    id: "scenes",
    title: "场景",
    items: [
      { id: "scene-1", title: "鲸落星海" },
      { id: "scene-2", title: "月面沙丘" },
      { id: "scene-3", title: "夜色城市" },
    ],
  },
  {
    id: "characters",
    title: "角色",
    items: [
      { id: "char-1", title: "主角小狗" },
      { id: "char-2", title: "星旅者" },
    ],
  },
  {
    id: "props",
    title: "道具",
    items: [
      { id: "prop-1", title: "星光信标" },
      { id: "prop-2", title: "旧日相机" },
    ],
  },
];

function getProjectStatusMeta(status?: string) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "已完成",
        className:
          "bg-[rgba(var(--brand-rgb),0.12)] text-[rgba(var(--brand-rgb),0.92)]",
      };
    case "GENERATING":
      return {
        label: "生成中",
        className:
          "bg-[rgba(var(--brand-rgb),0.08)] text-[var(--text-secondary)]",
      };
    case "CONFIGURED":
      return {
        label: "待生成",
        className:
          "bg-[var(--surface-bg)] text-[var(--text-secondary)]",
      };
    case "CREATED":
      return {
        label: "待完善",
        className:
          "bg-white/8 text-[var(--text-secondary)]",
      };
    case "FAILED":
      return {
        label: "失败",
        className:
          "bg-rose-500/8 text-rose-300 dark:text-rose-300",
      };
    default:
      return {
        label: "未开始",
        className:
          "bg-white/8 text-[var(--text-secondary)]",
      };
  }
}

function getProjectMilestone(step?: number) {
  if (!step || step <= 1) {
    return { label: "构思中", detail: "故事世界观与角色设定正在成型", accent: "from-fuchsia-500/30 via-violet-500/16 to-transparent" };
  }
  if (step <= 2) {
    return { label: "配置中", detail: "画幅、风格与创作模式等待确认", accent: "from-sky-500/28 via-cyan-500/14 to-transparent" };
  }
  if (step <= 3) {
    return { label: "资产整理", detail: "场景、角色与道具素材已进入整理阶段", accent: "from-emerald-500/28 via-teal-500/14 to-transparent" };
  }
  return { label: "成片推进", detail: "分镜与视频合成进入最后冲刺", accent: "from-amber-500/28 via-orange-500/14 to-transparent" };
}

function formatRelativeTime(value?: string) {
  if (!value) {
    return "刚刚创建";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "最近更新";
  }

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))} 分钟前更新`;
  }
  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))} 小时前更新`;
  }
  if (diff < 7 * day) {
    return `${Math.max(1, Math.floor(diff / day))} 天前更新`;
  }

  return `${date.getMonth() + 1} 月 ${date.getDate()} 日更新`;
}

function getProjectCardSurfaceClass(step?: number) {
  if (!step || step <= 1) {
    return "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,255,0.96))] shadow-[0_18px_38px_rgba(99,102,241,0.10),0_3px_12px_rgba(15,23,42,0.05)]";
  }
  if (step <= 3) {
    return "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,248,255,0.96))] shadow-[0_18px_38px_rgba(59,130,246,0.10),0_3px_12px_rgba(15,23,42,0.05)]";
  }
  return "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,249,240,0.96))] shadow-[0_18px_38px_rgba(245,158,11,0.10),0_3px_12px_rgba(15,23,42,0.05)]";
}

function getProjectsCacheKey() {
  if (typeof window === "undefined") {
    return null;
  }
  const account = window.localStorage.getItem("gaga_user");
  if (!account) {
    return null;
  }
  return `${PROJECTS_CACHE_NAMESPACE}:${account}`;
}

function readProjectsCache(): ProjectsCacheSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cacheKey = getProjectsCacheKey();
  if (!cacheKey) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ProjectsCacheSnapshot;
    if (!Array.isArray(parsed.items) || typeof parsed.cachedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeProjectsCache(items: ProjectItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const cacheKey = getProjectsCacheKey();
  if (!cacheKey) {
    return;
  }

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        items,
        cachedAt: Date.now(),
      } satisfies ProjectsCacheSnapshot),
    );
  } catch {
    // Ignore storage write failures.
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "assets">("projects");
  const [activeFolder, setActiveFolder] = useState<AssetFolder | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [remoteProjects, setRemoteProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [authRefreshTick, setAuthRefreshTick] = useState(0);
  const projectStateMap = useProjectStore((state) => state.projects);
  const updateProject = useProjectStore((state) => state.updateProject);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleAuthUpdated = () => {
      setAuthRefreshTick((prev) => prev + 1);
    };

    window.addEventListener("storage", handleAuthUpdated);
    window.addEventListener(
      "gaga-auth-updated",
      handleAuthUpdated as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleAuthUpdated);
      window.removeEventListener(
        "gaga-auth-updated",
        handleAuthUpdated as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    const cachedSnapshot = readProjectsCache();
    const hasFreshCache =
      cachedSnapshot &&
      Date.now() - cachedSnapshot.cachedAt <= PROJECTS_CACHE_TTL;

    if (cachedSnapshot?.items.length) {
      setRemoteProjects(cachedSnapshot.items);
      setProjectsLoading(false);
      setProjectsError("");
    } else {
      setRemoteProjects([]);
      setProjectsLoading(true);
    }

    const loadProjects = async () => {
      setProjectsError("");
      try {
        const result = await listComicProjects({ limit: 50, offset: 0 });
        if (disposed) {
          return;
        }
        const items = result.items.map((project: ComicProjectListItem) => ({
          id: project.id,
          title: project.name,
          description: project.description ?? undefined,
          currentStep: project.current_step,
          status: project.status,
          updatedAt: project.updated_at,
        }));
        setRemoteProjects(items);
        writeProjectsCache(items);
        items.forEach((project) => {
          updateProject(project.title, { projectId: project.id });
        });
      } catch (error) {
        if (disposed) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "获取项目列表失败";
        setProjectsError(message);
        if (!cachedSnapshot?.items.length) {
          setRemoteProjects([]);
        }
      } finally {
        if (!disposed) {
          setProjectsLoading(false);
        }
      }
    };

    if (hasFreshCache) {
      void loadProjects();
    } else {
      setProjectsLoading(true);
      void loadProjects();
    }

    return () => {
      disposed = true;
    };
  }, [authRefreshTick, updateProject]);

  const projects = projectsError ? mockProjects : remoteProjects;

  const hasProjects = projects.length > 0;
  const totalCount = useMemo(() => projects.length, [projects.length]);
  const totalAssets = useMemo(
    () =>
      mockAssetFolders.reduce((sum, folder) => sum + folder.items.length, 0),
    [],
  );
  const currentFolderItems = activeFolder?.items ?? [];
  const enabledSteps = useMemo(
    () => workflowSteps.filter((step) => step.enabled !== false).map((step) => step.id),
    [],
  );

  const openProject = (project: ProjectItem) => {
    const progress = projectStateMap[project.title]?.progress ?? {};
    const firstIncompleteStep =
      enabledSteps.find((step) => progress?.[step] !== "done") ??
      enabledSteps[enabledSteps.length - 1] ??
      1;
    const backendStep =
      typeof project.currentStep === "number" && project.currentStep > 0
        ? project.currentStep
        : 1;
    const targetStep = Math.max(backendStep, firstIncompleteStep);
    const nameQuery = buildWorkflowQuery({
      name: project.title,
      pid: projectStateMap[project.title]?.projectId,
    });
    router.push(`/workflows/pro/step-${targetStep}${nameQuery}`);
  };

  const openCreateDialog = () => {
    setNewProjectName("");
    setCreateError("");
    setCreateDialogOpen(true);
  };

  const handleCreateWorkflow = async () => {
    const name = newProjectName.trim();
    if (!name || creatingProject) {
      return;
    }
    setCreatingProject(true);
    setCreateError("");
    try {
      const result = await createComicProject({ title: name });
      updateProject(name, { projectId: result.project_id });
      setCreateDialogOpen(false);
      router.push(
        `/workflows${buildWorkflowQuery({ name, pid: result.project_id })}`,
      );
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "创建项目失败");
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <main className="page-slide-up app-surface relative min-h-screen text-[var(--text-primary)]">
      <div className="mx-auto box-border flex min-h-screen w-full max-w-[1520px] flex-col px-5 pb-10 pt-18 md:px-6 xl:px-7">
        <div className="relative w-full max-w-[1420px] overflow-hidden rounded-[20px] bg-[var(--surface-bg)] px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.08)] md:px-5 xl:px-6">
          <div className="relative flex flex-col gap-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[26px] xl:text-[28px]">
                  {activeTab === "projects" ? "我的项目" : activeFolder ? activeFolder.title : "资产库"}
                </h1>
                <p className="mt-1 max-w-lg text-[13px] leading-6 text-[var(--text-secondary)] md:text-sm">
                  {activeTab === "projects"
                    ? "集中查看项目进度，直接从当前阶段继续推进漫剧制作。"
                    : activeFolder
                      ? "聚焦查看当前分类下的素材与后续管理动作。"
                      : "集中管理场景、角色与道具素材。"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {activeFolder ? (
                  <button
                    type="button"
                    onClick={() => setActiveFolder(null)}
                    className="btn-pill btn-pill-secondary"
                  >
                    <FolderOpen className="h-4 w-4" />
                    返回资产库
                  </button>
                ) : null}
                {activeTab === "projects" ? (
                  <button
                    type="button"
                    onClick={openCreateDialog}
                    className="btn-pill btn-pill-primary min-h-9 px-4 shadow-[0_10px_22px_rgba(var(--brand-rgb),0.22)] md:min-h-10 md:px-4.5"
                  >
                    <Sparkles className="h-4 w-4" />
                    新建工作流
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="btn-pill btn-pill-muted min-h-11 px-5"
                  >
                    + 上传素材
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-[14px] bg-[var(--surface-bg-hover)] p-1.5 md:flex-row md:items-center md:justify-between md:p-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="inline-flex w-full items-center gap-1 rounded-full bg-[var(--surface-bg)] p-1 text-sm text-[var(--text-primary)] md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("projects");
                      setActiveFolder(null);
                    }}
                    className={`btn-segment btn-segment-sm inline-flex flex-1 items-center gap-2.5 md:flex-none ${
                      activeTab === "projects"
                        ? "bg-white dark:bg-[var(--surface-bg-active)] text-slate-900 dark:text-[var(--text-primary)] shadow-[0_8px_18px_rgba(255,255,255,0.12)]"
                        : "text-[var(--text-tertiary)] hover:bg-[var(--surface-bg-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Clapperboard className="h-4 w-4" />
                    我的项目
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("assets")}
                    className={`btn-segment btn-segment-sm inline-flex flex-1 items-center gap-2.5 md:flex-none ${
                      activeTab === "assets"
                        ? "bg-white dark:bg-[var(--surface-bg-active)] text-slate-900 dark:text-[var(--text-primary)] shadow-[0_8px_18px_rgba(255,255,255,0.12)]"
                        : "text-[var(--text-tertiary)] hover:bg-[var(--surface-bg-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Boxes className="h-4 w-4" />
                    资产库
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-1 text-[13px] text-[var(--text-tertiary)]/80 md:text-sm">
                  <span>{activeTab === "projects" ? `共 ${totalCount} 个项目` : `共 ${totalAssets} 个资产`}</span>
                  {activeFolder ? <span className="text-[var(--text-secondary)]">当前目录：{activeFolder.title}</span> : null}
                  {activeTab === "projects" && projectsLoading ? (
                    <span
                      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-[var(--surface-border-strong)] border-t-[rgb(var(--brand-rgb))]"
                      aria-label="加载中"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === "projects" && projectsError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/18 bg-rose-500/8 px-4 py-3 text-xs text-red-400/80">
            项目列表获取失败，当前展示本地占位数据。{projectsError}
          </div>
        ) : null}

        {activeTab === "projects" ? (
          projectsLoading ? null : hasProjects ? (
            <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => openProject(project)}
                  className={`group relative flex min-h-[220px] flex-col overflow-hidden rounded-[22px] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:brightness-[0.995] hover:saturate-[1.02] md:min-h-[232px] xl:min-h-[244px] ${getProjectCardSurfaceClass(project.currentStep)} dark:[background-image:none] dark:bg-[var(--surface-bg)] dark:shadow-[0_10px_22px_rgba(0,0,0,0.08)] dark:hover:bg-[var(--surface-bg-hover)] dark:hover:shadow-[0_14px_28px_rgba(0,0,0,0.12)]`}
                >
                  <div className="relative flex min-h-[64px] flex-col justify-between overflow-hidden rounded-[16px] bg-[var(--surface-bg-hover)] px-3.5 py-3 md:min-h-[70px]">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] leading-none ${getProjectStatusMeta(project.status).className}`}
                      >
                        {getProjectStatusMeta(project.status).label}
                      </span>
                      <span className="rounded-full bg-[var(--surface-bg-active)] px-2.5 py-1 text-[11px] leading-none text-[var(--text-secondary)]">
                        步骤 {project.currentStep ?? 1}
                      </span>
                    </div>
                    <div>
                      <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.20em] text-[var(--text-tertiary)]">
                        {getProjectMilestone(project.currentStep).label}
                      </div>
                      <div className="mt-1 line-clamp-1 text-sm text-[var(--text-secondary)]">
                        {project.description?.trim() || getProjectMilestone(project.currentStep).detail}
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-3 flex flex-1 flex-col">
                    <div className="min-w-0">
                      <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[18px]">
                        {project.title}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-6 text-[var(--text-secondary)] md:text-sm">
                        {project.status === "COMPLETED"
                          ? "成片已完成，可继续回看并微调细节。"
                          : "继续沿当前阶段推进，系统会保留之前的设定与生成结果。"}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-white/7 px-3 py-1 text-[11px] text-[var(--text-secondary)]">
                        {workflowSteps.find((step) => step.id === (project.currentStep ?? 1))?.label ?? "故事设定"}
                      </span>
                      <span className="inline-flex rounded-full bg-white/7 px-3 py-1 text-[11px] text-[var(--text-tertiary)]">
                        {formatRelativeTime(project.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4.5 md:pt-5">
                      <div className="text-[11px] leading-5 text-[var(--text-tertiary)]/85 md:text-xs">
                        继续沿当前节点进入工作流
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3.5 py-2 text-[13px] font-semibold text-[var(--text-primary)] transition group-hover:bg-white/18 md:px-4 md:text-sm">
                        继续编辑
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-[30px] border border-[var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-[0_18px_54px_rgba(0,0,0,0.22)]">
              <div className="card-title text-[18px]">还没有项目</div>
              <p className="card-note mt-2 max-w-md text-sm">
                点击右上角“新建工作流”，先创建一个项目名称，再进入完整的漫剧创作流程。
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="btn-pill btn-pill-primary"
                >
                  + 新建工作流
                </button>
              </div>
            </div>
          )
        ) : activeFolder ? (
          <div className="mt-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {currentFolderItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[28px] border border-[var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm"
                >
                  <div className="relative overflow-hidden rounded-[22px] border border-white/8 bg-[var(--surface-bg)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={800}
                        height={600}
                        className="h-[190px] w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[190px] w-full items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
                        <ThemedIcon
                          name="image-placeholder"
                          className="h-6 w-6 opacity-40"
                        />
                      </div>
                    )}
                  </div>
                  <div className="card-title mt-4 text-base">
                    {item.title}
                  </div>
                  <div className="card-note mt-1">素材详情与批量操作将在这里展开</div>
                </div>
              ))}
            </div>
          </div>
        ) : mockAssetFolders.length > 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {mockAssetFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setActiveFolder(folder)}
                className="group text-left rounded-[28px] border border-[var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-[var(--surface-border-strong)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[var(--surface-border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))]">
                    <ThemedIcon name="folder" className="h-6 w-6 opacity-80" />
                  </div>
                  <span className="rounded-full border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-2.5 py-1 text-[10px] text-[var(--text-tertiary)]">
                    {folder.items.length} 项
                  </span>
                </div>
                <div className="mt-8 text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  {folder.title}
                </div>
                <div className="card-note mt-2 text-sm">
                  进入分类面板，查看已生成素材与后续管理动作
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)]">
                  查看素材
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-[28px] border border-[var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 text-sm text-[var(--text-primary)]">
            暂无资产记录。后续可在此管理场景、角色与道具素材。
          </div>
        )}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-lg border border-black/10 bg-white/95 p-7 text-slate-800 ring-black/5 dark:border-[var(--surface-border-strong)] dark:bg-zinc-950/95 dark:text-[var(--text-primary)] dark:ring-white/10"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-800 dark:text-[var(--text-primary)]">
              新建工作流
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <div className="mb-2 text-sm text-slate-600 dark:text-[var(--text-tertiary)]">项目名称</div>
            <input
              value={newProjectName}
              disabled={creatingProject}
              onChange={(event) => setNewProjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateWorkflow();
                }
              }}
              className="w-full rounded-xl border border-black/15 bg-black/[0.03] px-4 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-[rgb(var(--brand-rgb))] dark:border-[var(--surface-border-strong)] dark:bg-[var(--surface-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-tertiary)] dark:focus:border-[rgb(var(--brand-rgb))]"
              placeholder="请输入项目名称"
              autoFocus
            />
            {createError ? (
              <div className="mt-2 text-xs text-red-500 dark:text-red-300/90">
                {createError}
              </div>
            ) : null}
          </div>
          <DialogFooter className="mt-4 -mx-0 -mb-0 border-0 bg-transparent p-0">
            <button
              type="button"
              disabled={creatingProject}
              onClick={() => setCreateDialogOpen(false)}
              className="btn-pill border border-black/15 bg-black/[0.03] text-slate-600 hover:bg-black/[0.06] hover:text-slate-800 dark:border-[var(--surface-border-strong)] dark:bg-[var(--surface-bg)] dark:text-[var(--text-tertiary)] dark:hover:bg-[var(--surface-bg-hover)] dark:hover:text-[var(--text-primary)]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => void handleCreateWorkflow()}
              disabled={!newProjectName.trim() || creatingProject}
              className="btn-pill btn-pill-primary"
            >
              {creatingProject ? "创建中..." : "保存"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
