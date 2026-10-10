"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Check, ImagePlus, Plus, Trash2, WandSparkles } from "lucide-react";
import { Asset, StudioData } from "../../lib/studio/types";
import { imageUpload } from "../../lib/studio/media";
import { Action, Empty } from "./Controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
export default function AssetPanel({
  data,
  edit,
  disabled,
  generate,
  remove,
  onError,
}: {
  data: StudioData;
  edit: (fn: (d: StudioData) => StudioData) => void;
  disabled: boolean;
  generate: (id: string) => void;
  remove: (id: string) => void;
  onError: (e: string) => void;
}) {
  const [tab, setTab] = useState<Asset["kind"]>("character");
  const [previewId, setPreviewId] = useState("");
  const preview = data.assets.find((asset) => asset.id === previewId);
  function patch(id: string, change: Partial<Asset>) {
    edit((d) => ({
      ...d,
      assets: d.assets.map((a) =>
        a.id === id
          ? {
              ...a,
              ...change,
              ...("name" in change || "description" in change
                ? { image: "", confirmed: false }
                : {}),
            }
          : a,
      ),
      shots: d.shots.map((s) =>
        ("name" in change || "description" in change || "image" in change) &&
        s.assetIds.includes(id)
          ? { ...s, image: "", video: "" }
          : s,
      ),
    }));
  }
  return (
    <>
      <div className="studio-library-bar">
        <div className="studio-tabs" role="tablist" aria-label="资产分类">
          {(
            [
              ["character", "角色"],
              ["scene", "场景"],
              ["prop", "道具"],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              role="tab"
              aria-selected={kind === tab}
              onClick={() => setTab(kind)}
            >
              {label}
              <span>{data.assets.filter((a) => a.kind === kind).length}</span>
            </button>
          ))}
        </div>
        <Action
          disabled={disabled || data.assets.length >= 100}
          onClick={() =>
            edit((d) => ({
              ...d,
              assets: [
                ...d.assets,
                {
                  id: crypto.randomUUID(),
                  kind: tab,
                  name: "新资产",
                  description: "",
                  image: "",
                  confirmed: false,
                },
              ],
            }))
          }
        >
          <Plus size={16} />
          添加资产
        </Action>
      </div>
      {!data.assets.filter((a) => a.kind === tab).length ? (
        <Empty title="把故事里的细节留下来">
          可从剧本拆解角色、场景和道具，也可以手动添加。
        </Empty>
      ) : (
        <div className="studio-asset-grid">
          {data.assets
            .filter((a) => a.kind === tab)
            .map((asset) => (
              <article className="studio-asset-card" key={asset.id}>
                <div className="studio-asset-image">
                  {asset.image ? (
                    <button
                      type="button"
                      className="studio-asset-open"
                      aria-label={`查看完整参考图 ${asset.name}`}
                      onClick={() => setPreviewId(asset.id)}
                    >
                      <img src={asset.image} alt={asset.name} />
                    </button>
                  ) : (
                    <ImagePlus size={32} />
                  )}
                  <span
                    className={`studio-asset-status ${asset.confirmed ? "ready" : ""}`}
                  >
                    {asset.confirmed ? (
                      <>
                        <Check size={13} />
                        已确认
                      </>
                    ) : (
                      "待确认"
                    )}
                  </span>
                </div>
                <div className="studio-asset-fields">
                  <label>
                    名称
                    <input
                      value={asset.name}
                      maxLength={100}
                      disabled={disabled}
                      onChange={(e) =>
                        patch(asset.id, {
                          name: e.target.value,
                          confirmed: false,
                        })
                      }
                    />
                  </label>
                  <label>
                    描述
                    <textarea
                      rows={3}
                      value={asset.description}
                      maxLength={5000}
                      disabled={disabled}
                      onChange={(e) =>
                        patch(asset.id, {
                          description: e.target.value,
                          confirmed: false,
                        })
                      }
                    />
                  </label>
                  <div className="studio-toolbar">
                    <Action
                      disabled={disabled || !asset.description.trim()}
                      onClick={() => generate(asset.id)}
                    >
                      <WandSparkles size={14} />
                      {asset.image ? "重新生成" : "生成图片"}
                    </Action>
                    <label className="studio-upload studio-button">
                      <ImagePlus size={14} />
                      上传
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={disabled}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file)
                            try {
                              patch(asset.id, {
                                image: await imageUpload(file),
                                confirmed: false,
                              });
                            } catch (err) {
                              onError((err as Error).message);
                            }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="studio-toolbar">
                    <Action
                      primary={asset.confirmed}
                      disabled={
                        disabled ||
                        !asset.name.trim() ||
                        !asset.description.trim()
                      }
                      onClick={() =>
                        patch(asset.id, { confirmed: !asset.confirmed })
                      }
                    >
                      <Check size={14} />
                      {asset.confirmed ? "取消确认" : "确认资产"}
                    </Action>
                    <button
                      className="studio-icon-button"
                      aria-label={`删除资产 ${asset.name}`}
                      disabled={disabled}
                      onClick={() => remove(asset.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}
      <Dialog
        open={Boolean(preview?.image)}
        onOpenChange={(open) => {
          if (!open) setPreviewId("");
        }}
      >
        <DialogContent className="app-surface studio-dialog studio-reference-dialog">
          <DialogHeader>
            <DialogTitle>{preview?.name} · 完整参考图</DialogTitle>
          </DialogHeader>
          {preview?.image && (
            <img
              className="studio-reference-image"
              src={preview.image}
              alt={preview.name}
            />
          )}
          <p className="studio-helper">
            保留完整画幅，可核对四视图布局、角色外观与道具细节。
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
