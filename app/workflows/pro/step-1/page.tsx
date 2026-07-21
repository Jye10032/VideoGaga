import WorkflowStep1Client from "../../../components/workflow/WorkflowStep1Client";
import WorkflowStepLayout from "../../../components/workflow/WorkflowStepLayout";
import { buildWorkflowQuery } from "../../../lib/workflowQuery";

export default async function ProStep1Page({
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
      currentStep={1}
      projectName={projectName}
      projectId={projectId}
      nameQuery={nameQuery}
      contentClassName="pl-6"
    >
      <WorkflowStep1Client
        projectName={projectName}
        nextHref={`/workflows/pro/step-2${nameQuery}`}
        stepId={1}
      />
    </WorkflowStepLayout>
  );
}
