"use client";

import { useState } from "react";
import WorkflowStepNav from "./WorkflowStepNav";
import ThemedIcon from "../ThemedIcon";
import {
  createEmptyStoryboard,
  useStoryboards,
  type StoryboardItem,
} from "../../hooks/workflow/useStoryboards";

const voiceOptions = [
  { label: "柔和女声", tags: ["温柔"] },
  { label: "活泼女声", tags: ["活力"] },
  { label: "温润男声", tags: ["温暖"] },
  { label: "低沉男声", tags: ["磁性"] },
  { label: "童声", tags: ["清脆"] },
  { label: "旁白", tags: ["沉稳"] },
];

type WorkflowStoryboardsClientProps = {
  initialStoryboards: StoryboardItem[];
  availableScenes: string[];
  nextHref: string;
  stepId: number;
  projectName?: string;
};

export default function WorkflowStoryboardsClient({
  initialStoryboards,
  availableScenes,
  nextHref,
  stepId,
  projectName,
}: WorkflowStoryboardsClientProps) {
  const [openVoicePanelId, setOpenVoicePanelId] = useState<string | null>(null);
  const {
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
  } = useStoryboards(initialStoryboards, projectName);

  const applyVoice = (shot: StoryboardItem, voiceStyle: string) => {
    if (editingId === shot.id && draft) {
      updateDraft({ voiceStyle });
      return;
    }
    setStoryboards((prev) =>
      prev.map((item) =>
        item.id === shot.id ? { ...item, voiceStyle } : item,
      ),
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-copy items-center">
            一个场景一组分镜，支持批量生成与逐条编辑。
          </p>
          {errorMessage ? (
            <p className="mt-2 text-xs text-red-300/80">{errorMessage}</p>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setStoryboards((prev) => [...prev, createEmptyStoryboard()])
            }
            className="btn-pill btn-pill-muted btn-pill-sm"
          >
            + 添加分镜
          </button>
          <button
            type="button"
            className="btn-pill btn-pill-primary btn-pill-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <img src="/icons/ai-spark.svg" alt="" className="h-3.5 w-3.5" />
              AI 一键生成分镜
            </span>
          </button>
        </div>
      </div>

      {hasStoryboards ? (
        <div className="mt-8 max-h-[calc(100vh_-_200px)] overflow-y-auto pr-2 clean-scrollbar">
          <div className="space-y-4">
            {items.map((shot, index) => (
              <div
                key={shot.id}
                ref={(node) => {
                  if (node) {
                    cardRefs.current.set(shot.id, node);
                  } else {
                    cardRefs.current.delete(shot.id);
                  }
                }}
                className={`rounded-2xl bg-[var(--surface-bg)] p-5 text-[var(--text-primary)] ${dragOverId === shot.id ? "ring-1 ring-white/20" : ""
                  }`}
                onDragOver={handleDragOver(shot.id)}
                onDrop={handleDrop(shot.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="card-title">
                    分镜 {String(index + 1).padStart(2, "0")}
                  </div>
                    {editingId === shot.id && draft ? (
                      <label className="flex items-center gap-2 rounded-full border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-3 py-1 text-xs text-[var(--text-primary)]">
                        <span className="text-[var(--text-tertiary)]">场景</span>
                        <select
                          className="bg-transparent text-xs text-[var(--text-primary)] outline-none"
                          value={draft.scene}
                          onChange={(event) =>
                            updateDraft({ scene: event.target.value })
                          }
                        >
                          <option value="" disabled>
                            请选择
                          </option>
                          {availableScenes.map((scene) => (
                            <option key={scene} value={scene}>
                              {scene}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <span className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-xs text-[var(--text-tertiary)]">
                        场景：{shot.scene || "未选择"}
                      </span>
                    )}
                  </div>
                <div className="flex items-center gap-2">
                  {editingId === shot.id && draft ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCloseDrawer}
                          className="btn-pill btn-pill-muted btn-pill-xs"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="btn-pill btn-pill-secondary btn-pill-xs"
                        >
                          保存
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-pill btn-pill-muted btn-pill-xs"
                        onClick={() => handleEdit(shot)}
                      >
                        编辑
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => handleDelete(shot.id)}
                    aria-label="删除分镜"
                    className="btn-icon-sm border border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                  >
                    <ThemedIcon name="trash" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    draggable
                    onDragStart={handleDragStart(shot.id)}
                    onDragEnd={handleDragEnd}
                    className="btn-icon-sm cursor-grab border border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)] active:cursor-grabbing"
                    aria-label="拖动排序"
                  >
                    <ThemedIcon name="drag-handle" className="h-3.5 w-3.5" />
                  </button>
                </div>
                </div>
                {errorId === shot.id ? (
                  <div className="mt-2 text-xs text-red-300/80">
                    请补全该分镜的必填内容。
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2 text-xs text-[var(--text-tertiary)]">
                      <div className="rounded-xl bg-[var(--surface-bg)] px-3 py-2">
                        角色：
                        {editingId === shot.id && draft ? (
                          <div className="ml-2 inline-flex flex-wrap items-center gap-2">
                            {draft.characters.length ? (
                              draft.characters.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center gap-1 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-0.5 text-xs text-[var(--text-primary)]"
                                >
                                  {role}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraft({
                                        characters: draft.characters.filter(
                                          (item) => item !== role,
                                        ),
                                      })
                                    }
                                    className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                    aria-label={`移除${role}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[var(--text-tertiary)]">
                                未选择
                              </span>
                            )}
                            <select
                              className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                              value={roleToAdd}
                              onChange={(event) => setRoleToAdd(event.target.value)}
                            >
                              <option value="">选择角色</option>
                              {roleOptions
                                .filter((role) => !draft.characters.includes(role))
                                .map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={addRole}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] text-xs text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                              aria-label="添加角色"
                            >
                              +
                            </button>
                          </div>
                        ) : shot.characters.length ? (
                          shot.characters.join("、")
                        ) : (
                          "未选择"
                        )}
                      </div>
                      <div className="rounded-xl bg-[var(--surface-bg)] px-3 py-2">
                        道具：
                        {editingId === shot.id && draft ? (
                          <div className="ml-2 inline-flex flex-wrap items-center gap-2">
                            {draft.props.length ? (
                              draft.props.map((prop) => (
                                <span
                                  key={prop}
                                  className="inline-flex items-center gap-1 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-0.5 text-xs text-[var(--text-primary)]"
                                >
                                  {prop}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraft({
                                        props: draft.props.filter(
                                          (item) => item !== prop,
                                        ),
                                      })
                                    }
                                    className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                    aria-label={`移除${prop}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[var(--text-tertiary)]">
                                未选择
                              </span>
                            )}
                            <select
                              className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                              value={propToAdd}
                              onChange={(event) => setPropToAdd(event.target.value)}
                            >
                              <option value="">选择道具</option>
                              {propOptions
                                .filter((prop) => !draft.props.includes(prop))
                                .map((prop) => (
                                  <option key={prop} value={prop}>
                                    {prop}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={addProp}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] text-xs text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                              aria-label="添加道具"
                            >
                              +
                            </button>
                          </div>
                        ) : shot.props.length ? (
                          shot.props.join("、")
                        ) : (
                          "未选择"
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--surface-bg)] p-3 min-h-[140px]">
                      <div className="text-xs text-[var(--text-tertiary)]">画面描述</div>
                      {editingId === shot.id && draft ? (
                        <textarea
                          value={draft.description}
                          onChange={(event) =>
                            updateDraft({ description: event.target.value })
                          }
                          rows={4}
                          className="mt-2 w-full resize-none rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                        />
                      ) : (
                        <div className="mt-2 text-sm text-[var(--text-primary)]">
                          {shot.description}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-[var(--surface-bg)] p-2">
                      <div className="text-xs text-[var(--text-tertiary)]">台词</div>
                      {editingId === shot.id && draft ? (
                        <>
                          <textarea
                            value={draft.dialogue}
                            onChange={(event) =>
                              updateDraft({ dialogue: event.target.value })
                            }
                            rows={3}
                            className="mt-2 w-full resize-none rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                          />
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                预估时长
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={draft.duration}
                                onChange={(event) =>
                                  updateDraft({ duration: Number(event.target.value) })
                                }
                                className="h-8 w-28 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 text-xs text-[var(--text-primary)] outline-none"
                                placeholder="由台词决定"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                角色
                              </span>
                              <select
                                className="h-8 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 text-xs text-[var(--text-primary)] outline-none"
                                value={draft.speaker}
                                onChange={(event) =>
                                  updateDraft({ speaker: event.target.value })
                                }
                              >
                                <option value="待选择">请选择</option>
                                {roleOptions.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                音色
                              </span>
                              <select
                                className="h-8 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 text-xs text-[var(--text-primary)] outline-none"
                                value={draft.voiceStyle}
                                onChange={(event) =>
                                  updateDraft({ voiceStyle: event.target.value })
                                }
                              >
                                {voiceOptions.map((voice) => (
                                  <option key={voice.label} value={voice.label}>
                                    {voice.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mt-2 text-sm text-[var(--text-primary)]">
                            “{shot.dialogue}”
                          </div>
                          <div className="mt-3 flex justify-end">
                            <div className="relative flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(shot)}
                                className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-xs text-[var(--text-tertiary)] transition hover:bg-[var(--surface-bg-hover)]"
                              >
                                角色：{shot.speaker}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenVoicePanelId((prev) =>
                                    prev === shot.id ? null : shot.id,
                                  )
                                }
                                className="rounded-full border border-[#5459ff]/50 bg-[#5459ff]/15 px-3 py-1 text-xs text-[#8f94ff] transition hover:bg-[#5459ff]/20"
                              >
                                🎤 {shot.voiceStyle || "选择音色"}
                              </button>

                              {openVoicePanelId === shot.id ? (
                                <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-52 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg-active)] p-2 shadow-2xl">
                                  <div className="px-2 pb-1 text-[11px] text-[var(--text-tertiary)]">
                                    角色音色
                                  </div>
                                  <div className="space-y-1">
                                    {voiceOptions.map((voice) => {
                                      const active = shot.voiceStyle === voice.label;
                                      return (
                                        <button
                                          key={voice.label}
                                          type="button"
                                          onClick={() => {
                                            applyVoice(shot, voice.label);
                                            setOpenVoicePanelId(null);
                                          }}
                                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${active
                                            ? "bg-[#5459ff]/20 text-[#9ea2ff]"
                                            : "text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
                                            }`}
                                        >
                                          <span className="inline-flex items-center gap-1.5">
                                            <span>🔊</span>
                                            <span>{voice.label}</span>
                                            <span className="rounded-full bg-[var(--surface-bg-hover)] px-1.5 py-[1px] text-[10px] text-[var(--text-tertiary)]">
                                              {voice.tags.join(" / ")}
                                            </span>
                                          </span>
                                          {active ? (
                                            <span className="text-[#9ea2ff]">✓</span>
                                          ) : (
                                            <span className="text-[var(--text-tertiary)]">›</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {editingId === shot.id && draft ? null : (
                        <>
                          <span className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-[var(--text-tertiary)]">
                            预估时长：{shot.duration}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl">
                    <div className="text-[11px] text-[var(--text-tertiary)]">分镜场景图</div>
                    <div className="mt-2 rounded-lg bg-[var(--surface-bg)] p-1.5">
                      <div className="group relative flex aspect-video w-full items-center justify-center rounded-md bg-[var(--surface-bg)]">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-3 py-1 text-[10px] text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                          >
                            从场景选择
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-3 py-1 text-[10px] text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                          >
                            从本地上传
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {editingId === shot.id && draft ? (
                  <div className="mt-4 grid gap-3 text-xs text-[var(--text-primary)]">
                    <label className="flex flex-col gap-2">
                      <span className="text-[var(--text-tertiary)]">使用道具（逗号分隔）</span>
                      <input
                        value={draft.props.join("、")}
                        onChange={(event) =>
                          updateDraft({
                            props: event.target.value
                              .split(/[,，、]/g)
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }
                        className="h-9 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 text-xs text-[var(--text-primary)] outline-none"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-[var(--surface-bg)] p-5 text-sm text-[var(--text-tertiary)]">
          暂无分镜，请点击右上角“添加分镜”或“AI 生成分镜”。
        </div>
      )}

      <WorkflowStepNav
        nextHref={nextHref}
        nextLabel="生成视频"
        onNext={handleNext}
        stepId={stepId}
        projectName={projectName}
      />
    </>
  );
}
