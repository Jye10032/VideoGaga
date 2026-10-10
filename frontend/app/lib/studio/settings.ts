import { getToken } from "../api/client";
import { Modality, ProviderSettings } from "./types";

export function accountScope() {
  const token = getToken();
  if (!token) return "guest";
  try {
    return String(
      JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).sub || "guest",
    );
  } catch {
    return "guest";
  }
}

export const defaults = (): ProviderSettings =>
  Object.fromEntries(
    (["text", "image", "video", "audio"] as Modality[]).map((kind) => [
      kind,
      {
        protocol: kind === "video" ? "video-job" : "openai",
        baseUrl: "",
        apiKey: "",
        model: "",
      },
    ]),
  ) as ProviderSettings;

const key = () => `gaga-providers:v1:${accountScope()}`;
export function loadSettings(): ProviderSettings {
  const result = defaults();
  try {
    const stored = JSON.parse(localStorage.getItem(key()) || "{}");
    for (const kind of Object.keys(result) as Modality[]) {
      const p = stored[kind];
      if (
        p &&
        [p.baseUrl, p.apiKey, p.model].every((v) => typeof v === "string")
      )
        result[kind] = {
          ...result[kind],
          baseUrl: p.baseUrl,
          apiKey: p.apiKey,
          model: p.model,
        };
    }
  } catch {
    /* Corrupt settings must not block the workspace. */
  }
  return result;
}
export function validateSettings(settings: ProviderSettings) {
  for (const p of Object.values(settings)) {
    if (!p.baseUrl && !p.apiKey && !p.model) continue;
    if (!p.baseUrl || !p.apiKey.trim() || !p.model.trim())
      throw new Error("每项配置请填写完整，或全部留空");
    let url: URL;
    try {
      url = new URL(p.baseUrl);
    } catch {
      throw new Error("请输入完整 HTTPS API 地址");
    }
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.port && url.port !== "443")
    )
      throw new Error("API 地址须使用 HTTPS，不含凭据、查询参数或自定义端口");
  }
}
export function saveSettings(settings: ProviderSettings) {
  validateSettings(settings);
  localStorage.setItem(key(), JSON.stringify(settings));
}
export function clearSettings() {
  localStorage.removeItem(key());
}
