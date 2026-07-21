"use client";

import WorkflowStepNav from "./WorkflowStepNav";
import ThemedIcon from "../ThemedIcon";
import { assetTabs, useAssets } from "../../hooks/workflow/useAssets";

type WorkflowAssetsClientProps = {
  nextHref?: string;
  stepId?: number;
  projectName?: string;
  projectId?: string;
};

export default function WorkflowAssetsClient({
  nextHref,
  stepId,
  projectName,
  projectId,
}: WorkflowAssetsClientProps) {
  const {
    activeTab,
    setActiveTab,
    cards,
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
  } = useAssets(projectId, projectName);

  const emptyStateCopy =
    activeTab === "scene"
      ? "还没有场景结果。请先回到上一步确认参数，并点击“开始生成”，生成完成后这里会自动出现场景。"
      : activeTab === "character"
        ? "还没有角色结果。完成故事设定并开始生成后，系统会自动拆出角色信息。"
        : "还没有道具结果。完成故事设定并开始生成后，系统会自动拆出道具信息。";

  const pickImageAndUpload = async (
    uploadFn: (file: File) => Promise<void>,
  ) => {
    if (typeof window === "undefined") {
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      await uploadFn(file);
    };
    input.click();
  };

  return (
    <div className="mt-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-1 text-sm text-[var(--text-primary)]">
            {assetTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn-segment btn-segment-sm ${
                  activeTab === tab.id
                    ? "bg-[rgb(var(--brand-rgb))] text-[#fff] shadow-none"
                    : "text-[var(--text-primary)] hover:bg-[var(--surface-bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="section-note max-w-xl">
            {activeTab === "scene"
              ? "默认推荐先用 AI 批量生成场景结果；需要补充时再手动添加单个场景。"
              : activeTab === "character"
                ? "角色信息优先由故事内容自动拆分，只有缺失时再手动补充。"
                : "道具信息会随故事内容自动拆分，手动添加用于补充特殊道具。"}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          <button
            type="button"
            onClick={handleGenerateAll}
            className="btn-pill btn-pill-primary"
          >
            <span className="inline-flex items-center gap-1.5">
              <img src="/icons/ai-spark.svg" alt="" className="h-3.5 w-3.5" />
              AI 一键生成
            </span>
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="btn-pill btn-pill-muted btn-pill-sm"
          >
            + 添加{activeTab === "scene" ? "场景" : activeTab === "character" ? "角色" : "道具"}
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-5 text-xs">
        {errorMessage ? (
          <div className="text-red-300/80">{errorMessage}</div>
        ) : null}
      </div>

      {projectId && (isSyncingProject || projectStatus === "GENERATING") ? (
        <div className="mt-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          正在根据故事设定生成场景与角色数据，页面会自动刷新结果。
        </div>
      ) : null}

      <div className="mt-8 max-h-[calc(100vh_-_240px)] overflow-y-auto pr-2 clean-scrollbar">
        {cards.length === 0 && !(projectId && (isSyncingProject || projectStatus === "GENERATING")) ? (
          <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-bg)] px-6 py-5">
            <div className="card-title">
              {activeTab === "scene" ? "暂无场景数据" : activeTab === "character" ? "暂无角色数据" : "暂无道具数据"}
            </div>
            <p className="card-note mt-2 max-w-2xl">
              {emptyStateCopy}
            </p>
          </div>
        ) : null}
        <div
          className={`grid gap-4 ${
            activeTab === "scene" || activeTab === "character"
              ? "grid-cols-1"
              : "md:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              id={`asset-card-${card.id}`}
              className={`rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-bg-hover)] p-5 text-[var(--text-primary)] ${
                activeTab === "scene" ? "flex flex-col" : ""
              } ${
                errorSceneId === card.id ? "ring-1 ring-red-400/50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  {activeTab === "character" ? (
                    <>
                      <div className="text-[12px] leading-4 text-[var(--text-tertiary)]">
                        {card.title}
                      </div>
                      {editingCharacterId === card.id ? (
                        <input
                          value={characterNameDraft}
                          onChange={(event) =>
                            setCharacterNameDraft(event.target.value)
                          }
                          onBlur={() => commitCharacterName(card.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitCharacterName(card.id);
                            }
                          }}
                          autoFocus
                          className="mt-1 w-56 rounded-md border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-2 py-1 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--surface-border-strong)]"
                          placeholder="输入角色名称"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditCharacterName(card)}
                          className="mt-1 text-left text-[13px] text-[var(--text-primary)] transition hover:text-[var(--text-primary)]"
                        >
                          {card.subtitle || "未命名"}
                        </button>
                      )}
                    </>
                  ) : activeTab === "scene" ? (
                    <>
                      <div className="text-[12px] leading-4 text-[var(--text-tertiary)]">
                        {card.title}
                      </div>
                      {editingSceneId === card.id ? (
                        <input
                          value={sceneNameDraft}
                          onChange={(event) => setSceneNameDraft(event.target.value)}
                          onBlur={() => commitSceneName(card.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitSceneName(card.id);
                            }
                          }}
                          autoFocus
                          className="mt-1 w-56 rounded-md border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-2 py-1 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--surface-border-strong)]"
                          placeholder="输入场景名称"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditSceneName(card)}
                          className="mt-1 text-left text-[13px] text-[var(--text-primary)] transition hover:text-[var(--text-primary)]"
                        >
                          {card.subtitle || "未命名"}
                        </button>
                      )}
                    </>
                  ) : activeTab === "prop" ? (
                    <>
                      <div className="text-[12px] leading-4 text-[var(--text-tertiary)]">
                        {card.title}
                      </div>
                      {editingPropId === card.id ? (
                        <input
                          value={propNameDraft}
                          onChange={(event) => setPropNameDraft(event.target.value)}
                          onBlur={() => commitPropName(card.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitPropName(card.id);
                            }
                          }}
                          autoFocus
                          className="mt-1 w-56 rounded-md border border-[var(--surface-border-strong)] bg-[var(--surface-bg)] px-2 py-1 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--surface-border-strong)]"
                          placeholder="输入道具名称"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditPropName(card)}
                          className="mt-1 text-left text-[13px] text-[var(--text-primary)] transition hover:text-[var(--text-primary)]"
                        >
                          {card.subtitle || "未命名"}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-[var(--text-primary)]">{card.title}</div>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {activeTab === "scene" ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteScene(card.id)}
                      aria-label="删除场景"
                      className="btn-icon-sm border border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                    >
                      <ThemedIcon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {activeTab === "character" ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteCharacter(card.id)}
                      aria-label="删除角色"
                      className="btn-icon-sm border border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                    >
                      <ThemedIcon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {activeTab === "prop" ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteProp(card.id)}
                      aria-label="删除道具"
                      className="btn-icon-sm border border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-primary)] transition hover:bg-[var(--surface-bg-hover)]"
                    >
                      <ThemedIcon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className={activeTab === "scene" ? "mt-3" : ""}>
                {activeTab === "scene" ? (
                  <div className="mt-3 rounded-xl bg-[var(--surface-bg)] p-3">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                      <span>场景描述（可编辑）</span>
                    </div>
                    {editingPromptId === card.id ? (
                      <>
                        <textarea
                          id={`prompt-${card.id}`}
                          className="mt-2 w-full resize-none bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                          rows={3}
                          value={promptMap[card.id] ?? ""}
                          onChange={(event) =>
                            handlePromptChange(card.id, event.target.value)
                          }
                          placeholder="编辑提示词后点击保存"
                        />
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingPromptId(null)}
                            className="brand-button-subtle btn-pill btn-pill-xs"
                          >
                            保存
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingPromptId(card.id)}
                        className="mt-2 w-full text-left text-xs text-[var(--text-primary)] transition hover:text-[var(--text-primary)]"
                      >
                        {promptMap[card.id] || "点击编辑场景描述"}
                      </button>
                    )}
                  </div>
                ) : null}

                {activeTab === "scene" ? (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                      <span>场景视图</span>
                      <span className="text-[var(--text-tertiary)]">
                        上传正面图后可 AI 生成三视图
                      </span>
                    </div>
                    <div className="grid w-full grid-cols-4 gap-3">
                      {sceneSlots.map((label, index) => {
                        const isCustom = customSceneIds.includes(card.id);
                        const showOptional = isCustom && index !== 0;
                        const uploadKey = `${card.id}:${index}`;
                        const isUploading = uploadingMap[uploadKey];
                        const slotImage = sceneUploads[card.id]?.[index] ?? null;
                        const isFront = index === 0;
                        return (
                          <div
                            key={`${card.id}-slot-${index}`}
                            className="group relative aspect-square rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)]"
                          >
                            {slotImage ? (
                              <img
                                src={slotImage}
                                alt={`${card.subtitle || card.title}-${label}`}
                                className="absolute inset-0 h-full w-full rounded-lg object-cover"
                              />
                            ) : (
                              <ThemedIcon
                                name="image-placeholder"
                                className="pointer-events-none absolute inset-0 m-auto h-5 w-5 opacity-40"
                              />
                            )}
                            <span className="absolute left-1 top-1 text-[9px] text-[var(--text-tertiary)]">
                              {label}
                              {isFront ? "（必传）" : showOptional ? "（可选）" : ""}
                            </span>
                            <div className="pointer-events-none absolute inset-0 rounded-lg bg-black/40 opacity-0 transition group-hover:opacity-100" />
                            <button
                              type="button"
                              onClick={() =>
                                pickImageAndUpload((file) =>
                                  handleSceneUpload(card.id, index, file),
                                )
                              }
                              className="btn-pill btn-pill-muted btn-pill-xs absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                            >
                              {isUploading ? "上传中..." : isFront ? "本地上传" : "替换上传"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleGenerateSceneViews(card.id)}
                        className="btn-pill btn-pill-primary btn-pill-sm"
                        disabled={uploadingMap[`${card.id}:generate`]}
                      >
                        {uploadingMap[`${card.id}:generate`] ? "生成中..." : "AI 自动生成"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === "character" ? (
                      <div className="mt-4 flex gap-4">
                        <div className="group relative flex-[2] h-48 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)]">
                          <span className="absolute left-2 top-2 text-[10px] text-[var(--text-tertiary)]">
                            全身照
                          </span>
                          {characterUploads[card.id] ? (
                            <img
                              src={characterUploads[card.id] || ""}
                              alt={`${card.subtitle || card.title}-全身照`}
                              className="absolute inset-0 h-full w-full rounded-lg object-cover"
                            />
                          ) : (
                            <ThemedIcon
                              name="image-placeholder"
                              className="pointer-events-none absolute inset-0 m-auto h-5 w-5 opacity-40"
                            />
                          )}
                          <div className="pointer-events-none absolute inset-0 rounded-lg bg-black/45 opacity-0 transition group-hover:opacity-100" />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                pickImageAndUpload((file) =>
                                  handleCharacterUpload(card.id, file),
                                )
                              }
                              className="btn-pill btn-pill-muted btn-pill-xs"
                            >
                              {uploadingMap[`${card.id}:character`] ? "上传中..." : "本地上传"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerate(card)}
                              className="btn-pill btn-pill-primary btn-pill-xs"
                            >
                              AI 自动生成
                            </button>
                          </div>
                        </div>
                        <div className="relative flex-[3] h-48 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)]">
                          <span className="absolute left-2 top-2 text-[10px] text-[var(--text-tertiary)]">
                            三视图
                          </span>
                          <ThemedIcon
                            name="image-placeholder"
                            className="pointer-events-none absolute inset-0 m-auto h-5 w-5 opacity-40"
                          />
                        </div>
                      </div>
                    ) : null}
                    {activeTab === "prop" ? (
                      <div className="mt-4">
                        <div className="relative aspect-video w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)]">
                          <span className="absolute left-2 top-2 text-[10px] text-[var(--text-tertiary)]">
                            道具图片
                          </span>
                          {propUploads[card.id] ? (
                            <img
                              src={propUploads[card.id] || ""}
                              alt={`${card.subtitle || card.title}-道具图片`}
                              className="absolute inset-0 h-full w-full rounded-lg object-cover"
                            />
                          ) : (
                            <ThemedIcon
                              name="image-placeholder"
                              className="pointer-events-none absolute inset-0 m-auto h-5 w-5 opacity-40"
                            />
                          )}
                        </div>
                      </div>
                    ) : null}
                    {generatedMap[card.id] ? (
                      <div className="mt-4 rounded-xl bg-[var(--surface-bg)] p-3">
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                          <span>提示词（可编辑）</span>
                          <button
                            type="button"
                            onClick={() => handleGenerate(card)}
                            className="btn-pill btn-pill-muted btn-pill-xs"
                          >
                            重新生成
                          </button>
                        </div>
                        <textarea
                          id={`prompt-${card.id}`}
                          className="mt-2 w-full resize-none bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                          rows={3}
                          value={promptMap[card.id] ?? ""}
                          onChange={(event) =>
                            handlePromptChange(card.id, event.target.value)
                          }
                          placeholder="编辑提示词后点击重新生成"
                        />
                      </div>
                    ) : null}
                    {activeTab === "prop" ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            pickImageAndUpload((file) => handlePropUpload(card.id, file))
                          }
                          className="btn-pill btn-pill-muted btn-pill-sm rounded-xl"
                        >
                          {uploadingMap[`${card.id}:prop`] ? "上传中..." : "本地上传"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerate(card)}
                          className="btn-pill btn-pill-primary btn-pill-sm rounded-xl"
                        >
                          AI 自动生成
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {nextHref ? (
        <WorkflowStepNav
          nextHref={nextHref}
          onNext={handleNext}
          stepId={stepId}
          projectName={projectName}
        />
      ) : null}
    </div>
  );
}
