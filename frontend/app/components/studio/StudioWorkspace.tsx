"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  Clapperboard,
  Download,
  FileText,
  Film,
  History,
  LoaderCircle,
  Mic,
  Play,
  RefreshCw,
  Settings2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useStudio } from "../../lib/studio/useStudio";
import { useGeneration } from "../../lib/studio/useGeneration";
import { readiness, SAMPLE_SCRIPT } from "../../lib/studio/planning";
import { download, renderMovie, subtitles } from "../../lib/studio/media";
import { useAuthContext } from "../../context/AuthContext";
import { useHydrated } from "../../hooks/useHydrated";
import ThemeToggleIcon from "../ThemeToggleIcon";
import { Action, Confirm, Confirmation, Empty, Notice } from "./Controls";
import AssetPanel from "./AssetPanel";
import ShotPanel from "./ShotPanel";
import { isDemo } from "../../lib/studio/repository";
import { Shot } from "../../lib/studio/types";
import {
  lastStudioStep,
  rememberStudioStep,
  studioSteps,
} from "../../lib/studio/navigation";

const steps = [
  {
    title: "故事剧本",
    short: "剧本",
    icon: BookOpen,
    description: "粘贴或编写剧本，拆解为角色、场景、道具和分镜。",
  },
  {
    title: "角色与资产",
    short: "资产",
    icon: Boxes,
    description: "上传或生成参考图，确认后供分镜引用。",
  },
  {
    title: "分镜工作台",
    short: "分镜",
    icon: Clapperboard,
    description: "编辑画面、台词、时长与引用资产，逐镜生成图片。",
  },
  {
    title: "视频片段",
    short: "视频",
    icon: Film,
    description: "按分镜生成视频，支持单独重做和批量补全。",
  },
  {
    title: "配音与对白",
    short: "配音",
    icon: Mic,
    description: "选择音色并生成对白，或将镜头设为静音。",
  },
  {
    title: "预览与导出",
    short: "导出",
    icon: Download,
    description: "检查片段与配音，合成预览并下载视频、字幕。",
  },
];

export default function StudioWorkspace({
  id,
  initialStep,
}: {
  id: string;
  initialStep?: number;
}) {
  const hydrated = useHydrated(),
    { isLoggedIn, openLogin, user } = useAuthContext();
  if (!hydrated)
    return (
      <div className="studio-loading app-surface">
        <LoaderCircle className="studio-spin" />
        正在打开工作台…
      </div>
    );
  if (!isDemo(id) && !isLoggedIn)
    return (
      <main className="studio-page app-surface">
        <Empty
          title="登录后继续这个项目"
          action={
            <Action primary onClick={openLogin}>
              登录账号
            </Action>
          }
        >
          账号项目仅对创建者开放。也可以返回项目库创建本地演示。
        </Empty>
        <Link href="/projects" className="studio-button">
          返回我的项目
        </Link>
      </main>
    );
  return <Workspace key={`${id}:${user}`} id={id} initialStep={initialStep} />;
}
function Workspace({ id, initialStep }: { id: string; initialStep?: number }) {
  const router = useRouter(),
    {
      project,
      current,
      error,
      saveState,
      edit,
      editData,
      flush,
      discardDraft,
    } = useStudio(id),
    generation = useGeneration(id, current, editData, flush);
  const [step, setStep] = useState(
      () => initialStep ?? lastStudioStep(id) ?? 0,
    ),
    [notice, setNotice] = useState(""),
    [confirm, setConfirm] = useState<Confirmation | null>(null),
    [history, setHistory] = useState(false),
    [rendering, setRendering] = useState(false),
    [progress, setProgress] = useState(0),
    [movie, setMovie] = useState<{
      url: string;
      blob: Blob;
      extension: string;
      signature: string;
    } | null>(null);
  const abort = useRef<AbortController | null>(null),
    movieURL = useRef("");
  const loadedId = project?.id;
  useEffect(
    () => () => {
      abort.current?.abort();
      if (movieURL.current) URL.revokeObjectURL(movieURL.current);
    },
    [],
  );
  useEffect(() => {
    if (!loadedId) return;
    rememberStudioStep(id, step);
    const url = new URL(window.location.href);
    url.searchParams.set("step", studioSteps[step].key);
    window.history.replaceState(null, "", url);
  }, [id, step, loadedId]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (generation.busy || rendering) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [generation.busy, rendering]);
  if (!project)
    return (
      <main className="studio-page app-surface">
        {error ? (
          <Empty
            title="项目暂时无法打开"
            action={
              <Link className="studio-button" href="/projects">
                返回项目库
              </Link>
            }
          >
            {error}
          </Empty>
        ) : (
          <div className="studio-loading">
            <LoaderCircle className="studio-spin" />
            正在读取项目…
          </div>
        )}
      </main>
    );
  const data = project.data,
    demo = project.mode === "demo",
    ready = readiness(data),
    locked = generation.busy || rendering,
    stage = steps[step],
    signature = JSON.stringify(data),
    fresh = movie?.signature === signature,
    total = data.shots.reduce((n, s) => n + s.duration, 0);
  const run = (kind: "text" | "image" | "video" | "audio", target: string) => {
    void generation.run(kind, target).catch(() => {});
  };
  const stageStatus = [
    `${data.script.length.toLocaleString()} 字`,
    `${data.assets.filter((asset) => asset.confirmed).length} / ${data.assets.length} 已确认`,
    `${data.shots.length} 个镜头 · ${total} 秒`,
    `${data.shots.filter((shot) => shot.video).length} / ${data.shots.length} 已生成`,
    `${data.shots.filter((shot) => shot.muted || !shot.dialogue.trim() || shot.audio).length} / ${data.shots.length} 已就绪`,
    `${data.shots.length} 个镜头 · ${total} 秒`,
  ][step];
  const pending = {
    assets: data.assets
      .filter((asset) => !asset.image)
      .map((asset) => `asset:${asset.id}`),
    images: data.shots
      .filter((shot) => !shot.image)
      .map((shot) => `shot:${shot.id}`),
    videos: data.shots
      .filter((shot) => !shot.video)
      .map((shot) => `shot:${shot.id}`),
    audio: data.shots
      .filter((shot) => shot.dialogue.trim() && !shot.muted && !shot.audio)
      .map((shot) => `shot:${shot.id}`),
  };
  function plan() {
    const action = () => {
      run("text", "script");
    };
    if (data.assets.length || data.shots.length)
      setConfirm({
        title: "重新拆解故事？",
        description: "会替换现有资产与分镜，包括生成结果。建议先导出项目备份。",
        action,
      });
    else action();
  }
  function backup() {
    download(
      new Blob(
        [
          JSON.stringify(
            {
              format: "videogaga-project-v1",
              name: project!.name,
              data: current.current!.data,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      `${project!.name}.json`,
    );
  }
  async function exportVideo() {
    setRendering(true);
    setNotice("");
    setProgress(0);
    abort.current = new AbortController();
    try {
      await flush();
      const result = await renderMovie(
        current.current!.data,
        demo,
        setProgress,
        abort.current.signal,
      );
      if (movieURL.current) URL.revokeObjectURL(movieURL.current);
      const url = URL.createObjectURL(result.blob);
      movieURL.current = url;
      setMovie({
        ...result,
        url,
        signature: JSON.stringify(current.current!.data),
      });
    } catch (e) {
      setNotice(
        (e as Error).name === "AbortError"
          ? "导出已取消，编辑内容已保留。"
          : (e as Error).message,
      );
    } finally {
      setRendering(false);
    }
  }
  async function leave() {
    try {
      await flush();
      router.push("/projects");
    } catch {
      setNotice("当前修改尚未保存，请重试保存或先导出项目备份。");
    }
  }
  function patchShot(id: string, change: Partial<Shot>) {
    editData((d) => ({
      ...d,
      shots: d.shots.map((s) => (s.id === id ? { ...s, ...change } : s)),
    }));
  }
  const goNext = () => setStep((s) => Math.min(5, s + 1));
  return (
    <main className="studio-workspace app-surface">
      <header className="studio-header">
        <button
          aria-label="返回项目库"
          className="studio-icon-button"
          disabled={locked}
          onClick={() => void leave()}
        >
          <ArrowLeft size={19} />
        </button>
        <Link
          href="/projects"
          className="studio-wordmark"
          onClick={(e) => {
            e.preventDefault();
            if (!locked) void leave();
          }}
        >
          Video<span>Gaga</span>
        </Link>
        <ChevronRight size={15} className="studio-header-chevron" />
        <input
          aria-label="项目名称"
          className="studio-project-name"
          value={project.name}
          maxLength={255}
          disabled={locked}
          onChange={(e) => edit((p) => ({ ...p, name: e.target.value }))}
        />
        <span
          className={`studio-save-state ${saveState === "error" ? "error" : ""}`}
        >
          {saveState === "saving" ? (
            <LoaderCircle size={13} className="studio-spin" />
          ) : saveState === "saved" ? (
            <Check size={13} />
          ) : null}
          {
            {
              saved: "已保存",
              dirty: "待保存",
              saving: "保存中",
              error: "保存失败",
              loading: "载入中",
            }[saveState]
          }
        </span>
        <span className="studio-spacer" />
        <span className={`studio-tag ${demo ? "demo" : ""}`}>
          {demo ? "本地演示" : "账号项目"}
        </span>
        <button
          className="studio-icon-button"
          aria-label="生成任务"
          onClick={() => setHistory((h) => !h)}
        >
          <History size={17} />
        </button>
        <ThemeToggleIcon />
        <Link
          className="studio-icon-button"
          href="/settings"
          target="_blank"
          aria-label="API 设置"
        >
          <Settings2 size={18} />
        </Link>
        <Link
          className="studio-avatar"
          href="/account"
          target="_blank"
          aria-label="账号管理"
        >
          G
        </Link>
      </header>
      <div className="studio-workspace-body">
        <aside className="studio-sidebar">
          <div>
            <p className="studio-eyebrow">创作流程</p>
            <nav aria-label="创作步骤">
              {steps.map((s, i) => (
                <button
                  key={s.title}
                  aria-label={s.title}
                  title={s.title}
                  className={i === step ? "active" : ""}
                  aria-current={i === step ? "step" : undefined}
                  onClick={() => setStep(i)}
                >
                  <span className="studio-step-icon">
                    {i < 5 && ready[i] ? (
                      <Check size={18} />
                    ) : (
                      <s.icon size={18} />
                    )}
                  </span>
                  <span>{s.title}</span>
                  <span className="studio-step-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </nav>
          </div>
          <div className="studio-sidebar-bottom">
            <div className="studio-progress-caption">
              <span>准备进度</span>
              <strong>{ready.filter(Boolean).length}/5</strong>
            </div>
            <div className="studio-progress-track">
              <span
                style={{ width: `${ready.filter(Boolean).length * 20}%` }}
              />
            </div>
            <button
              onClick={() => setHistory((h) => !h)}
              className="studio-button"
            >
              <History size={16} />
              生成任务
              {generation.runs.length > 0 && (
                <span>{generation.runs.length}</span>
              )}
            </button>
            <p>
              {demo ? "所有演示内容都留在此浏览器。" : "项目保存在你的账号下。"}
            </p>
          </div>
        </aside>
        <section className="studio-main">
          <div className="studio-stage-heading">
            <div>
              <div className="studio-stage-title">
                <h1>{stage.title}</h1>
                <span className="studio-tag">{stageStatus}</span>
              </div>
              <p>{stage.description}</p>
            </div>
            <div className="studio-toolbar">
              {step === 0 ? (
                <Action
                  primary
                  disabled={locked || !data.script.trim()}
                  onClick={plan}
                >
                  <WandSparkles size={16} />
                  {demo ? "演示拆解" : "拆解故事"}
                </Action>
              ) : step === 1 ? (
                <Action
                  primary
                  disabled={locked || !pending.assets.length}
                  title="仅生成缺少图片的资产"
                  onClick={() => void generation.batch("image", pending.assets)}
                >
                  <WandSparkles size={16} />
                  生成图片（{pending.assets.length}）
                </Action>
              ) : step === 2 ? (
                <Action
                  primary
                  disabled={locked || !pending.images.length}
                  title="仅生成缺少图片的分镜"
                  onClick={() => void generation.batch("image", pending.images)}
                >
                  <WandSparkles size={16} />
                  生成分镜图（{pending.images.length}）
                </Action>
              ) : step === 3 ? (
                <Action
                  primary
                  disabled={locked || !ready[2] || !pending.videos.length}
                  title="仅生成缺少视频的镜头"
                  onClick={() => void generation.batch("video", pending.videos)}
                >
                  <Play size={16} />
                  生成视频（{pending.videos.length}）
                </Action>
              ) : step === 4 ? (
                <Action
                  primary
                  disabled={locked || !pending.audio.length}
                  title="仅为未静音且缺少配音的对白生成音频"
                  onClick={() => void generation.batch("audio", pending.audio)}
                >
                  <Mic size={16} />
                  生成配音（{pending.audio.length}）
                </Action>
              ) : (
                <Action onClick={backup}>
                  <FileText size={16} />
                  项目备份
                </Action>
              )}
            </div>
          </div>
          <div className="studio-stage-content" key={step}>
            {demo && (
              <div className="studio-demo-note">
                <Sparkles size={14} />
                演示模式 · 使用示意画面 / 参考资产拼板与提示音，不消耗 API
                额度。
              </div>
            )}
            {(error || notice || generation.error) && (
              <Notice error>
                {error || notice || generation.error}
                {saveState === "error" && (
                  <>
                    <button
                      className="studio-inline-action"
                      onClick={() => void flush().catch(() => {})}
                    >
                      重试保存
                    </button>
                    <button
                      className="studio-inline-action"
                      onClick={() =>
                        setConfirm({
                          title: "放弃未保存的草稿？",
                          description:
                            "将重新载入已保存版本。建议先导出项目备份。",
                          action: () => {
                            void discardDraft().catch((e) =>
                              setNotice(e.message),
                            );
                          },
                        })
                      }
                    >
                      放弃草稿
                    </button>
                  </>
                )}
              </Notice>
            )}
            {generation.message && <Notice>{generation.message}</Notice>}
            {generation.busy && (
              <Notice>
                <LoaderCircle size={14} className="studio-spin" />
                正在处理任务。
                <button
                  className="studio-inline-action"
                  onClick={generation.cancelBatch}
                >
                  完成当前项后停止
                </button>
              </Notice>
            )}
            {step === 0 && (
              <div className="studio-script-layout">
                <section className="studio-panel studio-script-editor">
                  <div className="studio-panel-title">
                    <h2>剧本正文</h2>
                    <span className="studio-helper">
                      {data.script.length.toLocaleString()} / 50,000 字
                    </span>
                  </div>
                  <textarea
                    aria-label="故事剧本"
                    value={data.script}
                    maxLength={50000}
                    disabled={locked}
                    placeholder="一个深夜，一封寄错地址的信，让两个陌生人的命运发生了交集……"
                    onChange={(e) =>
                      editData((d) => ({ ...d, script: e.target.value }))
                    }
                  />
                  <div className="studio-script-footer">
                    <span>
                      修改故事后，可重新拆解；原分镜会保留到你确认替换。
                    </span>
                    <Action
                      disabled={locked || !!data.script.trim()}
                      onClick={() =>
                        editData((d) => ({ ...d, script: SAMPLE_SCRIPT }))
                      }
                    >
                      填入示例故事
                    </Action>
                  </div>
                </section>
                <aside className="studio-script-notes">
                  <section className="studio-panel">
                    <span className="studio-note-icon">
                      <BookOpen size={22} />
                    </span>
                    <h2>剧本格式建议</h2>
                    <p>每段描述一个场景，写明出场角色、动作和环境。</p>
                    <p>
                      分段写场景，用「角色：台词」记录对白，拆解后仍然可以逐项修改。
                    </p>
                  </section>
                  <section className="studio-panel">
                    <h2>画面比例</h2>
                    <div className="studio-ratios">
                      {(["16:9", "9:16", "1:1"] as const).map((r) => (
                        <button
                          key={r}
                          disabled={locked}
                          aria-pressed={data.ratio === r}
                          onClick={() => {
                            if (r !== data.ratio)
                              editData((d) => ({
                                ...d,
                                ratio: r,
                                shots: d.shots.map((s) => ({
                                  ...s,
                                  image: "",
                                  video: "",
                                })),
                              }));
                          }}
                        >
                          <span style={{ aspectRatio: r.replace(":", "/") }} />
                          {r}
                        </button>
                      ))}
                    </div>
                    <p className="studio-helper">
                      切换比例会清除已有分镜画面和视频。
                    </p>
                  </section>
                </aside>
              </div>
            )}
            {step === 1 && (
              <AssetPanel
                data={data}
                edit={editData}
                disabled={locked}
                generate={(id) => run("image", `asset:${id}`)}
                onError={setNotice}
                remove={(assetId) =>
                  setConfirm({
                    title: "删除这个资产？",
                    description:
                      "同时移除分镜中的关联，并使引用它的旧画面失效。",
                    action: () =>
                      editData((d) => ({
                        ...d,
                        assets: d.assets.filter((a) => a.id !== assetId),
                        shots: d.shots.map((s) =>
                          s.assetIds.includes(assetId)
                            ? {
                                ...s,
                                assetIds: s.assetIds.filter(
                                  (a) => a !== assetId,
                                ),
                                image: "",
                                video: "",
                              }
                            : s,
                        ),
                      })),
                  })
                }
              />
            )}
            {step === 2 && (
              <ShotPanel
                data={data}
                edit={editData}
                disabled={locked}
                generate={(id) => run("image", `shot:${id}`)}
                remove={(shotId) =>
                  setConfirm({
                    title: "删除这个镜头？",
                    description: "镜头及其图片、视频、配音引用都会移除。",
                    action: () =>
                      editData((d) => ({
                        ...d,
                        shots: d.shots.filter((s) => s.id !== shotId),
                      })),
                  })
                }
              />
            )}
            {(step === 3 || step === 4) &&
              (data.shots.length ? (
                <div className="studio-render-grid">
                  {data.shots.map((shot, i) => (
                    <article key={shot.id} className="studio-render-card">
                      <div className="studio-render-preview">
                        {step === 3 &&
                        shot.video &&
                        shot.video !== "demo:motion" ? (
                          <video
                            src={shot.video}
                            controls
                            preload="metadata"
                            playsInline
                          />
                        ) : shot.image ? (
                          <img
                            src={shot.image}
                            alt={shot.title}
                            className={
                              shot.video === "demo:motion"
                                ? "studio-demo-motion"
                                : ""
                            }
                          />
                        ) : (
                          <Clapperboard size={30} />
                        )}
                        <span className="studio-duration">
                          {shot.duration}s
                        </span>
                      </div>
                      <div className="studio-render-content">
                        <div className="studio-panel-title">
                          <h2>
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            {shot.title}
                          </h2>
                          <span className="studio-tag">
                            {step === 3
                              ? shot.video
                                ? "已有结果"
                                : "待生成"
                              : shot.muted
                                ? "静音"
                                : shot.audio
                                  ? "已有配音"
                                  : !shot.dialogue.trim()
                                    ? "无对白"
                                    : "待生成"}
                          </span>
                        </div>
                        {step === 3 ? (
                          <>
                            <p>{shot.description}</p>
                            <Action
                              disabled={locked || !shot.description.trim()}
                              onClick={() =>
                                void generation.batch("video", [
                                  `shot:${shot.id}`,
                                ])
                              }
                            >
                              <RefreshCw size={15} />
                              {shot.video ? "重新生成" : "生成这个镜头"}
                            </Action>
                          </>
                        ) : (
                          <>
                            <label>
                              旁白 / 对白
                              <textarea
                                rows={2}
                                value={shot.dialogue}
                                disabled={locked}
                                maxLength={5000}
                                onChange={(e) =>
                                  patchShot(shot.id, {
                                    dialogue: e.target.value,
                                    audio: "",
                                  })
                                }
                              />
                            </label>
                            <div className="studio-form-row">
                              <label>
                                音色 ID
                                <input
                                  value={shot.voice}
                                  disabled={locked}
                                  maxLength={100}
                                  onChange={(e) =>
                                    patchShot(shot.id, {
                                      voice: e.target.value,
                                      audio: "",
                                    })
                                  }
                                />
                              </label>
                              <label className="studio-check">
                                <input
                                  type="checkbox"
                                  checked={shot.muted}
                                  disabled={locked}
                                  onChange={(e) =>
                                    patchShot(shot.id, {
                                      muted: e.target.checked,
                                    })
                                  }
                                />
                                静音
                              </label>
                            </div>
                            {shot.audio && (
                              <audio
                                controls
                                src={shot.audio}
                                preload="metadata"
                              />
                            )}
                            <Action
                              disabled={
                                locked || !shot.dialogue.trim() || shot.muted
                              }
                              onClick={() => run("audio", `shot:${shot.id}`)}
                            >
                              <Mic size={15} />
                              {shot.audio ? "重新生成配音" : "生成配音"}
                            </Action>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  title="先写好你的镜头"
                  action={
                    <Action onClick={() => setStep(2)}>前往分镜工作台</Action>
                  }
                >
                  完成分镜后，就可以逐镜生成视频和配音。
                </Empty>
              ))}
            {step === 5 && (
              <>
                <div className="studio-export-layout">
                  <section className="studio-export-player">
                    {movie ? (
                      <video
                        key={movie.url}
                        src={movie.url}
                        controls
                        playsInline
                      />
                    ) : (
                      <div>
                        <Film size={48} />
                        <h2>成片预览</h2>
                        <p>补齐视频与配音后，点击「生成成片预览」。</p>
                      </div>
                    )}
                  </section>
                  <section className="studio-panel studio-export-options">
                    <span className="studio-tag">
                      {data.ratio} · {demo ? "演示成片" : "当前版本"}
                    </span>
                    <h2>导出设置</h2>
                    <div className="studio-stat-pair">
                      <span>
                        <strong>{data.shots.length}</strong>镜头
                      </span>
                      <span>
                        <strong>{total}</strong>秒
                      </span>
                    </div>
                    <ul className="studio-export-checks">
                      <li className={ready[3] ? "ready" : ""}>
                        <Check size={15} />
                        {data.shots.filter((s) => s.video).length}/
                        {data.shots.length} 视频片段
                      </li>
                      <li className={ready[4] ? "ready" : ""}>
                        <Check size={15} />
                        配音或静音确认
                      </li>
                    </ul>
                    {movie && !fresh && (
                      <p className="studio-helper">
                        项目已修改，请重新生成预览后下载。
                      </p>
                    )}
                    <Action
                      primary
                      disabled={locked || !ready[3] || !ready[4]}
                      onClick={() => void exportVideo()}
                    >
                      <Play size={16} />
                      {movie ? "重新生成预览" : "生成成片预览"}
                    </Action>
                    {rendering && (
                      <>
                        <progress
                          aria-label="导出进度"
                          value={progress}
                          max={100}
                        />
                        <p className="studio-helper">
                          {progress}% · 请保持此标签页可见
                        </p>
                        <Action onClick={() => abort.current?.abort()}>
                          取消导出
                        </Action>
                      </>
                    )}
                    {movie && (
                      <Action
                        disabled={!fresh || rendering}
                        onClick={() =>
                          download(
                            movie.blob,
                            `${project.name}.${movie.extension}`,
                          )
                        }
                      >
                        <Download size={16} />
                        下载视频
                      </Action>
                    )}
                    <Action
                      disabled={!data.shots.length}
                      onClick={() =>
                        download(
                          new Blob([subtitles(data.shots)], {
                            type: "text/plain;charset=utf-8",
                          }),
                          `${project.name}.srt`,
                        )
                      }
                    >
                      下载 SRT 字幕
                    </Action>
                    <p className="studio-helper">
                      片段按设定时长裁切，较短片段停留在尾帧。配音按镜头时长裁切。导出格式由浏览器支持决定。
                    </p>
                  </section>
                </div>
                <div className="studio-timeline">
                  <div className="studio-panel-title">
                    <h2>成片时间线</h2>
                    <span>{total} 秒</span>
                  </div>
                  <div className="studio-timeline-track">
                    {data.shots.map((s, i) => (
                      <div key={s.id} style={{ flexGrow: s.duration }}>
                        {s.image && <img src={s.image} alt="" />}
                        <span>
                          {String(i + 1).padStart(2, "0")} · {s.duration}s
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="studio-timeline-audio">
                    {data.shots.map((s) => (
                      <div
                        key={s.id}
                        style={{ flexGrow: s.duration }}
                        className={s.audio && !s.muted ? "has-audio" : ""}
                      >
                        {s.muted ? "静音" : s.dialogue || "无对白"}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <footer className="studio-stage-footer">
            <span>
              {data.assets.length} 项资产 <span>·</span> {data.shots.length}{" "}
              个镜头 <span>·</span> {total} 秒
            </span>
            <div className="studio-toolbar">
              {step > 0 && (
                <Action onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft size={15} />
                  上一步
                </Action>
              )}
              {step < 5 && (
                <Action primary onClick={goNext}>
                  前往{steps[step + 1].short}
                  <ArrowRight size={15} />
                </Action>
              )}
            </div>
          </footer>
        </section>
        {history && (
          <aside className="studio-task-drawer">
            <div className="studio-panel-title">
              <h2>生成任务</h2>
              <Action onClick={() => setHistory(false)}>关闭</Action>
            </div>
            <p className="studio-helper">
              请求中断后请先查询结果，避免重复提交。
            </p>
            {generation.runs.length === 0 ? (
              <p className="studio-helper">还没有任务。</p>
            ) : (
              generation.runs.map((run) => (
                <article key={run.id}>
                  <div className="studio-panel-title">
                    <strong>
                      {
                        {
                          text: "剧本拆解",
                          image: "图片生成",
                          video: "视频生成",
                          audio: "配音生成",
                        }[run.kind]
                      }
                    </strong>
                    <span className="studio-tag">
                      {
                        {
                          running: "处理中",
                          pending: "等待供应商",
                          success: "成功",
                          error: "失败",
                          uncertain: "结果待确认",
                        }[run.status]
                      }
                    </span>
                  </div>
                  <small>
                    {new Date(run.createdAt).toLocaleTimeString("zh-CN")}
                  </small>
                  {run.output.error && <p>{run.output.error}</p>}
                  {run.status === "pending" && (
                    <Action
                      disabled={locked}
                      onClick={() => void generation.poll(run)}
                    >
                      查询并应用结果
                    </Action>
                  )}
                  {(run.status === "running" || run.status === "uncertain") && (
                    <Action
                      disabled={locked}
                      onClick={() => void generation.recover(run)}
                    >
                      查询原请求
                    </Action>
                  )}
                  {run.status === "uncertain" && (
                    <>
                      <p>
                        请先在供应商确认是否已经生成或扣费，再决定是否重新提交。
                      </p>
                      <Action
                        disabled={locked}
                        onClick={() =>
                          setConfirm({
                            title: "确认重新提交生成？",
                            description:
                              "原请求可能已在供应商执行或扣费。只有确认需要新任务时才继续，本次将使用新的请求标识。",
                            action: () =>
                              generation
                                .run(run.kind, run.targetId, true)
                                .then(() => {})
                                .catch(() => {}),
                          })
                        }
                      >
                        核对后重新提交
                      </Action>
                    </>
                  )}
                  {run.status === "error" && (
                    <Action
                      disabled={locked}
                      onClick={() =>
                        run.kind === "text"
                          ? plan()
                          : void generation.batch(run.kind, [run.targetId])
                      }
                    >
                      重试
                    </Action>
                  )}
                  {run.status === "success" && (
                    <Action
                      disabled={locked}
                      onClick={() =>
                        setConfirm({
                          title: "应用这次生成结果？",
                          description:
                            "这会覆盖对应资产或分镜的当前结果；剧本任务会替换整个资产与分镜计划。",
                          action: async () => {
                            try {
                              await generation.apply(run);
                              await flush();
                            } catch (e) {
                              setNotice((e as Error).message);
                            }
                          },
                        })
                      }
                    >
                      重新应用结果
                    </Action>
                  )}
                </article>
              ))
            )}
          </aside>
        )}
      </div>
      <Confirm value={confirm} close={() => setConfirm(null)} />
    </main>
  );
}
