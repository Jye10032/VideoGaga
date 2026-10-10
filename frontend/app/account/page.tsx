"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, UserRound, LogOut, Settings2 } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { apiRequest } from "../lib/api/client";
import { User } from "../lib/api/auth";
import { Action, Empty, Notice } from "../components/studio/Controls";
export default function AccountPage() {
  const { user, isLoggedIn } = useAuthContext();
  return <AccountContent key={`${user}:${isLoggedIn}`} />;
}
function AccountContent() {
  const {
    isLoggedIn,
    openLogin,
    handleLogout,
    user: account,
  } = useAuthContext();
  const [user, setUser] = useState<User | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (isLoggedIn)
      apiRequest<User>("/api/v1/auth/me")
        .then((u) => {
          if (!cancelled) setUser(u);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, account]);
  if (!isLoggedIn)
    return (
      <main className="studio-page app-surface">
        <Empty
          title="你的创作，属于你的账号"
          action={
            <Action primary onClick={openLogin}>
              登录 / 注册
            </Action>
          }
        >
          登录后可保存账号项目并使用自定义 API。注册需要有效邀请码。
        </Empty>
        <Link href="/projects" className="studio-back">
          返回本地项目
        </Link>
      </main>
    );
  return (
    <main className="studio-page app-surface">
      <div className="studio-page-heading">
        <div>
          <p className="studio-eyebrow">ACCOUNT</p>
          <h1>账号与工作空间</h1>
          <p>管理账号信息和本机模型连接。</p>
        </div>
        <span className="studio-heading-icon">
          <UserRound />
        </span>
      </div>
      {error && <Notice error>{error}</Notice>}
      {user ? (
        <section className="studio-panel">
          <h2>{user.username}</h2>
          <dl className="studio-account-details">
            <div>
              <dt>邮箱</dt>
              <dd>
                {user.email.endsWith("@videogaga.local")
                  ? "未绑定邮箱"
                  : user.email}
              </dd>
            </div>
            <div>
              <dt>角色</dt>
              <dd>{user.role === "admin" ? "管理员" : "创作者"}</dd>
            </div>
            <div>
              <dt>注册时间</dt>
              <dd>{new Date(user.created_at).toLocaleString("zh-CN")}</dd>
            </div>
          </dl>
          <div className="studio-toolbar">
            <Link className="studio-button" href="/settings">
              <Settings2 size={16} />
              API 设置
            </Link>
            {user.role === "admin" && (
              <Link className="studio-button primary" href="/admin">
                <ShieldCheck size={16} />
                用户与邀请码
              </Link>
            )}
            <Action onClick={handleLogout}>
              <LogOut size={16} />
              退出登录
            </Action>
          </div>
        </section>
      ) : (
        !error && <p className="studio-helper">正在获取账号信息…</p>
      )}
      <Notice>
        API Key 仅保存在当前浏览器。退出登录会清除本机的账号 API
        配置和旧版项目缓存；本地演示项目会保留。
      </Notice>
    </main>
  );
}
