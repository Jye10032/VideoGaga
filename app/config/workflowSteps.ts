export type WorkflowStep = {
  id: number;
  label: string;
  route: string;
  enabled?: boolean;
  icon: string;
};

export const workflowSteps: WorkflowStep[] = [
  { id: 1, label: "参数设定", route: "/workflows/pro/step-1", enabled: true, icon: "step-config" },
  { id: 2, label: "故事设定", route: "/workflows/pro/step-2", enabled: true, icon: "step-story" },
  {
    id: 3,
    label: "场景 / 角色 / 道具",
    route: "/workflows/pro/step-3",
    enabled: true,
    icon: "step-assets",
  },
  { id: 4, label: "分镜脚本", route: "/workflows/pro/step-4", enabled: true, icon: "step-storyboard" },
  {
    id: 5,
    label: "批量生成分镜视频",
    route: "/workflows/pro/step-5",
    enabled: false,
    icon: "step-video",
  },
  {
    id: 6,
    label: "批量生成配音",
    route: "/workflows/pro/step-6",
    enabled: false,
    icon: "step-storyboard",
  },
  { id: 7, label: "视频预览", route: "/workflows/pro/step-7", enabled: true, icon: "step-video" },
];

export const getWorkflowStepRoute = (stepId: number, nameQuery = "") => {
  const step = workflowSteps.find((item) => item.id === stepId);
  if (!step) {
    return `/workflows/pro/step-${stepId}${nameQuery}`;
  }
  return `${step.route}${nameQuery}`;
};
