"use client";

import { useEffect, useMemo, useState } from "react";
import { uploadWorkflowImage } from "../../lib/api/image";
import { apiRequest } from "../../lib/api/client";
import { getComicProject, type ComicProjectDetail } from "../../lib/api/comic";
import { useProjectState } from "./useProjectState";
import type { WorkflowAssetsState } from "../../store/useProjectStore";

export type AssetCategory = "scene" | "character" | "prop";

export type AssetCard = {
  id: string;
  title: string;
  subtitle?: string;
};

export const assetTabs: { id: AssetCategory; label: string }[] = [
  { id: "scene", label: "场景" },
  { id: "character", label: "角色" },
  { id: "prop", label: "道具" },
];

const initialSceneCards: AssetCard[] = [];

const initialCharacterCards: AssetCard[] = [];

const initialPropCards: AssetCard[] = [];

function normalizeNamedItem(
  item: { id?: string; name?: string; description?: string } | string,
  prefix: string,
  index: number,
): AssetCard {
  if (typeof item === "string") {
    return {
      id: `${prefix}-${index + 1}`,
      title: `${prefix === "char" ? "角色" : "道具"} ${String(index + 1).padStart(2, "0")}`,
      subtitle: item,
    };
  }

  return {
    id: item.id || `${prefix}-${index + 1}`,
    title: `${prefix === "char" ? "角色" : "道具"} ${String(index + 1).padStart(2, "0")}`,
    subtitle: item.name || item.description || "未命名",
  };
}

function syncProjectAssets(
  project: ComicProjectDetail,
  setScenes: React.Dispatch<React.SetStateAction<AssetCard[]>>,
  setCharacters: React.Dispatch<React.SetStateAction<AssetCard[]>>,
  setPropsList: React.Dispatch<React.SetStateAction<AssetCard[]>>,
  setPromptMap: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setGeneratedMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setNextSceneId: React.Dispatch<React.SetStateAction<number>>,
  setNextCharId: React.Dispatch<React.SetStateAction<number>>,
  setNextPropId: React.Dispatch<React.SetStateAction<number>>,
) {
  const nextScenes = project.scenes.map((scene, index) => ({
    id: scene.id,
    title: `场景 ${String(index + 1).padStart(2, "0")}`,
    subtitle: scene.name || scene.description || "未命名",
  }));
  const nextCharacters = (project.script?.extracted_characters || []).map(
    (item, index) => normalizeNamedItem(item, "char", index),
  );
  const nextProps = (project.script?.extracted_props || []).map((item, index) =>
    normalizeNamedItem(item, "prop", index),
  );

  setScenes(nextScenes);
  setCharacters(nextCharacters);
  setPropsList(nextProps);
  setNextSceneId(nextScenes.length + 1);
  setNextCharId(nextCharacters.length + 1);
  setNextPropId(nextProps.length + 1);
  setGeneratedMap(
    Object.fromEntries(nextScenes.map((scene) => [scene.id, true])),
  );
  setPromptMap(
    Object.fromEntries(
      project.scenes.map((scene) => [scene.id, scene.prompt || scene.description || ""]),
    ),
  );
}

function createDefaultAssetsState(): WorkflowAssetsState {
  return {
    activeTab: "scene",
    scenes: initialSceneCards,
    characters: initialCharacterCards,
    propsList: initialPropCards,
    nextSceneId: initialSceneCards.length + 1,
    nextCharId: initialCharacterCards.length + 1,
    nextPropId: initialPropCards.length + 1,
    generatedMap: {},
    promptMap: {},
    customSceneIds: [],
    sceneUploads: {},
    characterUploads: {},
    propUploads: {},
    projectStatus: null,
  };
}

function getUploadErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (
    message === "Not Found" ||
    message.includes("Request failed: 404") ||
    message.includes("404")
  ) {
    return "图片上传接口暂不可用，请检查上传服务配置。";
  }
  return message || "图片上传失败，请稍后重试。";
}

export function useAssets(projectId?: string, projectName?: string | null) {
  const { project, projectKey, setWorkflowAssets } = useProjectState(projectName);
  const cachedAssets = {
    ...createDefaultAssetsState(),
    ...(project.assets ?? {}),
  };
  const initialAssets =
    cachedAssets.scenes.length ||
    cachedAssets.characters.length ||
    cachedAssets.propsList.length ||
    cachedAssets.customSceneIds.length
      ? cachedAssets
      : createDefaultAssetsState();

  const [activeTab, setActiveTab] = useState<AssetCategory>(initialAssets.activeTab);
  const [scenes, setScenes] = useState<AssetCard[]>(initialAssets.scenes);
  const [characters, setCharacters] = useState<AssetCard[]>(initialAssets.characters);
  const [nextSceneId, setNextSceneId] = useState(initialAssets.nextSceneId);
  const [nextCharId, setNextCharId] = useState(initialAssets.nextCharId);
  const [propsList, setPropsList] = useState<AssetCard[]>(initialAssets.propsList);
  const [nextPropId, setNextPropId] = useState(initialAssets.nextPropId);
  const [generatedMap, setGeneratedMap] = useState<Record<string, boolean>>(initialAssets.generatedMap);
  const [promptMap, setPromptMap] = useState<Record<string, string>>(initialAssets.promptMap);
  const [customSceneIds, setCustomSceneIds] = useState<string[]>(initialAssets.customSceneIds);
  const [sceneUploads, setSceneUploads] = useState<Record<string, (string | null)[]>>(
    initialAssets.sceneUploads,
  );
  const [characterUploads, setCharacterUploads] = useState<Record<string, string | null>>(
    initialAssets.characterUploads,
  );
  const [propUploads, setPropUploads] = useState<Record<string, string | null>>(
    initialAssets.propUploads,
  );
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [errorSceneId, setErrorSceneId] = useState<string | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [sceneNameDraft, setSceneNameDraft] = useState("");
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(
    null,
  );
  const [characterNameDraft, setCharacterNameDraft] = useState("");
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propNameDraft, setPropNameDraft] = useState("");
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<string | null>(
    initialAssets.projectStatus,
  );
  const [isSyncingProject, setIsSyncingProject] = useState(false);
  const sceneSlots = ["正面", "背面", "左侧", "右侧"];

  useEffect(() => {
    setWorkflowAssets(projectKey, {
      activeTab,
      scenes,
      characters,
      propsList,
      nextSceneId,
      nextCharId,
      nextPropId,
      generatedMap,
      promptMap,
      customSceneIds,
      sceneUploads,
      characterUploads,
      propUploads,
      projectStatus,
    });
  }, [
    activeTab,
    characters,
    characterUploads,
    customSceneIds,
    generatedMap,
    nextCharId,
    nextPropId,
    nextSceneId,
    projectKey,
    projectStatus,
    promptMap,
    propUploads,
    propsList,
    sceneUploads,
    scenes,
    setWorkflowAssets,
  ]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loadProject = async () => {
      setIsSyncingProject(true);
      try {
        const project = await getComicProject(projectId);
        if (disposed) {
          return;
        }
        setProjectStatus(project.status);
        syncProjectAssets(
          project,
          setScenes,
          setCharacters,
          setPropsList,
          setPromptMap,
          setGeneratedMap,
          setNextSceneId,
          setNextCharId,
          setNextPropId,
        );

        if (project.status === "GENERATING") {
          timer = setTimeout(loadProject, 3000);
          return;
        }

        if (project.status === "FAILED") {
          setErrorMessage(project.error_message || "剧本生成失败");
        }
      } catch (error) {
        if (!disposed) {
          setErrorMessage(
            error instanceof Error ? error.message : "获取项目详情失败",
          );
        }
      } finally {
        if (!disposed) {
          setIsSyncingProject(false);
        }
      }
    };

    void loadProject();

    return () => {
      disposed = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [projectId]);

  const cards = useMemo(() => {
    if (activeTab === "character") {
      return characters;
    }
    if (activeTab === "prop") {
      return propsList;
    }
    return scenes;
  }, [activeTab, characters, scenes, propsList]);

  const handleAdd = () => {
    if (activeTab === "scene") {
      const nextIndex = nextSceneId;
      const nextId = `scene-${nextIndex}`;
      const nextTitle = `场景 ${String(nextIndex).padStart(2, "0")}`;
      const nextSubtitle = "新场景";
      setScenes((prev) => [
        ...prev,
        {
          id: nextId,
          title: nextTitle,
          subtitle: nextSubtitle,
        },
      ]);
      setNextSceneId((prev) => prev + 1);
      setCustomSceneIds((prev) => [...prev, nextId]);
      setSceneUploads((prev) => ({
        ...prev,
        [nextId]: [null, null, null, null],
      }));
      setGeneratedMap((prev) => ({ ...prev, [nextId]: true }));
      setPromptMap((prev) => ({
        ...prev,
        [nextId]:
          prev[nextId] ?? `${nextSubtitle}，柔和光线，2D 动漫风格，细节清晰。`,
      }));
      setEditingPromptId(nextId);
      setPendingFocusId(nextId);
      return;
    }

    if (activeTab === "character") {
      const nextIndex = nextCharId;
      setCharacters((prev) => {
        return [
          ...prev,
          {
            id: `char-${nextIndex}`,
            title: `角色 ${String(nextIndex).padStart(2, "0")}`,
            subtitle: "新角色",
          },
        ];
      });
      setNextCharId((prev) => prev + 1);
      return;
    }

    if (activeTab === "prop") {
      const nextIndex = nextPropId;
      setPropsList((prev) => [
        ...prev,
        {
          id: `prop-${nextIndex}`,
          title: `道具 ${String(nextIndex).padStart(2, "0")}`,
          subtitle: "新道具",
        },
      ]);
      setNextPropId((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!pendingFocusId || typeof window === "undefined") {
      return;
    }
    const id = pendingFocusId;
    requestAnimationFrame(() => {
      const card = document.getElementById(`asset-card-${id}`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
      const prompt = document.getElementById(`prompt-${id}`);
      if (prompt instanceof HTMLTextAreaElement) {
        prompt.focus();
      }
    });
  }, [pendingFocusId]);

  const handleDeleteScene = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("确定删除该场景吗？")) {
      return;
    }
    setScenes((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeleteCharacter = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("确定删除该角色吗？")) {
      return;
    }
    setCharacters((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeleteProp = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("确定删除该道具吗？")) {
      return;
    }
    setPropsList((prev) => prev.filter((item) => item.id !== id));
  };

  const updateSubtitle = (
    setList: React.Dispatch<React.SetStateAction<AssetCard[]>>,
    id: string,
    value: string,
  ) => {
    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, subtitle: value } : item)),
    );
  };

  const handleCharacterSubtitleChange = (id: string, value: string) => {
    updateSubtitle(setCharacters, id, value);
  };

  const handleSceneSubtitleChange = (id: string, value: string) => {
    updateSubtitle(setScenes, id, value);
  };

  const handlePropNameChange = (id: string, value: string) => {
    updateSubtitle(setPropsList, id, value);
  };

  const handleGenerate = (card: AssetCard) => {
    setGeneratedMap((prev) => ({ ...prev, [card.id]: true }));
    setPromptMap((prev) => {
      if (prev[card.id]) {
        return prev;
      }
      return {
        ...prev,
        [card.id]: `${card.subtitle ?? card.title}，柔和光线，2D 动漫风格，细节清晰。`,
      };
    });
    if (card.id.startsWith("scene-") && customSceneIds.includes(card.id)) {
      setSceneUploads((prev) => ({
        ...prev,
        [card.id]: [
          prev[card.id]?.[0] ?? null,
          prev[card.id]?.[1] ?? null,
          prev[card.id]?.[2] ?? null,
          prev[card.id]?.[3] ?? null,
        ],
      }));
      if (errorSceneId === card.id) {
        setErrorSceneId(null);
        setErrorMessage("");
      }
    }
  };

  type TaskStatusResponse = {
    status?: string;
    videoGenerateTaskInfo?: {
      errMsg?: string;
      videoGenerateTaskOutput?: {
        mediaBasicInfos?: Array<{ source?: { sourceUrl?: string } }>;
      };
    };
  };

  const pollTaskForImageUrl = async (taskId: string): Promise<string> => {
    const maxTries = 20;
    const intervalMs = 3000;
    for (let i = 0; i < maxTries; i += 1) {
      const result = await apiRequest<TaskStatusResponse>(`/api/v1/tasks/${taskId}`);
      const status = result?.status;
      if (status === "SUCCESS" || status === "FINISHED") {
        const mediaInfos =
          result?.videoGenerateTaskInfo?.videoGenerateTaskOutput?.mediaBasicInfos || [];
        const url = mediaInfos[0]?.source?.sourceUrl;
        if (url) {
          return url;
        }
      } else if (status === "FAILED") {
        throw new Error(result?.videoGenerateTaskInfo?.errMsg || "生成失败");
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error("生成超时，请稍后重试");
  };

  const handleGenerateSceneViews = async (cardId: string) => {
    const current = sceneUploads[cardId] ?? [null, null, null, null];
    const frontImage = current[0];
    const generateKey = `${cardId}:generate`;
    setUploadingMap((prev) => ({ ...prev, [generateKey]: true }));
    try {
      if (!frontImage) {
        const prompt = promptMap[cardId]?.trim();
        if (!prompt) {
          setErrorMessage("请先填写场景描述后再生成正面图。");
          setErrorSceneId(cardId);
          return;
        }
        const resp = await apiRequest<{ taskId: string }>("/api/v1/aigc/image", {
          method: "POST",
          body: JSON.stringify({
            model: "NBP",
            messages: [
              {
                role: "user",
                content: [{ type: "text", text: prompt }],
              },
            ],
            size: "1:1",
            quality: "1K",
            n: 1,
          }),
        });
        const imageUrl = await pollTaskForImageUrl(resp.taskId);
        setSceneUploads((prev) => {
          const next = [...(prev[cardId] ?? [null, null, null, null])];
          next[0] = imageUrl;
          return { ...prev, [cardId]: next };
        });
        return;
      }

      const prompt = promptMap[cardId]?.trim();
      if (!prompt) {
        setErrorMessage("请先填写场景描述后再生成三视图。");
        setErrorSceneId(cardId);
        return;
      }
      await apiRequest("/api/v1/aigc/image", {
        method: "POST",
        body: JSON.stringify({
          model: "NBP",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_item: { image_url: frontImage },
                },
              ],
            },
          ],
          size: "1:1",
          quality: "1K",
          n: 1,
        }),
      });
      // Keep side views empty until backend returns real generated images.
      setSceneUploads((prev) => ({ ...prev, [cardId]: [...current] }));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "生成失败，请稍后重试。");
    } finally {
      setUploadingMap((prev) => ({ ...prev, [generateKey]: false }));
    }
  };

  const handleGenerateAll = () => {
    setGeneratedMap((prev) => {
      const next = { ...prev };
      cards.forEach((card) => {
        next[card.id] = true;
      });
      return next;
    });
    setPromptMap((prev) => {
      const next = { ...prev };
      cards.forEach((card) => {
        if (!next[card.id]) {
          next[card.id] = `${card.subtitle ?? card.title}，柔和光线，2D 动漫风格，细节清晰。`;
        }
      });
      return next;
    });
  };

  const handlePromptChange = (cardId: string, value: string) => {
    setPromptMap((prev) => ({ ...prev, [cardId]: value }));
  };

  const startEditSceneName = (card: AssetCard) => {
    setEditingSceneId(card.id);
    setSceneNameDraft(card.subtitle ?? "");
  };

  const commitSceneName = (id: string) => {
    handleSceneSubtitleChange(id, sceneNameDraft.trim());
    setEditingSceneId(null);
  };

  const startEditCharacterName = (card: AssetCard) => {
    setEditingCharacterId(card.id);
    setCharacterNameDraft(card.subtitle ?? "");
  };

  const commitCharacterName = (id: string) => {
    handleCharacterSubtitleChange(id, characterNameDraft.trim());
    setEditingCharacterId(null);
  };

  const startEditPropName = (card: AssetCard) => {
    setEditingPropId(card.id);
    setPropNameDraft(card.subtitle ?? card.title ?? "");
  };

  const commitPropName = (id: string) => {
    const name = propNameDraft.trim();
    if (name) {
      handlePropNameChange(id, name);
    }
    setEditingPropId(null);
  };

  const handleSceneUpload = async (cardId: string, index: number, file: File) => {
    const uploadKey = `${cardId}:${index}`;
    setUploadingMap((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      const imageUrl = await uploadWorkflowImage(file);
      setSceneUploads((prev) => {
        const current = prev[cardId] ?? [null, null, null, null];
        const next = [...current];
        next[index] = imageUrl;
        return { ...prev, [cardId]: next };
      });
      if (errorSceneId === cardId) {
        setErrorSceneId(null);
        setErrorMessage("");
      }
    } catch (err) {
      setErrorMessage(getUploadErrorMessage(err));
    } finally {
      setUploadingMap((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleCharacterUpload = async (cardId: string, file: File) => {
    const uploadKey = `${cardId}:character`;
    setUploadingMap((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      const imageUrl = await uploadWorkflowImage(file);
      setCharacterUploads((prev) => ({ ...prev, [cardId]: imageUrl }));
    } catch (err) {
      setErrorMessage(getUploadErrorMessage(err));
    } finally {
      setUploadingMap((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handlePropUpload = async (cardId: string, file: File) => {
    const uploadKey = `${cardId}:prop`;
    setUploadingMap((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      const imageUrl = await uploadWorkflowImage(file);
      setPropUploads((prev) => ({ ...prev, [cardId]: imageUrl }));
    } catch (err) {
      setErrorMessage(getUploadErrorMessage(err));
    } finally {
      setUploadingMap((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleNext = () => {
    const missingSceneId = customSceneIds.find((id) => {
      const uploads = sceneUploads[id] ?? [];
      return !uploads[0];
    });
    if (missingSceneId) {
      setErrorMessage("请为新增场景至少上传一张图片后再进入下一步。");
      setErrorSceneId(missingSceneId);
      const card = document.getElementById(`asset-card-${missingSceneId}`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    setErrorMessage("");
    setErrorSceneId(null);
    return true;
  };

  return {
    activeTab,
    setActiveTab,
    cards,
    scenes,
    characters,
    propsList,
    sceneSlots,
    errorMessage,
    errorSceneId,
    generatedMap,
    promptMap,
    customSceneIds,
    sceneUploads,
    characterUploads,
    propUploads,
    uploadingMap,
    projectStatus,
    isSyncingProject,
    editingSceneId,
    sceneNameDraft,
    setSceneNameDraft,
    editingCharacterId,
    characterNameDraft,
    setCharacterNameDraft,
    editingPropId,
    propNameDraft,
    setPropNameDraft,
    editingPromptId,
    setEditingPromptId,
    handleAdd,
    handleGenerateAll,
    handleGenerate,
    handlePromptChange,
    startEditSceneName,
    commitSceneName,
    startEditCharacterName,
    commitCharacterName,
    startEditPropName,
    commitPropName,
    handleDeleteScene,
    handleDeleteCharacter,
    handleDeleteProp,
    handleSceneUpload,
    handleCharacterUpload,
    handlePropUpload,
    handleGenerateSceneViews,
    handleNext,
  };
}
