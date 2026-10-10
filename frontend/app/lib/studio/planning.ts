import { Asset, newShot, Shot, StudioData } from "./types";

export const SAMPLE_SCRIPT =
  "凌晨，林夏回到停运的海边车站。她在候车室发现一台仍在运作的旧收音机。\n林夏：末班车不是早就取消了吗？\n收音机里传来爷爷的声音：别急，灯亮的时候，就能找到回家的路。\n她抱着收音机走向站台，远处的灯塔缓缓亮起。";

// Deliberately deterministic demonstration, not an AI inference.
export function demoPlan(script: string): Pick<StudioData, "assets" | "shots"> {
  const lines = script
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const names = [
    ...new Set(
      lines
        .map((line) => line.match(/^([^：:，。]{1,12})[：:]/)?.[1])
        .filter(Boolean),
    ),
  ] as string[];
  const assets: Asset[] = [
    ...(names.length ? names : ["主角"]).map((name) => ({
      id: crypto.randomUUID(),
      kind: "character" as const,
      name,
      description: `${name}，请补充外观与服装描述`,
      image: "",
      confirmed: false,
    })),
    {
      id: crypto.randomUUID(),
      kind: "scene",
      name: "故事场景",
      description: lines[0]?.slice(0, 300) || "请补充场景描述",
      image: "",
      confirmed: false,
    },
    {
      id: crypto.randomUUID(),
      kind: "prop",
      name: "关键道具",
      description: "请根据故事编辑道具描述",
      image: "",
      confirmed: false,
    },
  ];
  const shots = lines.slice(0, 12).map((line, i) => ({
    ...newShot(),
    title: `镜头 ${String(i + 1).padStart(2, "0")}`,
    description: line,
    dialogue: line.includes("：") ? line.split("：").slice(1).join("：") : "",
    duration: 4,
    assetIds: assets.slice(0, 2).map((a) => a.id),
  }));
  return { assets, shots };
}

export function planPrompt(script: string) {
  return `将下面的故事整理成可编辑的漫剧生产计划。只返回 JSON，不要 Markdown。格式：{"assets":[{"id":"a1","kind":"character|scene|prop","name":"名称","description":"具体视觉描述"}],"shots":[{"title":"镜头标题","description":"画面动作","dialogue":"台词或空字符串","assetIds":["a1"],"duration":5,"camera":"景别和运镜","voice":"alloy"}]}。最多 30 个资产、40 个镜头，时长 1-30 秒，镜头须引用已有资产。故事如下：\n${script}`;
}
export function parsePlan(text: string): Pick<StudioData, "assets" | "shots"> {
  const value = JSON.parse(
    text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
  );
  if (
    !Array.isArray(value.assets) ||
    !Array.isArray(value.shots) ||
    value.assets.length > 100 ||
    !value.shots.length ||
    value.shots.length > 100
  )
    throw new Error("生成计划格式不正确，请重试或手动编辑");
  const clean = (v: unknown, max: number) =>
    typeof v === "string" ? v.slice(0, max) : "";
  const remap = new Map<string, string>();
  const assets: Asset[] = value.assets.map((a: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    remap.set(String(a.id), id);
    return {
      id,
      kind: ["character", "scene", "prop"].includes(String(a.kind))
        ? (a.kind as Asset["kind"])
        : "prop",
      name: clean(a.name, 100),
      description: clean(a.description, 5000),
      image: "",
      confirmed: false,
    };
  });
  const shots: Shot[] = value.shots.map((s: Record<string, unknown>) => ({
    ...newShot(),
    title: clean(s.title, 200),
    description: clean(s.description, 5000),
    dialogue: clean(s.dialogue, 5000),
    duration: Math.max(1, Math.min(30, Math.round(Number(s.duration) || 5))),
    camera: clean(s.camera, 200) || "固定镜头",
    voice: clean(s.voice, 100) || "alloy",
    assetIds: Array.isArray(s.assetIds)
      ? ([
          ...new Set(
            s.assetIds.map((a) => remap.get(String(a))).filter(Boolean),
          ),
        ] as string[])
      : [],
  }));
  return { assets, shots };
}
export function shotPrompt(shot: Shot, assets: Asset[]) {
  return `${shot.description}\n镜头：${shot.camera}\n资产设定：\n${assets
    .filter((a) => shot.assetIds.includes(a.id))
    .map((a) => `${a.name}：${a.description}`)
    .join("\n")}`;
}
export function readiness(data: StudioData) {
  return [
    !!data.script.trim(),
    data.assets.length > 0 && data.assets.every((a) => a.confirmed),
    data.shots.length > 0 && data.shots.every((s) => s.description.trim()),
    data.shots.length > 0 && data.shots.every((s) => s.video),
    data.shots.length > 0 &&
      data.shots.every((s) => s.muted || !s.dialogue.trim() || s.audio),
  ];
}

export async function inputHash(
  data: StudioData,
  kind: string,
  targetId: string,
) {
  const id = targetId.replace(/^(asset|shot):/, "");
  const asset = data.assets.find((a) => a.id === id),
    shot = data.shots.find((s) => s.id === id);
  const input =
    kind === "text"
      ? { script: data.script }
      : asset
        ? {
            name: asset.name,
            description: asset.description,
            ratio: data.ratio,
          }
        : shot
          ? kind === "audio"
            ? {
                dialogue: shot.dialogue,
                voice: shot.voice,
                duration: shot.duration,
              }
            : {
                prompt: shotPrompt(shot, data.assets),
                references: data.assets
                  .filter((a) => shot.assetIds.includes(a.id))
                  .map((a) => a.image),
                ratio: data.ratio,
                duration: shot.duration,
                image: kind === "video" ? shot.image : undefined,
              }
          : null;
  if (!input) throw new Error("生成目标已被删除");
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(input)),
  );
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
