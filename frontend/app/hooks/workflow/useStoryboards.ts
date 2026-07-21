"use client";

import type { DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectState } from "./useProjectState";

export type StoryboardItem = {
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

export const createEmptyStoryboard = (): StoryboardItem => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `shot-${Date.now()}`,
  scene: "",
  characters: [],
  props: [],
  description: "请补充画面描述",
  dialogue: "请补充台词",
  speaker: "待选择",
  voiceStyle: "活泼女声",
  camera: "待选择",
  duration: 0,
  mode: "待选择",
});

export function useStoryboards(
  initialStoryboards: StoryboardItem[],
  projectName?: string | null,
) {
  const { projectKey, project, setWorkflowStoryboards } =
    useProjectState(projectName);
  const cachedStoryboards = project.storyboards?.items ?? [];
  const [storyboards, setStoryboards] = useState<StoryboardItem[]>(
    cachedStoryboards.length ? cachedStoryboards : initialStoryboards,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StoryboardItem | null>(null);
  const [roleToAdd, setRoleToAdd] = useState("");
  const [propToAdd, setPropToAdd] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorId, setErrorId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement | null>());

  const roleOptions = ["小可爱", "兔子", "小八"];
  const propOptions = ["樱花树", "手绘本", "信件"];

  useEffect(() => {
    setWorkflowStoryboards(projectKey, { items: storyboards });
  }, [projectKey, setWorkflowStoryboards, storyboards]);

  const hasStoryboards = storyboards.length > 0;
  const items = useMemo(() => storyboards, [storyboards]);

  const handleSceneChange = (id: string, scene: string) => {
    setStoryboards((prev) =>
      prev.map((item) => (item.id === id ? { ...item, scene } : item)),
    );
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("确定删除该分镜吗？")) {
      return;
    }
    setStoryboards((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (shot: StoryboardItem) => {
    setEditingId(shot.id);
    setDraft({ ...shot });
    setRoleToAdd("");
    setPropToAdd("");
  };

  const handleCloseDrawer = () => {
    setEditingId(null);
    setDraft(null);
    setErrorId(null);
  };

  const handleSave = () => {
    if (!editingId || !draft) {
      return;
    }
    setStoryboards((prev) =>
      prev.map((item) => (item.id === editingId ? { ...draft, id: item.id } : item)),
    );
    if (errorMessage) {
      setErrorMessage("");
    }
    handleCloseDrawer();
  };

  const updateDraft = (patch: Partial<StoryboardItem>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    if (errorMessage) {
      setErrorMessage("");
    }
    if (errorId) {
      setErrorId(null);
    }
  };

  const addRole = () => {
    if (!draft || !roleToAdd) {
      return;
    }
    if (draft.characters.includes(roleToAdd)) {
      return;
    }
    updateDraft({ characters: [...draft.characters, roleToAdd] });
    setRoleToAdd("");
  };

  const addProp = () => {
    if (!draft || !propToAdd) {
      return;
    }
    if (draft.props.includes(propToAdd)) {
      return;
    }
    updateDraft({ props: [...draft.props, propToAdd] });
    setPropToAdd("");
  };

  const isShotComplete = (shot: StoryboardItem) => {
    const descriptionOk =
      Boolean(shot.description?.trim()) &&
      shot.description.trim() !== "请补充画面描述";
    const dialogueOk =
      Boolean(shot.dialogue?.trim()) &&
      shot.dialogue.trim() !== "请补充台词";
    const hasCharacters = shot.characters.length > 0;
    const hasProps = shot.props.length > 0;
    const hasScene = Boolean(shot.scene?.trim());
    const durationOk = shot.duration > 0;

    return (
      descriptionOk &&
      dialogueOk &&
      hasCharacters &&
      hasProps &&
      hasScene &&
      durationOk
    );
  };

  const scrollToCard = (shotId: string) => {
    const node = cardRefs.current.get(shotId);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleNext = () => {
    if (editingId) {
      setErrorMessage("请先保存当前分镜的编辑内容。");
      setErrorId(editingId);
      scrollToCard(editingId);
      return false;
    }
    const itemsToCheck = storyboards;
    const target = itemsToCheck.find((item) => !isShotComplete(item));
    if (target) {
      setErrorMessage("请补全未完成的分镜内容后再进入下一步。");
      setErrorId(target.id);
      scrollToCard(target.id);
      return false;
    }
    setErrorId(null);
    return true;
  };

  const reorderShots = (fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }
    setStoryboards((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === fromId);
      const toIndex = prev.findIndex((item) => item.id === toId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (id: string) => (event: DragEvent) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragOver = (id: string) => (event: DragEvent) => {
    event.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (id: string) => (event: DragEvent) => {
    event.preventDefault();
    const fromId = event.dataTransfer.getData("text/plain") || draggingId;
    if (fromId) {
      reorderShots(fromId, id);
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  return {
    storyboards,
    setStoryboards,
    hasStoryboards,
    items,
    editingId,
    draft,
    roleToAdd,
    propToAdd,
    errorMessage,
    errorId,
    dragOverId,
    cardRefs,
    roleOptions,
    propOptions,
    setRoleToAdd,
    setPropToAdd,
    handleSceneChange,
    handleDelete,
    handleEdit,
    handleCloseDrawer,
    handleSave,
    updateDraft,
    addRole,
    addProp,
    handleNext,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
