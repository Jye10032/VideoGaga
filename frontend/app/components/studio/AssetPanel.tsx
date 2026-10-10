"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";
import { ImagePlus, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Asset, StudioData } from "../../lib/studio/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AssetInspector, { AssetStatus } from "./AssetInspector";
import { Empty } from "./Controls";

const categories = [
  ["character", "角色"],
  ["scene", "场景"],
  ["prop", "道具"],
] as const;

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
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewId, setPreviewId] = useState("");
  const desktop = useMediaQuery("(min-width: 1100px)", {});
  const assets = data.assets.filter((a) => a.kind === tab);
  const visible = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );
  // Keep the editor selection stable while its name is being edited under a search.
  const selected = assets.find((a) => a.id === selectedId) ?? visible[0];
  const preview = data.assets.find((a) => a.id === previewId);
  const linkedShots = (id: string) =>
    data.shots.filter((s) => s.assetIds.includes(id)).length;

  function patch(id: string, change: Partial<Asset>) {
    setSelectedId(id);
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
  function addAsset() {
    const id = crypto.randomUUID();
    edit((d) => ({
      ...d,
      assets: [
        ...d.assets,
        {
          id,
          kind: tab,
          name: "新资产",
          description: "",
          image: "",
          confirmed: false,
        },
      ],
    }));
    setSearch("");
    setSelectedId(id);
    setEditorOpen(true);
  }
  const inspector = selected ? (
    <AssetInspector
      key={selected.id}
      asset={selected}
      disabled={disabled}
      linkedShots={linkedShots(selected.id)}
      patch={(change) => patch(selected.id, change)}
      generate={() => generate(selected.id)}
      remove={() => remove(selected.id)}
      preview={() => setPreviewId(selected.id)}
      onError={onError}
    />
  ) : (
    <div className="asset-inspector-empty">
      <SlidersHorizontal size={24} />
      <p>选择一项资产，查看和编辑设定</p>
    </div>
  );

  return (
    <div className="asset-library">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Asset["kind"]);
          setSelectedId("");
          setSearch("");
          setEditorOpen(false);
        }}
      >
        <div className="asset-library-toolbar">
          <TabsList aria-label="资产分类" className="asset-category-tabs">
            {categories.map(([kind, label]) => (
              <TabsTrigger value={kind} key={kind}>
                {label}
                <span>{data.assets.filter((a) => a.kind === kind).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="asset-library-tools">
            <div className="asset-search">
              <Search size={16} />
              <Input
                aria-label="搜索资产"
                placeholder="搜索资产名称"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedId("");
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || data.assets.length >= 100}
              onClick={addAsset}
            >
              <Plus />
              添加资产
            </Button>
          </div>
        </div>
        {categories.map(([kind, label]) => (
          <TabsContent value={kind} key={kind}>
            {kind === tab && (
              <div className="asset-library-layout">
                <section
                  aria-label={`${label}资产列表`}
                  className="asset-gallery"
                >
                  <div className="asset-gallery-caption">
                    <span>
                      {assets.length} 项{label}资产
                    </span>
                    <span>选择资产以编辑</span>
                  </div>
                  {visible.length ? (
                    <div className="asset-browser-grid">
                      {visible.map((asset) => (
                        <button
                          type="button"
                          className="asset-browser-card"
                          key={asset.id}
                          aria-label={`编辑资产 ${asset.name}`}
                          aria-pressed={
                            selected?.id === asset.id && (desktop || editorOpen)
                          }
                          onClick={() => {
                            setSelectedId(asset.id);
                            setEditorOpen(true);
                          }}
                        >
                          <span className="asset-browser-image">
                            {asset.image ? (
                              <img src={asset.image} alt={asset.name} />
                            ) : (
                              <span className="asset-missing-image">
                                <ImagePlus size={30} />
                                <span>待添加参考图</span>
                              </span>
                            )}
                          </span>
                          <span className="asset-browser-info">
                            <span className="asset-browser-title">
                              {asset.name || "未命名资产"}
                            </span>
                            <AssetStatus asset={asset} />
                            <span className="asset-browser-caption">
                              {linkedShots(asset.id)} 个关联镜头
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={search ? "没有匹配的资产" : "把故事里的细节留下来"}
                    >
                      {search
                        ? "试试其他名称，或清空搜索。"
                        : "可从剧本拆解资产，也可以点击添加资产。"}
                    </Empty>
                  )}
                </section>
                {desktop && (
                  <aside className="asset-inspector" aria-label="资产详情">
                    <header>
                      <SlidersHorizontal size={16} />
                      <h2>资产详情</h2>
                      <span>自动保存</span>
                    </header>
                    {inspector}
                  </aside>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      {!desktop && (
        <Sheet
          open={editorOpen && Boolean(selected)}
          onOpenChange={setEditorOpen}
        >
          <SheetContent className="app-surface asset-editor-sheet" side="right">
            <SheetHeader>
              <SheetTitle>资产详情</SheetTitle>
              <SheetDescription>
                编辑设定与参考图，修改自动保存。
              </SheetDescription>
            </SheetHeader>
            {inspector}
          </SheetContent>
        </Sheet>
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
            <DialogDescription>
              保留完整画幅，核对角色外观、四视图布局与道具细节。
            </DialogDescription>
          </DialogHeader>
          {preview?.image && (
            <img
              className="studio-reference-image"
              src={preview.image}
              alt={preview.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
