"use client";

type StoryModeToggleProps = {
  value: "ai" | "self";
  onChange: (value: "ai" | "self") => void;
};

const modes = [
  { id: "ai", label: "AI 起稿" },
  { id: "self", label: "自己写" },
] as const;

export default function StoryModeToggle({
  value,
  onChange,
}: StoryModeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] p-1 text-xs text-[var(--text-primary)]">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`btn-segment btn-segment-sm ${
              value === mode.id
                ? "bg-[rgb(var(--brand-rgb))] text-[#fff] shadow-none"
                : "text-[var(--text-primary)] hover:bg-[var(--surface-bg-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
