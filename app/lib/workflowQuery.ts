export type WorkflowQueryInput = {
  name?: string | null;
  pid?: string | null;
};

function safeTrim(value?: string | null): string {
  return value?.trim() || "";
}

export function buildWorkflowQuery(params: WorkflowQueryInput): string {
  const query = new URLSearchParams();
  const name = safeTrim(params.name);
  const pid = safeTrim(params.pid);

  if (name) {
    query.set("name", name);
  }
  if (pid) {
    query.set("pid", pid);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

