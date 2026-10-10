"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  Copy,
  Plus,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { newShot, Shot, StudioData } from "../../lib/studio/types";
import { Action, Empty } from "./Controls";
export default function ShotPanel({
  data,
  edit,
  disabled,
  generate,
  remove,
}: {
  data: StudioData;
  edit: (fn: (d: StudioData) => StudioData) => void;
  disabled: boolean;
  generate: (id: string) => void;
  remove: (id: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const shot = data.shots.find((s) => s.id === selected) || data.shots[0];
  const patch = (
    change: Partial<Shot>,
    invalidate: "visual" | "audio" | "both" | "none" = "visual",
  ) =>
    edit((d) => ({
      ...d,
      shots: d.shots.map((s) =>
        s.id === shot.id
          ? {
              ...s,
              ...change,
              ...(invalidate === "visual" || invalidate === "both"
                ? { image: "", video: "" }
                : {}),
              ...(invalidate === "audio" || invalidate === "both"
                ? { audio: "" }
                : {}),
            }
          : s,
      ),
    }));
  function add() {
    const s = newShot();
    edit((d) => ({ ...d, shots: [...d.shots, s] }));
    setSelected(s.id);
  }
  function move(delta: number) {
    edit((d) => {
      const shots = [...d.shots],
        i = shots.findIndex((s) => s.id === shot.id),
        n = i + delta;
      if (n < 0 || n >= shots.length) return d;
      [shots[i], shots[n]] = [shots[n], shots[i]];
      return { ...d, shots };
    });
  }
  if (!shot)
    return (
      <Empty
        title="将故事拆成一个个镜头"
        action={
          <Action onClick={add} disabled={disabled}>
            <Plus size={16} />
            添加分镜
          </Action>
        }
      >
        回到剧本页生成分镜计划，或手动写下第一个镜头。
      </Empty>
    );
  const index = data.shots.indexOf(shot);
  return (
    <div className="studio-shot-layout">
      <div className="studio-shot-list">
        {data.shots.map((s, i) => (
          <button
            key={s.id}
            className={s.id === shot.id ? "selected" : ""}
            onClick={() => setSelected(s.id)}
          >
            <span className="studio-shot-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="studio-shot-thumb">
              {s.image ? (
                <img src={s.image} alt="" />
              ) : (
                <Clapperboard size={18} />
              )}
            </span>
            <span>
              <strong>{s.title || "未命名镜头"}</strong>
              <small>
                {s.duration} 秒 · {s.camera}
              </small>
            </span>
          </button>
        ))}
        <Action disabled={disabled || data.shots.length >= 100} onClick={add}>
          <Plus size={16} />
          添加分镜
        </Action>
      </div>
      <div className="studio-shot-inspector">
        <div className="studio-shot-preview">
          {shot.image ? (
            <img src={shot.image} alt={shot.title} />
          ) : (
            <div>
              <Clapperboard size={42} />
              <p>确认分镜描述后，生成画面</p>
            </div>
          )}
        </div>
        <div className="studio-toolbar">
          <span className="studio-tag">
            镜头 {String(index + 1).padStart(2, "0")}
          </span>
          <Action
            disabled={disabled || !shot.description.trim()}
            onClick={() => generate(shot.id)}
          >
            <WandSparkles size={15} />
            {shot.image ? "重新生成画面" : "生成分镜图"}
          </Action>
          <span className="studio-spacer" />
          <button
            className="studio-icon-button"
            disabled={disabled || index === 0}
            aria-label="分镜上移"
            onClick={() => move(-1)}
          >
            <ArrowUp size={16} />
          </button>
          <button
            className="studio-icon-button"
            disabled={disabled || index === data.shots.length - 1}
            aria-label="分镜下移"
            onClick={() => move(1)}
          >
            <ArrowDown size={16} />
          </button>
          <button
            className="studio-icon-button"
            disabled={disabled || data.shots.length >= 100}
            aria-label="复制分镜"
            onClick={() => {
              const copy = {
                ...shot,
                id: crypto.randomUUID(),
                title: shot.title + " 副本",
                video: "",
                audio: "",
              };
              edit((d) => ({
                ...d,
                shots: [
                  ...d.shots.slice(0, index + 1),
                  copy,
                  ...d.shots.slice(index + 1),
                ],
              }));
              setSelected(copy.id);
            }}
          >
            <Copy size={16} />
          </button>
          <button
            className="studio-icon-button"
            disabled={disabled}
            aria-label="删除分镜"
            onClick={() => remove(shot.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <label>
          镜头标题
          <input
            value={shot.title}
            maxLength={200}
            disabled={disabled}
            onChange={(e) => patch({ title: e.target.value }, "none")}
          />
        </label>
        <label>
          画面与动作
          <textarea
            rows={4}
            value={shot.description}
            maxLength={5000}
            disabled={disabled}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </label>
        <div className="studio-form-row">
          <label>
            时长（秒）
            <input
              type="number"
              min={1}
              max={30}
              value={shot.duration}
              disabled={disabled}
              onChange={(e) =>
                patch(
                  {
                    duration: Math.max(
                      1,
                      Math.min(30, Number(e.target.value) || 1),
                    ),
                  },
                  "both",
                )
              }
            />
          </label>
          <label>
            景别与运镜
            <input
              value={shot.camera}
              maxLength={200}
              disabled={disabled}
              onChange={(e) => patch({ camera: e.target.value })}
            />
          </label>
        </div>
        <label>
          旁白 / 对白
          <textarea
            rows={2}
            value={shot.dialogue}
            maxLength={5000}
            disabled={disabled}
            onChange={(e) => patch({ dialogue: e.target.value }, "audio")}
          />
        </label>
        <fieldset className="studio-asset-links">
          <legend>关联资产</legend>
          {data.assets.map((a) => (
            <label key={a.id}>
              <input
                type="checkbox"
                checked={shot.assetIds.includes(a.id)}
                disabled={disabled}
                onChange={(e) =>
                  patch({
                    assetIds: e.target.checked
                      ? [...shot.assetIds, a.id]
                      : shot.assetIds.filter((id) => id !== a.id),
                  })
                }
              />
              {a.name}
              {!a.confirmed && <small>待确认</small>}
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
