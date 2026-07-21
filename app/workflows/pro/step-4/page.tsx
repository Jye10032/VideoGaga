import WorkflowStepLayout from "../../../components/workflow/WorkflowStepLayout";
import WorkflowStoryboardsClient from "../../../components/workflow/WorkflowStoryboardsClient";
import { buildWorkflowQuery } from "../../../lib/workflowQuery";

export default async function ProStep4Page({
  searchParams,
}: {
  searchParams?: Promise<{ name?: string; pid?: string }>;
}) {
  const resolvedParams = await (searchParams ?? Promise.resolve<{ name?: string; pid?: string }>({}));
  const projectName = resolvedParams?.name?.trim();
  const projectId = resolvedParams?.pid?.trim();
  const nameQuery = buildWorkflowQuery({ name: projectName, pid: projectId });
  const mockStoryboards = [
    {
      id: "shot-1",
      scene: "樱花河岸",
      characters: ["小可爱", "兔子"],
      props: ["信件"],
      description:
        "樱花树下，小可爱和兔子面对面站着，花瓣缓慢飘落。",
      dialogue: "我们约好了，每当想念对方的时候……",
      speaker: "小可爱",
      voiceStyle: "活泼女声",
      camera: "静止",
      duration: 5,
      mode: "图生视频",
    },
    {
      id: "shot-2",
      scene: "樱花河岸",
      characters: ["小可爱"],
      props: ["画册"],
      description: "小可爱把画册递给兔子，镜头轻微推近手中的画。",
      dialogue: "这是我刚画的樱花。",
      speaker: "小可爱",
      voiceStyle: "温润男声",
      camera: "缓慢推近",
      duration: 4,
      mode: "图生视频",
    },
    {
      id: "shot-3",
      scene: "车站黄昏",
      characters: ["兔子"],
      props: ["行李箱"],
      description: "列车缓慢驶离，兔子回头望向站台。",
      dialogue: "等我回来的那天，我们还在那棵樱花树下见。",
      speaker: "兔子",
      voiceStyle: "旁白",
      camera: "缓慢推近",
      duration: 4,
      mode: "多参模式",
    },
    {
      id: "shot-4",
      scene: "车站黄昏",
      characters: ["小可爱"],
      props: ["信封"],
      description: "站台上，小可爱挥手告别，手里紧握着信封。",
      dialogue: "我会一直等你。",
      speaker: "小可爱",
      voiceStyle: "柔和女声",
      camera: "缓慢拉远",
      duration: 5,
      mode: "多参模式",
    },
  ];
  const availableScenes = ["樱花河岸", "车站黄昏", "房间 · 夜", "街道 · 小雨"];

  return (
    <WorkflowStepLayout
      currentStep={4}
      projectName={projectName}
      projectId={projectId}
      nameQuery={nameQuery}
    >
      <WorkflowStoryboardsClient
        initialStoryboards={mockStoryboards}
        availableScenes={availableScenes}
        nextHref={`/workflows/pro/step-7${nameQuery}`}
        stepId={4}
        projectName={projectName}
      />
    </WorkflowStepLayout>
  );
}
