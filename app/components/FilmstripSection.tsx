"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const filmFrames = Array.from({ length: 10 }, (_, index) => index);

export default function FilmstripSection({
  ctaText = "点击探索更多灵感",
  linkHref,
}: {
  ctaText?: string;
  linkHref?: string;
}) {
  const filmstripRef = useRef<HTMLDivElement>(null);
  const baseMetricsRef = useRef({
    dpr: 1,
    innerWidth: 0,
    outerWidth: 0,
  });

  useEffect(() => {
    const updateBase = () => {
      baseMetricsRef.current = {
        dpr: window.devicePixelRatio || 1,
        innerWidth: window.innerWidth || 0,
        outerWidth: window.outerWidth || window.innerWidth || 0,
      };
    };

    const updateScale = () => {
      const innerWidth = window.innerWidth || 0;
      const base = baseMetricsRef.current;
      const currentDpr = window.devicePixelRatio || 1;
      const zoomFromDpr = base.dpr ? currentDpr / base.dpr : 1;
      const useDpr = Math.abs(zoomFromDpr - 1) > 0.02;
      let zoomRatio = useDpr ? zoomFromDpr : 1;

      const outerWidth = window.outerWidth || innerWidth;
      const outerDelta = Math.abs(outerWidth - base.outerWidth);
      const innerDelta = Math.abs(innerWidth - base.innerWidth);
      const looksLikeZoom = outerDelta < 20 && innerDelta > 30;
      if (!useDpr && looksLikeZoom && innerWidth > 0 && base.innerWidth > 0) {
        zoomRatio = base.innerWidth / innerWidth;
      }

      const physicalWidth = innerWidth * zoomRatio;
      const widthScale = 1 + (base.innerWidth - physicalWidth) / 900;
      const rawScale = widthScale * (1 / zoomRatio);
      const minScale = zoomRatio < 1 ? 1 / zoomRatio : 1;
      const scale = Math.min(3.6, Math.max(minScale, rawScale));
      filmstripRef.current?.style.setProperty(
        "--film-scale",
        scale.toFixed(3),
      );
    };

    let rafId = 0;
    const scheduleResize = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        updateBase();
        updateScale();
      });
    };

    updateBase();
    updateScale();
    window.addEventListener("resize", scheduleResize);
    window.visualViewport?.addEventListener("resize", scheduleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => scheduleResize());
      resizeObserver.observe(document.documentElement);
    }

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <section className="mt-auto w-full pb-4">
      <div className="w-full">
        {/* <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-wide">灵感广场</h2>
          <div className="mt-3 flex items-center justify-center gap-3 text-sm text-[var(--text-tertiary)]">
            <span className="inline-flex h-5 w-1.5 rounded-full bg-white/60" />
            <span>下滑探索更多灵感</span>
            <span className="inline-flex h-5 w-1.5 rounded-full bg-white/60" />
          </div>
        </div> */}
        <div className="mt-6 overflow-visible -mx-4 sm:-mx-6 lg:-mx-10">
          <div className="filmstrip-cta-wrap mb-4 flex items-center justify-center gap-3 text-lg text-[var(--text-primary)]">
            <span className="pulse-arrow text-[var(--text-tertiary)]">‹‹‹</span>
            {linkHref ? (
              <Link
                className="filmstrip-cta px-6 py-2.5 font-semibold transition hover:text-[var(--text-primary)]"
                href={linkHref}
              >
                {ctaText}
              </Link>
            ) : (
              <span className="filmstrip-cta px-6 py-2.5 font-semibold text-[var(--text-primary)]">
                {ctaText}
              </span>
            )}
            <span className="pulse-arrow text-[var(--text-tertiary)]">›››</span>
          </div>
          {/* <div className="filmstrip group" ref={filmstripRef}>
            <div className="filmstrip-track">
              {[...filmFrames, ...filmFrames].map((frame, index) => (
                <div
                  key={`${frame}-${index}`}
                  className="film-frame sketch-frame"
                />
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}
