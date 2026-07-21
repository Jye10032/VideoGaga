import { redirect } from "next/navigation";
import { buildWorkflowQuery } from "../../lib/workflowQuery";

export default async function ProWorkflowPage({
  searchParams,
}: {
  searchParams?: Promise<{ name?: string; pid?: string }>;
}) {
  const resolvedParams = await (searchParams ?? Promise.resolve<{ name?: string; pid?: string }>({}));
  const projectName = resolvedParams?.name?.trim();
  const projectId = resolvedParams?.pid?.trim();
  const nameQuery = buildWorkflowQuery({ name: projectName, pid: projectId });
  redirect(`/workflows/pro/step-1${nameQuery}`);
}
