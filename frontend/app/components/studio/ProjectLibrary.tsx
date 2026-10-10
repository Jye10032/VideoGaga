"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Clapperboard,
  ArrowRight,
  Trash2,
  Monitor,
  Cloud,
  Settings2,
  LayoutGrid,
  List,
  Clock3,
  X,
} from "lucide-react";
import {
  createProject,
  createAcceptanceProject,
  listProjects,
  demoProjects,
  deleteProject,
} from "../../lib/studio/repository";
import {
  lastStudioStep,
  studioHref,
  studioSteps,
} from "../../lib/studio/navigation";
import { ProjectSummary } from "../../lib/studio/types";
import { useAuthContext } from "../../context/AuthContext";
import { Action, Empty, Notice, Confirm, Confirmation } from "./Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ProjectLibrary({
  initialCreate = false,
}: {
  initialCreate?: boolean;
}) {
  const { user, isLoggedIn } = useAuthContext();
  return (
    <LibraryContent
      key={`${user}:${isLoggedIn}:${initialCreate}`}
      initialCreate={initialCreate}
    />
  );
}
function LibraryContent({ initialCreate }: { initialCreate: boolean }) {
  const { isLoggedIn, user, openLogin } = useAuthContext(),
    router = useRouter();
  const [items, setItems] = useState<ProjectSummary[]>([]),
    [lastSteps, setLastSteps] = useState<Record<string, number | undefined>>(
      {},
    ),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [tab, setTab] = useState("all"),
    [sort, setSort] = useState("updated"),
    [view, setView] = useState<"grid" | "list">("grid"),
    [dialog, setDialog] = useState(initialCreate),
    [name, setName] = useState(""),
    [demo, setDemo] = useState(!isLoggedIn),
    [creating, setCreating] = useState(false),
    [sampleProgress, setSampleProgress] = useState(""),
    [confirm, setConfirm] = useState<Confirmation | null>(null);
  const refresh = useCallback(
    () =>
      demoProjects()
        .then(async (local) => {
          setError("");
          const remember = (projects: ProjectSummary[]) => {
            setItems(projects);
            setLastSteps(
              Object.fromEntries(
                projects.map((p) => [p.id, lastStudioStep(p.id)]),
              ),
            );
          };
          remember(local);
          if (isLoggedIn) remember([...(await listProjects()), ...local]);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "项目读取失败"))
        .finally(() => setLoading(false)),
    [isLoggedIn],
  );
  useEffect(() => {
    void refresh();
  }, [refresh, user]);

  function openCreate() {
    setName("");
    setDemo(tab === "demo" || !isLoggedIn);
    setError("");
    setDialog(true);
  }
  function closeDialog(open: boolean) {
    if (creating) return;
    setDialog(open);
    if (!open && initialCreate) router.replace("/projects", { scroll: false });
  }
  async function create() {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      const p = await createProject(name.trim(), demo);
      router.push(studioHref(p.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
      setCreating(false);
    }
  }
  async function loadSample() {
    if (creating) return;
    setCreating(true);
    setError("");
    setSampleProgress("正在准备参考图…");
    try {
      const project = await createAcceptanceProject(setSampleProgress);
      router.push(studioHref(project.id, 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "示例载入失败，请重试");
      setCreating(false);
      setSampleProgress("");
    }
  }
  const keyword = search.trim().toLowerCase();
  const filtered = items
    .filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) &&
        (tab === "all" || p.mode === tab),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "zh-CN")
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  const tabs = [
    { id: "all", label: "全部", count: items.length },
    {
      id: "connected",
      label: "账号项目",
      count: items.filter((p) => p.mode === "connected").length,
    },
    {
      id: "demo",
      label: "本地演示",
      count: items.filter((p) => p.mode === "demo").length,
    },
  ];

  return (
    <main className="studio-page studio-library app-surface">
      <div className="studio-page-heading">
        <div>
          <h1>我的项目</h1>
          <p>管理剧本、资产与分镜，继续上次编辑。</p>
        </div>
        <Action primary disabled={creating} onClick={openCreate}>
          <Plus size={16} />
          新建项目
        </Action>
      </div>

      <div className="studio-library-shortcuts">
        <section className="studio-sample-shortcut" id="sample">
          <span className="studio-sample-thumb">
            <Image
              src="/demo-assets/extreme-night-v1/ruined-street.webp"
              fill
              sizes="72px"
              alt="极夜崩塌示例场景"
            />
          </span>
          <div>
            <h2>
              极夜崩塌 <span>示例项目</span>
            </h2>
            <p>18 个分镜 · 10 项资产 · 无需 API Key</p>
          </div>
          <Action
            disabled={creating}
            busy={!!sampleProgress}
            onClick={() => void loadSample()}
          >
            {sampleProgress ? "载入中" : "使用示例"}
            <ArrowRight size={14} />
          </Action>
        </section>
        <Link className="studio-settings-shortcut" href="/settings">
          <Settings2 size={20} />
          <div>
            <h2>模型与 API</h2>
            <p>设置剧本、图片、视频和配音模型</p>
          </div>
          <ArrowRight size={16} />
        </Link>
      </div>
      <p className="studio-library-caption" role="status">
        {sampleProgress ||
          "示例会创建独立副本，包含参考图与分镜拼板；演示片段和提示音可在工作台生成。"}
      </p>
      {error && !dialog && (
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

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <div className="studio-library-bar">
          <TabsList variant="line" aria-label="项目类型">
            {tabs.map((item) => (
              <TabsTrigger value={item.id} key={item.id}>
                {item.label}
                <span className="studio-filter-count">{item.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="studio-library-tools">
            <div className="studio-library-search">
              <Search size={15} />
              <Input
                aria-label="搜索项目"
                placeholder="搜索项目名称"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="清空搜索"
                  onClick={() => setSearch("")}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
            <select
              className="studio-library-sort"
              aria-label="项目排序"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="updated">最近修改</option>
              <option value="name">名称排序</option>
            </select>
            <div
              className="studio-view-switch"
              role="group"
              aria-label="项目视图"
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="卡片视图"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <LayoutGrid size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="列表视图"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>
        <TabsContent value={tab}>
          {loading ? (
            <div className="studio-project-grid" aria-label="正在读取项目">
              {[1, 2, 3].map((i) => (
                <div key={i} className="studio-skeleton" />
              ))}
            </div>
          ) : filtered.length ? (
            <div
              className={`studio-projects ${view === "list" ? "is-list" : "is-grid"}`}
            >
              {filtered.map((p) => {
                const lastStep = lastSteps[p.id];
                const href = studioHref(p.id, lastStep ?? 0);
                return (
                  <article className="studio-library-project" key={p.id}>
                    <Link href={href} className="studio-library-project-main">
                      <span className="studio-project-symbol">
                        <Clapperboard size={22} />
                      </span>
                      <div className="studio-library-project-details">
                        <h2 title={p.name}>{p.name}</h2>
                        <div className="studio-meta">
                          <span>
                            {p.mode === "demo" ? (
                              <Monitor size={12} />
                            ) : (
                              <Cloud size={12} />
                            )}
                            {p.mode === "demo" ? "本地演示" : "账号项目"}
                          </span>
                          {lastStep !== undefined && (
                            <span>上次编辑：{studioSteps[lastStep].label}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="studio-project-updated">
                      <Clock3 size={12} />
                      <time dateTime={p.updatedAt}>
                        {new Date(p.updatedAt).toLocaleString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>{" "}
                      修改
                    </div>
                    <div className="studio-project-links">
                      <Link href={studioHref(p.id, 0)}>剧本</Link>
                      <Link href={studioHref(p.id, 1)}>资产</Link>
                      <Link href={studioHref(p.id, 2)}>分镜</Link>
                      <Link className="studio-resume-link" href={href}>
                        继续编辑
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="studio-library-delete"
                      aria-label={`删除项目 ${p.name}`}
                      onClick={() =>
                        setConfirm({
                          title: `删除「${p.name}」？`,
                          description:
                            "删除后无法恢复。请先在工作台导出需要保留的内容。",
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
                      <Trash2 size={14} />
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title={
                keyword
                  ? "没有匹配的项目"
                  : tab === "connected" && !isLoggedIn
                    ? "登录后查看账号项目"
                    : "暂无项目"
              }
              action={
                keyword ? (
                  <Action onClick={() => setSearch("")}>清空搜索</Action>
                ) : (
                  <Action
                    primary
                    onClick={() =>
                      tab === "connected" && !isLoggedIn
                        ? openLogin()
                        : openCreate()
                    }
                  >
                    <Plus size={15} />
                    {tab === "connected" && !isLoggedIn
                      ? "登录账号"
                      : "新建项目"}
                  </Action>
                )
              }
            >
              {keyword
                ? "换一个名称，或清空搜索查看全部项目。"
                : tab === "connected" && !isLoggedIn
                  ? "账号项目保存在云端，本地演示仍可直接使用。"
                  : "新建项目后粘贴剧本，或使用上方示例查看资产与分镜。"}
            </Empty>
          )}
        </TabsContent>
      </Tabs>
      {!loading && filtered.length > 0 && (
        <p className="studio-library-caption">
          {filtered.length} 个项目
          {tab === "demo" ? " · 仅保存在当前浏览器" : ""}
        </p>
      )}

      <Dialog open={dialog} onOpenChange={closeDialog}>
        <DialogContent className="app-surface studio-dialog">
          <DialogHeader>
            <DialogTitle>新建项目</DialogTitle>
            <DialogDescription>
              创建后粘贴剧本，开始整理资产与分镜。
            </DialogDescription>
          </DialogHeader>
          <label>
            项目名称
            <Input
              autoFocus
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing)
                  void create();
              }}
              placeholder="例如：灯塔的来信"
            />
          </label>
          <div className="studio-mode-choice">
            <button
              type="button"
              disabled={creating}
              aria-pressed={demo}
              onClick={() => setDemo(true)}
            >
              <Monitor size={20} />
              <strong>本地演示</strong>
              <span>保存在当前浏览器，使用示意素材</span>
            </button>
            <button
              type="button"
              disabled={creating}
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
              <span>登录后保存到云端，使用自己的 API</span>
            </button>
          </div>
          {demo && (
            <p className="studio-helper">
              演示不调用 AI 模型，画面为示意图，配音为提示音。
            </p>
          )}
          {error && <Notice error>{error}</Notice>}
          <DialogFooter>
            <Action disabled={creating} onClick={() => closeDialog(false)}>
              取消
            </Action>
            <Action
              primary
              busy={creating}
              disabled={!name.trim()}
              onClick={() => void create()}
            >
              创建项目
            </Action>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Confirm value={confirm} close={() => setConfirm(null)} />
    </main>
  );
}
