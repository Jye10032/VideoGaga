import WorkflowStep2Client from "../../../components/workflow/WorkflowStep2Client";
import WorkflowStepLayout from "../../../components/workflow/WorkflowStepLayout";
import { buildWorkflowQuery } from "../../../lib/workflowQuery";

export default async function ProStep2Page({
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
      currentStep={2}
      projectName={projectName}
      projectId={projectId}
      nameQuery={nameQuery}
    >
      <WorkflowStep2Client
        projectName={projectName}
        projectId={projectId}
        backHref={`/workflows/pro/step-1${nameQuery}`}
        nextHref={`/workflows/pro/step-3${nameQuery}`}
        stepId={2}
      />
    </WorkflowStepLayout>
  );
}
