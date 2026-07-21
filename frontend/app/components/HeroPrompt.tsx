"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThemedIcon from "./ThemedIcon";

const titleText = "Video Gaga";
const subtitleText = "AI 漫剧创作平台";

export default function HeroPrompt({
  variant = "center",
  showInput = true,
}: {
  variant?: "center" | "top";
  showInput?: boolean;
}) {
  const router = useRouter();
  const [typedTitle] = useState(titleText);
  const [inputValue, setInputValue] = useState("");
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleCreate = () => {
    const name = inputValue.trim();
    if (!name) {
      return;
    }
    router.push(`/workflows?name=${encodeURIComponent(name)}`);
  };

  const sectionClass =
    variant === "top"
      ? "flex flex-col items-center justify-start py-4 sm:py-6"
      : "flex flex-1 flex-col items-center justify-center py-6 sm:py-10";
  const titleClass =
    variant === "top"
      ? "hero-title mt-2 text-3xl sm:text-4xl lg:text-5xl"
      : "hero-title mt-2 text-6xl sm:text-7xl lg:text-8xl";

  return (
    <section className={sectionClass}>
      <div className="mx-auto w-full max-w-2xl text-center">
        <h1 className={titleClass}>
          {typedTitle}
        </h1>
        <div className="hero-subtitle mt-2 text-xl sm:text-2xl lg:text-3xl">
          {subtitleText}
        </div>
        {showInput ? (
          <div
            ref={inputWrapRef}
            className="cinematic-input relative mt-6 flex min-h-[60px] w-full items-center overflow-hidden rounded-[30px] border border-[var(--surface-border-strong)] bg-[var(--surface-bg-active)] px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.45)] transition-all duration-300 ease-in-out backdrop-blur-[10px] focus-within:border-white/40 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] sm:rounded-[40px] sm:px-5 sm:py-3"
          >
            <textarea
              ref={inputRef}
              className="no-scrollbar flex-1 overflow-y-auto bg-transparent text-left text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none resize-none self-center h-6 leading-6 pb-0"
              placeholder="输入剧本名，例如：星际迷航, 开始你的生成创作之旅"
              rows={1}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleCreate();
                }
              }}
              style={{ scrollbarWidth: "none" }}
            />
            <button
              className={`absolute bottom-3 right-5 flex h-7 w-7 items-center justify-center rounded-full transition ${inputValue.trim()
                ? "bg-[rgb(var(--brand-rgb))] text-[var(--text-primary)]"
                : "bg-[var(--surface-bg-hover)] text-[var(--text-tertiary)]"
                }`}
              aria-label="创建新项目"
              title="创建新项目"
              onClick={handleCreate}
            >
              <ThemedIcon name="brush" className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
