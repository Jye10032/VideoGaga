import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  FolderOpen,
  Plus,
  Settings2,
} from "lucide-react";

export default function Home() {
  return (
    <main className="home-launcher">
      <video
        className="home-launcher-video"
        src="https://ehrtt5psqrsjiec7xeiv.exp.bcevod.com/mda-gbdwy51yk6553x66/_output/transgbdvch1pj69sr5k12wef/mda-gbdwy51yk6553x66.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
      <div className="home-launcher-shade" />
      <section className="home-launcher-panel">
        <div className="home-launcher-brand">
          <Clapperboard size={20} />
          <span>Video Gaga</span>
          <span>AI 漫剧工作台</span>
        </div>
        <h1>开始创作</h1>
        <p>编写剧本、整理参考资产、制作分镜，生成视频与配音。</p>
        <div className="home-launcher-actions">
          <Link className="home-launcher-create" href="/projects?create=1">
            <Plus size={18} />
            新建项目
            <ArrowRight size={17} />
          </Link>
          <Link href="/projects">
            <FolderOpen size={18} />
            我的项目
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="home-launcher-links">
          <Link href="/projects#sample">
            <Clapperboard size={16} />
            <div>
              <strong>使用示例项目</strong>
              <span>查看剧本、参考图和 18 个分镜，无需 API Key</span>
            </div>
            <ArrowRight size={16} />
          </Link>
          <Link href="/settings">
            <Settings2 size={16} />
            <div>
              <strong>连接模型服务</strong>
              <span>自定义服务地址、API Key 与模型名称</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="home-launcher-footer">
          <span>本地演示免登录</span>
          <span>账号项目保存到云端</span>
          <Link href="/inspiration">
            浏览灵感
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </main>
  );
}
