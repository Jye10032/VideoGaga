import WorkflowStepNav from "../../../components/workflow/WorkflowStepNav";
import WorkflowStepLayout from "../../../components/workflow/WorkflowStepLayout";
import { buildWorkflowQuery } from "../../../lib/workflowQuery";

export default async function ProStep7Page({
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
      currentStep={7}
      projectName={projectName}
      projectId={projectId}
      nameQuery={nameQuery}
    >
      <div className="grid gap-4">
        <div className="rounded-2xl p-4">
          <div className="flex items-center justify-end text-xs text-[var(--text-tertiary)]" />
          <div className="mx-auto mt-3 aspect-video w-full max-w-[960px] overflow-hidden rounded-xl bg-black/40 shadow-none">
            <video
              className="h-full w-full rounded-xl object-contain shadow-none"
              src="https://ehrtt5psqrsjiec7xeiv.exp.bcevod.com/mda-gbdwy51yk6553x66/_output/transgbdvch1pj69sr5k12wef/mda-gbdwy51yk6553x66.mp4"
              controls
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              playsInline
              preload="metadata"
            />
          </div>
          <div className="mt-3" />
        </div>

      </div>

      <WorkflowStepNav
        nextHref={`/workflows${nameQuery}`}
        nextLabel="导出视频"
        stepId={7}
        projectName={projectName}
      />
    </WorkflowStepLayout>
  );
}
