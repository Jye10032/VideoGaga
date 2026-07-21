"use client";

import { useEffect, useState } from "react";
import HeroPrompt from "../components/HeroPrompt";

const cards = [180, 220, 160, 260, 200, 240, 190, 280, 210, 230, 170, 250];

const mockDetail = {
  author: "灵感作者 · Aurora",
  tagline: "科幻叙事 / 情感向",
  story:
    "在星际迁徙的年代，一位守望者用最缓慢的方式记录每一颗行星的日落，把那些短暂的光影编织成一部关于告别与重逢的故事。",
  video:
    "https://ehrtt5psqrsjiec7xeiv.exp.bcevod.com/mda-gbdwy51yk6553x66/_output/transgbdvch1pj69sr5k12wef/mda-gbdwy51yk6553x66.mp4",
};

export default function Inspiration() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) {
      document.documentElement.classList.remove("workflow-scroll-lock");
      document.body.classList.remove("workflow-scroll-lock");
      return;
    }
    document.documentElement.classList.add("workflow-scroll-lock");
    document.body.classList.add("workflow-scroll-lock");
    return () => {
      document.documentElement.classList.remove("workflow-scroll-lock");
      document.body.classList.remove("workflow-scroll-lock");
    };
  }, [activeIndex]);
  return (
    <main className="inspiration-page page-slide-up relative min-h-screen">
      <div className="box-border flex min-h-screen w-full flex-col pb-16 pt-28 px-6">
        <div className="flex items-center justify-between">
          <div />
          <span className="text-xs inspiration-muted">
            共 {cards.length} 个灵感
          </span>
        </div>

        <div className="mt-6">
          <HeroPrompt variant="top" />
        </div>

        <div className="mt-10 flex-1 overflow-y-auto" id="inspiration-grid">
          <div className="masonry columns-1 sm:columns-2 lg:columns-3 xl:columns-4">
            {cards.map((height, index) => (
              <div key={`${height}-${index}`} className="masonry-item mb-5">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="inspiration-card group w-full rounded-2xl p-3 text-left transition"
                >
                  <div
                    className="loading-gradient w-full rounded-xl"
                    style={{ height: `${height}px` }}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs inspiration-muted">
                    <span>灵感卡片 #{index + 1}</span>
                    <span className="text-[10px] inspiration-muted">
                      INSPIRE
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeIndex !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onWheel={(event) => event.preventDefault()}
            onTouchMove={(event) => event.preventDefault()}
            onClick={() => setActiveIndex(null)}
          />
          <div className="relative z-10 flex h-[calc(100vh-48px)] w-[calc(100vw-48px)] max-w-none rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-bg-active)] p-6 text-[var(--text-primary)] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--surface-border-strong)] bg-[var(--surface-bg-hover)] text-[var(--text-primary)] transition hover:bg-white/20"
              aria-label="关闭"
            >
              ×
            </button>
            <div className="grid w-full gap-6 lg:grid-cols-[1.7fr_1fr]">
              <div className="rounded-2xl bg-[var(--surface-bg-active)] p-4">
                <div className="h-full w-full overflow-hidden rounded-xl bg-[var(--surface-bg)]">
                  <video
                    className="h-full w-full object-cover"
                    src={mockDetail.video}
                    controls
                    playsInline
                    preload="metadata"
                  />
                </div>
              </div>
              <div className="flex h-full flex-col gap-4 rounded-2xl bg-[var(--surface-bg-hover)] p-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
                    作者
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {mockDetail.author}
                  </div>
                  <div className="mt-1 text-sm text-[var(--text-tertiary)]">
                    {mockDetail.tagline}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg-hover)] p-4 text-sm text-[var(--text-primary)]">
                  <div className="text-xs uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
                    故事设定
                  </div>
                  <p className="mt-3 leading-relaxed">{mockDetail.story}</p>
                </div>
                <div className="mt-auto">
                  <button className="w-full rounded-2xl bg-[#72d56a] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-105">
                    我要创作
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
