import HeroPrompt from "./components/HeroPrompt";
import FilmstripSection from "./components/FilmstripSection";

export default function Home() {
  return (
    <div className="bg-black text-[var(--text-primary)]">
      <section className="relative min-h-[100svh] overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="https://ehrtt5psqrsjiec7xeiv.exp.bcevod.com/mda-gbdwy51yk6553x66/_output/transgbdvch1pj69sr5k12wef/mda-gbdwy51yk6553x66.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 flex min-h-[100svh] flex-col px-6 text-center">
          <div className="flex flex-1 items-center justify-center">
            <div className="flex w-full max-w-3xl flex-col items-center gap-6">
              <HeroPrompt variant="center" showInput={false} />
              <p className="text-sm text-white/90">
                用一句话开启你的 AI 漫剧创作之旅
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="inline-flex rounded-full border border-white/18 bg-white/7 px-3 py-1 text-white/90">
                  一键生成脚本
                </span>
                <span className="inline-flex rounded-full border border-white/18 bg-white/7 px-3 py-1 text-white/90">
                  场景与分镜
                </span>
                <span className="inline-flex rounded-full border border-white/18 bg-white/7 px-3 py-1 text-white/90">
                  角色与道具
                </span>
                <span className="inline-flex rounded-full border border-white/18 bg-white/7 px-3 py-1 text-white/90">
                  自动配音
                </span>
              </div>
            </div>
          </div>
          <div className="pb-8">
            <FilmstripSection linkHref="/inspiration" ctaText="探索更多灵感" />
          </div>
        </div>
      </section>
    </div>
  );
}
