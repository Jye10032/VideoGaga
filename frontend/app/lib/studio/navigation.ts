// Only remembers navigation in this browser; project content stays in its repository.
export const studioSteps = [
  { key: "script", label: "剧本" },
  { key: "assets", label: "资产" },
  { key: "shots", label: "分镜" },
  { key: "video", label: "视频" },
  { key: "audio", label: "配音" },
  { key: "export", label: "导出" },
] as const;

export function parseStudioStep(value?: string | string[]) {
  const index = studioSteps.findIndex((step) => step.key === value);
  return index < 0 ? undefined : index;
}

export function lastStudioStep(id: string) {
  try {
    return parseStudioStep(
      localStorage.getItem(`gaga-last-step:v1:${id}`) || undefined,
    );
  } catch {
    return undefined;
  }
}

export function rememberStudioStep(id: string, index: number) {
  try {
    localStorage.setItem(`gaga-last-step:v1:${id}`, studioSteps[index].key);
  } catch {
    // Navigation still works when browser storage is unavailable.
  }
}

export function studioHref(id: string, index = 0) {
  return `/studio/${encodeURIComponent(id)}?step=${studioSteps[index].key}`;
}
