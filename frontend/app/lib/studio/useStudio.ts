"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudioProject, StudioData } from "./types";
import { loadProject, saveProject } from "./repository";
import { accountScope } from "./settings";
import { readDraft, writeDraft } from "./drafts";

export function useStudio(id: string) {
  const [project, setProject] = useState<StudioProject | null>(null),
    [error, setError] = useState(""),
    [saveState, setSaveState] = useState("loading");
  const current = useRef<StudioProject | null>(null),
    version = useRef(0),
    saved = useRef(0),
    inFlight = useRef<Promise<void> | null>(null),
    alive = useRef(true),
    draftKey = useRef(
      `${id.startsWith("demo-") ? "local" : accountScope()}:${id}`,
    ),
    draftWork = useRef<Promise<void>>(Promise.resolve());
  const persist = useCallback((p?: StudioProject, clearIf?: StudioProject) => {
    draftWork.current = draftWork.current
      .catch(() => {})
      .then(() => writeDraft(draftKey.current, p, clearIf));
    void draftWork.current.catch((e) => {
      if (alive.current) setError(e.message);
    });
  }, []);
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    loadProject(id)
      .then(async (p) => {
        const draft = await readDraft(draftKey.current).catch((e) => {
          if (!cancelled) setError(e.message);
          return undefined;
        });
        if (!cancelled) {
          const recovered =
            draft &&
            (draft.name !== p.name ||
              JSON.stringify(draft.data) !== JSON.stringify(p.data));
          current.current = recovered ? draft : p;
          setProject(current.current);
          if (recovered) {
            version.current = 1;
            setSaveState("error");
            setError(
              "已恢复上次未保存的本地草稿。请重试保存；如版本冲突，可先导出备份。",
            );
          } else setSaveState("saved");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
      alive.current = false;
    };
  }, [id]);
  const flush = useCallback(async () => {
    if (inFlight.current) {
      await inFlight.current;
      return;
    }
    const work = async () => {
      while (current.current && saved.current < version.current) {
        const snapshot = current.current,
          v = version.current;
        setSaveState("saving");
        try {
          const meta = await saveProject(snapshot);
          saved.current = v;
          current.current = { ...current.current, ...meta };
          persist(
            saved.current === version.current ? undefined : current.current,
            snapshot,
          );
          if (alive.current) {
            setProject(current.current);
            setSaveState(
              saved.current === version.current ? "saved" : "saving",
            );
            setError("");
          }
        } catch (e) {
          if (alive.current) {
            setError(e instanceof Error ? e.message : "保存失败");
            setSaveState("error");
          }
          throw e;
        }
      }
    };
    inFlight.current = work();
    try {
      await inFlight.current;
    } finally {
      inFlight.current = null;
    }
  }, [persist]);
  useEffect(
    () => () => {
      void flush().catch(() => {});
    },
    [flush],
  );
  const edit = useCallback(
    (change: (p: StudioProject) => StudioProject) => {
      if (!current.current) return;
      current.current = change(current.current);
      persist(current.current);
      version.current++;
      setProject(current.current);
      setSaveState("dirty");
    },
    [persist],
  );
  const editData = useCallback(
    (change: (data: StudioData) => StudioData) =>
      edit((p) => ({ ...p, data: change(p.data) })),
    [edit],
  );
  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = setTimeout(() => {
      void flush().catch(() => {});
    }, 650);
    return () => clearTimeout(timer);
  }, [project, saveState, flush]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (saved.current < version.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);
  async function discardDraft() {
    const fresh = await loadProject(id);
    await draftWork.current.catch(() => {});
    await writeDraft(draftKey.current);
    current.current = fresh;
    version.current = 0;
    saved.current = 0;
    setProject(fresh);
    setError("");
    setSaveState("saved");
  }
  return {
    project,
    current,
    error,
    saveState,
    edit,
    editData,
    flush,
    discardDraft,
  };
}
