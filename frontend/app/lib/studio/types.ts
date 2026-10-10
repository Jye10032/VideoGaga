export type Modality = "text" | "image" | "video" | "audio";
export type Provider = {
  protocol: "openai" | "video-job";
  baseUrl: string;
  apiKey: string;
  model: string;
};
export type ProviderSettings = Record<Modality, Provider>;
export type Asset = {
  id: string;
  kind: "character" | "scene" | "prop";
  name: string;
  description: string;
  image: string;
  confirmed: boolean;
};
export type Shot = {
  id: string;
  title: string;
  description: string;
  dialogue: string;
  assetIds: string[];
  duration: number;
  camera: string;
  voice: string;
  image: string;
  video: string;
  audio: string;
  muted: boolean;
};
export type StudioData = {
  script: string;
  ratio: "16:9" | "9:16" | "1:1";
  assets: Asset[];
  shots: Shot[];
};
export type ProjectSummary = {
  id: string;
  name: string;
  mode: "demo" | "connected";
  updatedAt: string;
};
export type StudioProject = ProjectSummary & {
  revision: number;
  data: StudioData;
};
export type Run = {
  id: string;
  kind: Modality;
  targetId: string;
  sourceHash: string;
  status: "running" | "pending" | "success" | "error" | "uncertain";
  output: { text?: string; media?: string; remoteId?: string; error?: string };
  createdAt: string;
};
export const newData = (): StudioData => ({
  script: "",
  ratio: "16:9",
  assets: [],
  shots: [],
});
export const newShot = (): Shot => ({
  id: crypto.randomUUID(),
  title: "新分镜",
  description: "",
  dialogue: "",
  assetIds: [],
  duration: 5,
  camera: "固定镜头",
  voice: "alloy",
  image: "",
  video: "",
  audio: "",
  muted: false,
});
export const modalityLabels: Record<Modality, string> = {
  text: "剧本",
  image: "图片",
  video: "视频",
  audio: "配音",
};
