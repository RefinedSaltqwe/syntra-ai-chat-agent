//https://ai-sdk.dev/docs/ai-sdk-ui/transport
import { DefaultChatTransport } from "ai";
/**
 * Custom AI SDK transport for workflow-based chat streaming.
 *
 * Flow:
 * 1. Sends messages + workflowId to the trigger endpoint
 * 2. Starts a workflow execution
 * 3. Receives a workflowRunId
 * 4. Connects to the realtime SSE stream
 * 5. Streams live workflow/AI responses back to the chat UI
 *
 * Supports stream reconnection and realtime updates
 * using Upstash Workflow + Realtime.
 */
export const createWorkflowTransport = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  // 1. Send messages + workflowId to trigger endpoint
  // 2. Start workflow execution
  return new DefaultChatTransport({
    api: `/api/upstash/trigger`,
    async prepareSendMessagesRequest({ messages }) {
      return {
        body: {
          workflowId,
          messages,
        },
      };
    },

    // Handles reconnecting to an existing SSE stream
    prepareReconnectToStreamRequest: (data) => {
      return {
        ...data,
        headers: {
          ...data.headers,
          "x-is-reconnect": "true",
        },
      };
    },

    // 3. Trigger workflow execution
    // 4. Receive workflowRunId from backend
    // 5. Connect chat UI to realtime SSE stream
    // 6. Stream live workflow/AI updates to the frontend
    fetch: async (input, init) => {
      const triggerRes = await fetch(input, init);
      const data = await triggerRes.json();
      const workflowRunId = data.workflowRunId;

      return fetch(`/api/workflow/chat?id=${workflowRunId}`, {
        method: "GET",
      });
    },
  });
};
