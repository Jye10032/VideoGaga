"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, KeyRound, Save, Trash2 } from "lucide-react";
import {
  defaults,
  loadSettings,
  saveSettings,
  clearSettings,
} from "../lib/studio/settings";
import { Modality, modalityLabels } from "../lib/studio/types";
import {
  Action,
  Notice,
  Confirm,
  Confirmation,
} from "../components/studio/Controls";
import { useHydrated } from "../hooks/useHydrated";
import { useAuthContext } from "../context/AuthContext";
const paths: Record<Modality, string> = {
  text: "/chat/completions",
  image: "/images/generations",
  video: "/videos",
  audio: "/audio/speech",
};
export default function SettingsPage() {
  const { user } = useAuthContext(),
    hydrated = useHydrated();
  return hydrated ? (
    <SettingsForm key={user || "guest"} />
  ) : (
    <main className="studio-page app-surface">正在载入设置…</main>
  );
}
function SettingsForm() {
  const [settings, setSettings] = useState(loadSettings),
    [visible, setVisible] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState<Confirmation | null>(null);
  function save() {
    try {
      saveSettings(settings);
      setError("");
      setMessage("已保存在当前浏览器，未发送测试请求");
    } catch (e) {
      setError(e instanceof Error ? e.message : "浏览器存储不可用");
      setMessage("");
    }
  }
  return (
    <main className="studio-page app-surface">
      <div className="studio-page-heading">
        <div>
          <Link className="studio-back" href="/projects">
            <ArrowLeft size={16} />
            我的项目
          </Link>
          <p className="studio-eyebrow">创作设置</p>
          <h1>连接你自己的模型</h1>
          <p>按用途独立配置，随时更换。没有 Key 也可以先体验完整流程。</p>
        </div>
        <span className="studio-heading-icon">
          <KeyRound />
        </span>
      </div>
      <Notice>
        配置仅保存在当前浏览器的
        localStorage，未加密；不会写入服务端数据库。退出账号会清除该账号的配置。只有主动生成时，才会随单次请求传给服务端。
      </Notice>
      {message && <Notice>{message}</Notice>}
      {error && <Notice error>{error}</Notice>}
      <div className="studio-settings-grid">
        {(Object.keys(settings) as Modality[]).map((kind) => (
          <section key={kind} className="studio-panel">
            <div className="studio-panel-title">
              <h2>{modalityLabels[kind]} API</h2>
              <span className="studio-tag">
                {kind === "video" ? "视频任务协议" : "OpenAI 兼容"}
              </span>
            </div>
            <p className="studio-helper">
              {kind === "video"
                ? "提交 JSON 任务、查询状态并取得视频 URL。"
                : "填写兼容此接口协议的供应商信息。"}
            </p>
            <label>
              API 基础地址
              <input
                value={settings[kind].baseUrl}
                placeholder="https://your-provider.com/v1"
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    [kind]: { ...s[kind], baseUrl: e.target.value },
                  }))
                }
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label>
              API Key
              <div className="studio-secret">
                <input
                  type={visible.includes(kind) ? "text" : "password"}
                  value={settings[kind].apiKey}
                  placeholder="输入你的 API Key"
                  autoComplete="off"
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      [kind]: { ...s[kind], apiKey: e.target.value },
                    }))
                  }
                />
                <button
                  type="button"
                  aria-label={`${visible.includes(kind) ? "隐藏" : "显示"}${modalityLabels[kind]} API Key`}
                  onClick={() =>
                    setVisible((v) =>
                      v.includes(kind)
                        ? v.filter((k) => k !== kind)
                        : [...v, kind],
                    )
                  }
                >
                  {visible.includes(kind) ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>
            <label>
              模型 ID
              <input
                value={settings[kind].model}
                placeholder="填写供应商提供的模型名称"
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    [kind]: { ...s[kind], model: e.target.value },
                  }))
                }
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <p className="studio-helper">
              请求路径：{paths[kind]}
              {kind === "video" ? "，查询 /videos/{id}" : ""}
            </p>
          </section>
        ))}
      </div>
      <details className="studio-panel">
        <summary>支持的接口格式</summary>
        <p className="studio-helper">
          基础地址应包含供应商要求的版本路径，例如 /v1。文本接口返回
          choices[].message.content；图片接口返回 data[].url 或
          b64_json；配音接口返回音频文件。视频提交字段为
          model、prompt、duration、aspect_ratio，返回 id，查询结果须包含 url 或
          video_url，失败状态为 failed / error /
          cancelled。这不等同于所有厂商原生接口；图片尺寸使用
          1536×1024、1024×1536 或 1024×1024。
        </p>
      </details>
      <div className="studio-toolbar">
        <Action
          onClick={() =>
            setConfirm({
              title: "清除本机 API 配置？",
              description:
                "清除当前账号在此浏览器保存的所有模型地址、Key 和模型名称。",
              action: () => {
                clearSettings();
                setSettings(defaults());
                setMessage("配置已清除");
              },
            })
          }
        >
          <Trash2 size={16} />
          清除配置
        </Action>
        <Action primary onClick={save}>
          <Save size={16} />
          保存到浏览器
        </Action>
      </div>
      <Confirm value={confirm} close={() => setConfirm(null)} />
    </main>
  );
}
