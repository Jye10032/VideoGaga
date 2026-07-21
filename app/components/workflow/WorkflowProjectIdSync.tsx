"use client";

import { useEffect } from "react";
import { useProjectStore } from "../../store/useProjectStore";

type WorkflowProjectIdSyncProps = {
  projectName?: string;
  projectId?: string;
};

export default function WorkflowProjectIdSync({
  projectName,
  projectId,
}: WorkflowProjectIdSyncProps) {
  const updateProject = useProjectStore((state) => state.updateProject);

  useEffect(() => {
    const key = projectName?.trim();
    const pid = projectId?.trim();
    if (!key || !pid) {
      return;
    }
    updateProject(key, { projectId: pid });
  }, [projectId, projectName, updateProject]);

  return null;
}

