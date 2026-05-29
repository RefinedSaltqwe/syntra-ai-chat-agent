// types/workflow.ts

import { UIMessage } from "ai";

export type WorkflowNodeOutput = Record<string, unknown>;

export type WorkflowChannel = {
  emit: (
    event: string,
    payload: {
      type: string;
      id: string;
      data: WorkflowNodeStreamData;
    },
  ) => Promise<void>;
};

export type ExecutorContextType = {
  outputs: Record<string, WorkflowNodeOutput>;
  history: UIMessage[];
  workflowRunId: string;
  channel: WorkflowChannel;
};

export type ExecutorResultType = {
  output: WorkflowNodeOutput;
};

export type WorkflowNodeStreamData = {
  id: string;
  nodeType?: string;
  nodeName: string;

  status: "loading" | "success" | "error";

  type: "text-delta" | "tool-call" | "tool-result";

  output?: string;

  toolCall?: {
    name: string;
    toolCallId: string;
  };

  toolResult?: {
    toolCallId: string;
    name: string;
    result: unknown;
  };
};

export type WorkflowUIMessage = UIMessage<
  never,
  {
    "data-workflow-node": WorkflowNodeStreamData;
  }
>;
