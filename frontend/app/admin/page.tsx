"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api/client";
import { User } from "../lib/api/auth";
import { useAuthContext } from "../context/AuthContext";
import {
  Action,
  Confirm,
  Confirmation,
  Empty,
  Notice,
} from "../components/studio/Controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
type ManagedUser = User & { is_active: boolean; invite_code: string | null };
type Invite = {
  id: string;
  code: string;
  is_admin_code: boolean;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  users: { id: string; username: string }[];
};
export default function AdminPage() {
  const { user, isLoggedIn } = useAuthContext();
  return <AdminContent key={`${user}:${isLoggedIn}`} />;
}
function AdminContent() {
  const { isLoggedIn, openLogin, user: account } = useAuthContext();
  const [me, setMe] = useState<User | null>(null),
    [users, setUsers] = useState<ManagedUser[]>([]),
    [invites, setInvites] = useState<Invite[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(isLoggedIn),
    [checkedAt, setCheckedAt] = useState(0),
    [confirm, setConfirm] = useState<Confirmation | null>(null),
    [tab, setTab] = useState("users"),
    [dialog, setDialog] = useState(false),
    [code, setCode] = useState(""),
    [uses, setUses] = useState(1),
    [adminCode, setAdminCode] = useState(false);
  const load = useCallback(() => {
    if (!isLoggedIn) return Promise.resolve();
    return apiRequest<User>("/api/v1/auth/me")
      .then(async (current) => {
        setError("");
        setCheckedAt(Date.now());
        setMe(current);
        if (current.role !== "admin") return;
        const [u, c] = await Promise.all([
          apiRequest<ManagedUser[]>("/api/v1/admin/users"),
          apiRequest<Invite[]>("/api/v1/admin/invite-codes"),
        ]);
        setUsers(u);
        setInvites(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);
  useEffect(() => {
    void load();
  }, [load, account]);
  async function mutate(path: string, method: string, body?: unknown) {
    setLoading(true);
    setMessage("");
    try {
      await apiRequest(path, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      setMessage("操作已保存");
      setDialog(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  if (!isLoggedIn)
    return (
      <main className="studio-page app-surface">
        <Empty
          title="管理员登录"
          action={
            <Action primary onClick={openLogin}>
              登录
            </Action>
          }
        >
          此页面仅对管理员开放。
        </Empty>
      </main>
    );
  if (me && me.role !== "admin")
    return (
      <main className="studio-page app-surface">
        <Empty
          title="当前账号没有管理权限"
          action={
            <Link href="/projects" className="studio-button">
              返回项目库
            </Link>
          }
        >
          项目创作不需要管理员权限。
        </Empty>
      </main>
    );
  return (
    <main className="studio-page app-surface">
      <div className="studio-page-heading">
        <div>
          <Link href="/account" className="studio-back">
            ← 账号管理
          </Link>
          <p className="studio-eyebrow">ADMINISTRATION</p>
          <h1>用户与邀请</h1>
          <p>控制访问权限，保留创作者的项目和记录。</p>
        </div>
        <span className="studio-heading-icon">
          <ShieldCheck />
        </span>
      </div>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="studio-library-bar">
        <div className="studio-tabs" role="tablist" aria-label="管理类别">
          <button
            role="tab"
            aria-selected={tab === "users"}
            onClick={() => setTab("users")}
          >
            用户 {users.length}
          </button>
          <button
            role="tab"
            aria-selected={tab === "invites"}
            onClick={() => setTab("invites")}
          >
            邀请码 {invites.length}
          </button>
        </div>
        <div className="studio-toolbar">
          <Action
            busy={loading}
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            <RefreshCw size={15} />
            刷新
          </Action>
          {tab === "invites" && me && (
            <Action
              primary
              onClick={() => {
                setCode(crypto.randomUUID().replaceAll("-", "").slice(0, 20));
                setUses(1);
                setAdminCode(false);
                setDialog(true);
              }}
            >
              <Plus size={15} />
              创建邀请码
            </Action>
          )}
        </div>
      </div>
      <div className="studio-panel studio-table-wrap">
        {tab === "users" ? (
          <table className="studio-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.username}
                    {u.id === me?.id && "（你）"}
                    <div className="studio-helper">{u.email}</div>
                  </td>
                  <td>{u.role === "admin" ? "管理员" : "创作者"}</td>
                  <td>{u.is_active ? "启用" : "已停用"}</td>
                  <td>{new Date(u.created_at).toLocaleDateString("zh-CN")}</td>
                  <td>
                    <Action
                      disabled={loading || u.id === me?.id}
                      onClick={() =>
                        setConfirm({
                          title: `${u.is_active ? "停用" : "启用"} ${u.username}？`,
                          description: u.is_active
                            ? "该用户将无法继续访问账号，但项目和历史记录会保留。"
                            : "该用户将恢复账号访问权限。",
                          action: () =>
                            mutate(`/api/v1/admin/users/${u.id}`, "PATCH", {
                              is_active: !u.is_active,
                            }),
                        })
                      }
                    >
                      {u.is_active ? "停用" : "启用"}
                    </Action>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="studio-table">
            <thead>
              <tr>
                <th>邀请码</th>
                <th>授予角色</th>
                <th>使用情况</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((c) => {
                const expired =
                  !!c.expires_at &&
                  new Date(
                    c.expires_at + (!c.expires_at.endsWith("Z") ? "Z" : ""),
                  ).getTime() < checkedAt;
                return (
                  <tr key={c.id}>
                    <td>
                      <code>{c.code}</code>
                    </td>
                    <td>{c.is_admin_code ? "管理员" : "创作者"}</td>
                    <td>
                      {c.used_count} / {c.max_uses || "不限"}
                    </td>
                    <td>
                      {expired
                        ? "已停用"
                        : c.max_uses > 0 && c.used_count >= c.max_uses
                          ? "已用完"
                          : "可使用"}
                    </td>
                    <td>
                      <Action
                        disabled={loading || expired}
                        onClick={() =>
                          setConfirm({
                            title: "停用这个邀请码？",
                            description:
                              "停止后续注册，已经注册的用户与项目不受影响。",
                            action: () =>
                              mutate(
                                `/api/v1/admin/invite-codes/${c.id}`,
                                "DELETE",
                              ),
                          })
                        }
                      >
                        停用
                      </Action>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="app-surface studio-dialog">
          <DialogHeader>
            <DialogTitle>创建邀请码</DialogTitle>
          </DialogHeader>
          <label>
            邀请码
            <input
              value={code}
              minLength={8}
              maxLength={32}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label>
            可使用次数
            <input
              type="number"
              min={1}
              max={1000}
              value={uses}
              onChange={(e) =>
                setUses(
                  Math.max(1, Math.min(1000, Number(e.target.value) || 1)),
                )
              }
            />
          </label>
          <label>
            授予角色
            <select
              value={adminCode ? "admin" : "user"}
              onChange={(e) => setAdminCode(e.target.value === "admin")}
            >
              <option value="user">创作者</option>
              <option value="admin">管理员</option>
            </select>
          </label>
          {adminCode && (
            <Notice>使用此邀请码的人将获得用户与邀请码管理权限。</Notice>
          )}
          <DialogFooter>
            <Action onClick={() => setDialog(false)}>取消</Action>
            <Action
              primary
              busy={loading}
              disabled={!/^[a-zA-Z0-9_-]{8,32}$/.test(code)}
              onClick={() =>
                void mutate("/api/v1/admin/invite-codes", "POST", {
                  code,
                  is_admin_code: adminCode,
                  max_uses: uses,
                })
              }
            >
              创建
            </Action>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Confirm value={confirm} close={() => setConfirm(null)} />
    </main>
  );
}
