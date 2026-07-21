"use client";

import { useCallback } from "react";
import { useProjectState } from "./useProjectState";
import type { StoryMessage } from "../../store/useProjectStore";

export function useStorySetting(projectName?: string | null, stepId = 1) {
  const { project, projectKey, setStorySetting, setStepStatus, clearStepStatus } =
    useProjectState(projectName);

  const storySetting = project.storySetting;

  const setMode = useCallback(
    (mode: "ai" | "self") => setStorySetting(projectKey, { mode }),
    [projectKey, setStorySetting],
  );

  const setInput = useCallback(
    (input: string) => setStorySetting(projectKey, { input }),
    [projectKey, setStorySetting],
  );

  const setDraft = useCallback(
    (draft: string) => setStorySetting(projectKey, { draft }),
    [projectKey, setStorySetting],
  );

  const setMessages = useCallback(
    (messages: StoryMessage[]) => setStorySetting(projectKey, { messages }),
    [projectKey, setStorySetting],
  );

  const appendMessage = useCallback(
    (message: StoryMessage) => {
      setStorySetting(projectKey, {
        messages: [...storySetting.messages, message],
      });
    },
    [projectKey, setStorySetting, storySetting.messages],
  );

  const finalize = useCallback(
    (finalStory: string) => {
      setStorySetting(projectKey, { finalized: true, finalStory });
      setStepStatus(projectKey, stepId, "done");
    },
    [projectKey, setStorySetting, setStepStatus, stepId],
  );

  const resetFinalized = useCallback(() => {
    setStorySetting(projectKey, { finalized: false });
    clearStepStatus(projectKey, stepId);
  }, [projectKey, setStorySetting, clearStepStatus, stepId]);

  return {
    storySetting,
    setMode,
    setInput,
    setDraft,
    setMessages,
    appendMessage,
    finalize,
    resetFinalized,
  };
}
