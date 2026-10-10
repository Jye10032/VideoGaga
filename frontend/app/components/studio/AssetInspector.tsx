"use client";
/* eslint-disable @next/next/no-img-element */
import { useId, useRef, useState } from "react";
import {
  Check,
  Expand,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Asset } from "../../lib/studio/types";
import { imageUpload } from "../../lib/studio/media";

export function AssetStatus({ asset }: { asset: Asset }) {
  return (
    <Badge variant={asset.confirmed ? "default" : "secondary"}>
      {asset.confirmed && <Check />}
      {asset.confirmed ? "已确认" : asset.image ? "待确认" : "待补图"}
    </Badge>
  );
}

export default function AssetInspector({
  asset,
  disabled,
  linkedShots,
  patch,
  generate,
  remove,
  preview,
  onError,
}: {
  asset: Asset;
  disabled: boolean;
  linkedShots: number;
  patch: (change: Partial<Asset>) => void;
  generate: () => void;
  remove: () => void;
  preview: () => void;
  onError: (message: string) => void;
}) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const locked = disabled || uploading;
  return (
    <div className="asset-inspector-body">
      <div className="asset-inspector-scroll">
        <div className="asset-detail-meta">
          <AssetStatus asset={asset} />
          <span>已关联 {linkedShots} 个镜头</span>
        </div>
        {asset.image ? (
          <button
            className="asset-detail-preview"
            type="button"
            onClick={preview}
            aria-label={`查看完整参考图 ${asset.name}`}
          >
            <img src={asset.image} alt={asset.name} />
            <span>
              <Expand size={14} />
              查看大图
            </span>
          </button>
        ) : (
          <div className="asset-detail-placeholder">
            <ImagePlus size={28} />
            <span>还没有参考图</span>
          </div>
        )}
        <FieldGroup>
          <Field data-disabled={locked}>
            <FieldLabel htmlFor={`${id}-name`}>资产名称</FieldLabel>
            <Input
              id={`${id}-name`}
              value={asset.name}
              maxLength={100}
              disabled={locked}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Field>
          <Field data-disabled={locked}>
            <div className="asset-field-heading">
              <FieldLabel htmlFor={`${id}-prompt`}>外观与生成提示词</FieldLabel>
              <span>{asset.description.length} / 5000</span>
            </div>
            <Textarea
              id={`${id}-prompt`}
              value={asset.description}
              maxLength={5000}
              rows={9}
              disabled={locked}
              aria-describedby={`${id}-hint`}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="描述稳定的外观、服装、材质或场景布局…"
            />
            <FieldDescription id={`${id}-hint`}>
              修改设定会清除当前参考图及关联分镜画面，需重新生成。
            </FieldDescription>
          </Field>
        </FieldGroup>
        <div className="asset-image-actions">
          <Button
            type="button"
            variant="outline"
            disabled={locked || !asset.description.trim()}
            onClick={generate}
          >
            <WandSparkles />
            {asset.image ? "重新生成" : "生成图片"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={locked}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? <LoaderCircle className="animate-spin" /> : <Upload />}
            {uploading ? "上传中" : "上传参考图"}
          </Button>
          <input
            ref={fileInput}
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp"
            disabled={locked}
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                patch({ image: await imageUpload(file), confirmed: false });
              } catch (error) {
                onError(
                  error instanceof Error ? error.message : "图片上传失败",
                );
              } finally {
                input.value = "";
                setUploading(false);
              }
            }}
          />
        </div>
      </div>
      <div className="asset-inspector-footer">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={locked}
          onClick={remove}
          aria-label={`删除资产 ${asset.name}`}
          title="删除资产"
        >
          <Trash2 />
        </Button>
        <Button
          type="button"
          variant={asset.confirmed ? "outline" : "default"}
          disabled={locked || !asset.name.trim() || !asset.description.trim()}
          onClick={() => patch({ confirmed: !asset.confirmed })}
        >
          <Check />
          {asset.confirmed ? "取消确认" : "确认资产"}
        </Button>
      </div>
    </div>
  );
}
