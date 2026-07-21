import WorkflowStepLayout from "../../../components/workflow/WorkflowStepLayout";
import WorkflowAssetsClient from "../../../components/workflow/WorkflowAssetsClient";
import { buildWorkflowQuery } from "../../../lib/workflowQuery";

export default async function ProStep3Page({
  searchParams,
}: {
  searchParams?: Promise<{ name?: string; pid?: string }>;
}) {
  const resolvedParams = await (searchParams ?? Promise.resolve<{ name?: string; pid?: string }>({}));
  const projectName = resolvedParams?.name?.trim();
  const projectId = resolvedParams?.pid?.trim();
  const nameQuery = buildWorkflowQuery({ name: projectName, pid: projectId });

  return (
    <WorkflowStepLayout
      currentStep={3}
      projectName={projectName}
      projectId={projectId}
      nameQuery={nameQuery}
    >
      <WorkflowAssetsClient
        nextHref={`/workflows/pro/step-4${nameQuery}`}
        stepId={3}
        projectName={projectName}
        projectId={projectId}
      />
    </WorkflowStepLayout>
  );
}
