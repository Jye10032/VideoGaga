"use client";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Modality, Run, StudioData, StudioProject } from "./types";
import { generate, getRun, listRuns, pollRun } from "./repository";
import { ApiError } from "../api/client";
import { loadSettings } from "./settings";
import {
  demoPlan,
  parsePlan,
  planPrompt,
  shotPrompt,
  inputHash,
} from "./planning";
import { demoImage, demoAudio } from "./media";

export function useGeneration(
  id: string,
  current: MutableRefObject<StudioProject | null>,
  editData: (fn: (data: StudioData) => StudioData) => void,
  flush: () => Promise<void>,
) {
  const [runs, setRuns] = useState<Run[]>([]),
    [busy, setBusy] = useState(false),
    [batching, setBatching] = useState(false),
    [historyLoaded, setHistoryLoaded] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const running = useRef(false),
    stop = useRef(false);
  useEffect(() => {
    let cancelled = false;
    listRuns(id)
      .then((rows) => {
        if (!cancelled) {
          setRuns(rows);
          setHistoryLoaded(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
      stop.current = true;
    };
  }, [id]);
  function remember(run: Run) {
    setRuns((rows) =>
      [run, ...rows.filter((r) => r.id !== run.id)].filter(
        (r, i) =>
          i < 100 || ["running", "pending", "uncertain"].includes(r.status),
      ),
    );
  }
  async function apply(run: Run) {
    if (run.status !== "success") return;
    const snapshot = current.current?.data;
    if (
      !snapshot ||
      run.sourceHash !== (await inputHash(snapshot, run.kind, run.targetId)) ||
      current.current?.data !== snapshot
    )
      throw new Error("输入已修改，这次生成结果属于旧版本，请重新生成");
    if (run.kind === "text") {
      const plan = parsePlan(run.output.text || "");
      editData((data) => ({ ...data, ...plan }));
      return;
    }
    const assetTarget = run.targetId.startsWith("asset:"),
      target = run.targetId.replace(/^(asset|shot):/, "");
    editData((data) =>
      assetTarget
        ? {
            ...data,
            assets: data.assets.map((a) =>
              a.id === target
                ? { ...a, image: run.output.media || "", confirmed: false }
                : a,
            ),
            shots: data.shots.map((s) =>
              s.assetIds.includes(target) ? { ...s, image: "", video: "" } : s,
            ),
          }
        : {
            ...data,
            shots: data.shots.map((s) =>
              s.id === target
                ? {
                    ...s,
                    ...(run.kind === "image"
                      ? { image: run.output.media || "", video: "" }
                      : run.kind === "video"
                        ? { video: run.output.media || "" }
                        : { audio: run.output.media || "" }),
                  }
                : s,
            ),
          },
    );
  }
  async function run(
    kind: Modality,
    targetId: string,
    acknowledgeDuplicate = false,
  ) {
    if (!historyLoaded) {
      setError("任务记录尚未载入，请刷新后再生成");
      throw new Error("任务记录尚未载入");
    }
    if (running.current) throw new Error("请等待当前任务完成");
    const project = current.current;
    if (!project) throw new Error("项目尚未载入");
    running.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    let accepted: Run | undefined;
    let submitted = false;
    const task: Run = {
      id: crypto.randomUUID(),
      sourceHash: "",
      kind,
      targetId,
      status: "running",
      output: {},
      createdAt: new Date().toISOString(),
    };
    remember(task);
    try {
      await flush();
      task.sourceHash = await inputHash(project.data, kind, targetId);
      if (
        !acknowledgeDuplicate &&
        runs.some(
          (r) =>
            r.kind === kind &&
            r.targetId === targetId &&
            r.sourceHash === task.sourceHash &&
            ["pending", "running", "uncertain"].includes(r.status),
        )
      )
        throw new Error("该输入已有待确认的任务，请先在生成任务中查询原请求");
      const asset = project.data.assets.find(
          (a) => `asset:${a.id}` === targetId,
        ),
        shot = project.data.shots.find((s) => `shot:${s.id}` === targetId);
      const prompt =
        kind === "text"
          ? planPrompt(project.data.script)
          : asset
            ? `${asset.name}，${asset.description}`
            : shot
              ? kind === "audio"
                ? shot.dialogue
                : shotPrompt(shot, project.data.assets)
              : "";
      if (!prompt.trim()) throw new Error("请先填写生成内容");
      let result: Run;
      if (project.mode === "demo") {
        const output =
          kind === "text"
            ? { text: JSON.stringify(demoPlan(project.data.script)) }
            : kind === "audio"
              ? { media: demoAudio(shot?.duration || 4) }
              : kind === "video"
                ? { media: "demo:motion" }
                : {
                    media: demoImage(
                      asset?.name || shot?.title || "分镜",
                      asset?.description || shot?.description || "",
                      project.data.shots.findIndex((s) => s.id === shot?.id) +
                        1,
                    ),
                  };
        result = { ...task, status: "success", output };
      } else {
        const provider = loadSettings()[kind];
        if (!provider.apiKey || !provider.baseUrl || !provider.model)
          throw new Error(
            `请先在 API 设置中填写${{ text: "剧本", image: "图片", video: "视频", audio: "配音" }[kind]}配置`,
          );
        submitted = true;
        result = await generate(id, {
          requestId: task.id,
          kind,
          targetId,
          sourceHash: task.sourceHash,
          prompt,
          provider,
          duration: shot?.duration,
          ratio: project.data.ratio,
          voice: shot?.voice,
          acknowledgeDuplicate,
        });
      }
      accepted = result;
      if (result.id !== task.id)
        setRuns((rows) => rows.filter((r) => r.id !== task.id));
      remember(result);
      if (result.status === "error" || result.status === "uncertain") {
        setError(result.output.error || "生成失败");
        return result;
      }
      await apply(result);
      await flush();
      setMessage(
        result.status === "pending" || result.status === "running"
          ? "任务已提交。可在任务列表查询进度，刷新不会重复提交。"
          : "结果已保存，可继续编辑或重新生成。",
      );
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "生成失败";
      if (accepted) remember(accepted);
      else
        remember({
          ...task,
          status:
            submitted &&
            !(
              e instanceof ApiError &&
              [400, 401, 403, 404, 410, 422, 429].includes(e.status)
            )
              ? "uncertain"
              : "error",
          output: { error: msg },
        });
      setError(msg);
      throw e;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  async function batch(kind: Modality, targets: string[]) {
    if (batching || running.current) return;
    setBatching(true);
    stop.current = false;
    let success = 0,
      failed = 0,
      pending = 0,
      uncertain = 0;
    try {
      for (const target of targets) {
        if (stop.current) break;
        try {
          if (kind === "video") {
            const shot = current.current?.data.shots.find(
              (s) => `shot:${s.id}` === target,
            );
            if (!shot?.image) await run("image", target);
          }
          const result = await run(kind, target);
          if (result.status === "success") success++;
          else if (result.status === "error") failed++;
          else if (result.status === "uncertain") uncertain++;
          else pending++;
        } catch {
          failed++;
        }
        setMessage(
          `本批次 ${success + failed + pending + uncertain}/${targets.length} · 成功 ${success} · 失败 ${failed} · 处理中 ${pending} · 待确认 ${uncertain}`,
        );
      }
    } finally {
      setBatching(false);
    }
  }
  async function poll(run: Run) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await pollRun(id, run, loadSettings().video);
      remember(result);
      if (result.status === "error") throw new Error(result.output.error);
      if (result.status === "success") {
        await apply(result);
        await flush();
      } else setMessage("供应商仍在处理中，请稍后再查询。");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  async function recover(run: Run) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const found = await getRun(id, run.id);
      remember(found);
      if (found.status === "success") {
        await apply(found);
        await flush();
      } else
        setMessage(
          found.status === "running"
            ? "原请求仍在处理中，请稍后查询。"
            : "已更新原请求状态。",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    recover,
    runs,
    busy: busy || batching,
    error,
    message,
    run,
    batch,
    poll,
    apply,
    cancelBatch: () => {
      stop.current = true;
      setMessage("将完成当前请求后停止批次。");
    },
  };
}
