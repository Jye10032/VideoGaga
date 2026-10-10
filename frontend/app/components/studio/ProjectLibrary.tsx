"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Clapperboard,
  ArrowUpRight,
  Trash2,
  Monitor,
  Cloud,
  Settings2,
  Play,
} from "lucide-react";
import {
  createProject,
  createAcceptanceProject,
  listProjects,
  demoProjects,
  deleteProject,
} from "../../lib/studio/repository";
import { ProjectSummary } from "../../lib/studio/types";
import { useAuthContext } from "../../context/AuthContext";
import { Action, Empty, Notice, Confirm, Confirmation } from "./Controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProjectLibrary() {
  const { user, isLoggedIn } = useAuthContext();
  return <LibraryContent key={`${user}:${isLoggedIn}`} />;
}
function LibraryContent() {
  const { isLoggedIn, user, openLogin } = useAuthContext(),
    router = useRouter();
  const [items, setItems] = useState<ProjectSummary[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [tab, setTab] = useState("all"),
    [dialog, setDialog] = useState(false),
    [name, setName] = useState(""),
    [demo, setDemo] = useState(true),
    [creating, setCreating] = useState(false),
    [sampleProgress, setSampleProgress] = useState(""),
    [confirm, setConfirm] = useState<Confirmation | null>(null);
  const refresh = useCallback(
    () =>
      demoProjects()
        .then(async (local) => {
          setError("");
          setItems(local);
          if (isLoggedIn) {
            const remote = await listProjects();
            setItems(
              [...remote, ...local].sort((a, b) =>
                b.updatedAt.localeCompare(a.updatedAt),
              ),
            );
          }
        })
        .catch((e) => setError(e instanceof Error ? e.message : "项目读取失败"))
        .finally(() => setLoading(false)),
    [isLoggedIn],
  );
  useEffect(() => {
    void refresh();
  }, [refresh, user]);
  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const p = await createProject(name.trim(), demo);
      setDialog(false);
      router.push(`/studio/${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }
  async function loadSample() {
    if (creating) return;
    setCreating(true);
    setError("");
    setSampleProgress("正在准备参考资产…");
    try {
      const project = await createAcceptanceProject(setSampleProgress);
      router.push(`/studio/${project.id}?step=assets`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "示例载入失败，请重试");
    } finally {
      setCreating(false);
      setSampleProgress("");
    }
  }
  const filtered = items.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (tab === "all" || p.mode === tab),
  );
  return (
    <main className="studio-page app-surface">
      <div className="studio-page-heading">
        <div>
          <p className="studio-eyebrow">VIDEOGAGA WORKSPACE</p>
          <h1>让故事，开始发生。</h1>
          <p>从第一行剧本，到最后一个镜头。在这里继续你的创作。</p>
        </div>
        <div className="studio-toolbar">
          <Link className="studio-button" href="/settings">
            <Settings2 size={16} />
            API 设置
          </Link>
          <Action
            primary
            disabled={creating}
            onClick={() => {
              setName("");
              setDemo(!isLoggedIn);
              setDialog(true);
            }}
          >
            <Plus size={18} />
            新建项目
          </Action>
        </div>
      </div>
      <section className="studio-welcome">
        <div>
          <span className="studio-tag">无需 API Key</span>
          <h2>先把完整流程走一遍</h2>
          <p>试写一个故事，整理资产与分镜，生成演示片段，导出可播放的视频。</p>
          <div className="studio-toolbar">
            <Action
              primary
              disabled={creating}
              onClick={() => void loadSample()}
            >
              <Clapperboard size={15} />
              {sampleProgress || "载入验收示例"}
            </Action>
            <Action
              disabled={creating}
              onClick={() => {
                setName("我的第一部漫剧");
                setDemo(true);
                setDialog(true);
              }}
            >
              <Play size={15} />
              开始本地演示
              <ArrowUpRight size={15} />
            </Action>
          </div>
          <p className="studio-helper" role="status">
            《极夜崩塌》验收节选 · 三场 / 18 镜头 / 10 项资产，含 7
            张参考图。每次载入为独立副本。
          </p>
          <p className="studio-helper">
            分镜为参考资产拼板，可继续生成本地演示片段；尚未生成 AI
            视频或真人配音。
          </p>
        </div>
        <div className="studio-welcome-art" aria-hidden="true">
          <div className="studio-film-frame">
            01<span>STORY</span>
          </div>
          <div className="studio-film-frame">
            02<span>SHOTS</span>
          </div>
          <div className="studio-film-frame">
            03<span>PLAY</span>
          </div>
        </div>
      </section>
      {error && (
        <Notice error>
          {error}
          <button
            onClick={() => void refresh()}
            className="studio-inline-action"
          >
            重试
          </button>
        </Notice>
      )}
      <div className="studio-library-bar">
        <div className="studio-tabs" role="tablist" aria-label="项目类型">
          {[
            ["all", "全部项目"],
            ["connected", "账号项目"],
            ["demo", "本地演示"],
          ].map(([id, label]) => (
            <button
              role="tab"
              aria-selected={tab === id}
              key={id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="studio-search">
          <Search size={17} />
          <input
            aria-label="搜索项目"
            placeholder="搜索项目名称"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <div className="studio-project-grid" aria-label="正在读取项目">
          {[1, 2, 3].map((i) => (
            <div key={i} className="studio-skeleton" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="studio-project-grid">
          {filtered.map((p, i) => (
            <article
              className="studio-project-card"
              key={p.id}
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <Link
                href={`/studio/${p.id}`}
                className={`studio-project-cover color-${i % 3}`}
              >
                <Clapperboard size={38} />
                <span className="studio-cover-title">
                  {p.name.slice(0, 12)}
                </span>
                <span className="studio-cover-arrow">
                  <ArrowUpRight size={20} />
                </span>
              </Link>
              <div className="studio-project-info">
                <Link href={`/studio/${p.id}`}>
                  <h2>{p.name}</h2>
                </Link>
                <div className="studio-meta">
                  <span>
                    {p.mode === "demo" ? (
                      <Monitor size={13} />
                    ) : (
                      <Cloud size={13} />
                    )}{" "}
                    {p.mode === "demo" ? "本地演示" : "账号项目"}
                  </span>
                  <time>
                    {new Date(p.updatedAt).toLocaleDateString("zh-CN")}
                  </time>
                </div>
                <button
                  className="studio-icon-button studio-project-delete"
                  aria-label={`删除项目 ${p.name}`}
                  onClick={() =>
                    setConfirm({
                      title: `删除「${p.name}」？`,
                      description:
                        "该项目将从列表移除。请先导出需要保留的内容。",
                      action: async () => {
                        try {
                          await deleteProject(p.id);
                          await refresh();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      },
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={search ? "没有找到匹配项目" : "你的下一个故事，从这里开始"}
          action={
            <Action
              primary
              onClick={() => {
                if (tab === "connected" && !isLoggedIn) {
                  openLogin();
                  return;
                }
                setDemo(tab !== "connected");
                setDialog(true);
              }}
            >
              <Plus size={16} />
              {tab === "connected" && !isLoggedIn ? "登录账号" : "新建项目"}
            </Action>
          }
        >
          {search ? "换一个关键词试试。" : "新建项目后，每次修改都会自动保存。"}
        </Empty>
      )}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="app-surface studio-dialog">
          <DialogHeader>
            <DialogTitle>开始一个新故事</DialogTitle>
          </DialogHeader>
          <label>
            项目名称
            <input
              autoFocus
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating) void create();
              }}
              placeholder="例如：灯塔的来信"
            />
          </label>
          <div className="studio-mode-choice">
            <button
              type="button"
              aria-pressed={demo}
              onClick={() => setDemo(true)}
            >
              <Monitor size={20} />
              <strong>本地演示</strong>
              <span>保存在本机，无需模型服务</span>
            </button>
            <button
              type="button"
              aria-pressed={!demo}
              onClick={() => {
                if (!isLoggedIn) {
                  setDialog(false);
                  openLogin();
                } else setDemo(false);
              }}
            >
              <Cloud size={20} />
              <strong>账号项目</strong>
              <span>登录后保存，使用自己的 API</span>
            </button>
          </div>
          {demo && (
            <p className="studio-helper">
              演示使用本地生成的示意画面与提示音，不代表 AI 实际效果。
            </p>
          )}
          {error && <Notice error>{error}</Notice>}
          <DialogFooter>
            <Action onClick={() => setDialog(false)}>取消</Action>
            <Action
              primary
              busy={creating}
              disabled={!name.trim()}
              onClick={() => void create()}
            >
              创建并进入
            </Action>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Confirm value={confirm} close={() => setConfirm(null)} />
    </main>
  );
}
