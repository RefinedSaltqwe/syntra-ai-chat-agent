/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamAgentAction } from "@/app/actions/agent";
import { replaceVariables } from "@/lib/helper";
import { ExecutorContextType } from "@/types/workflow";
import { Node } from "@xyflow/react";
import { convertJsonSchemaToZod } from "zod-from-json-schema";
import { MODELS } from "../constants";

type NativeTool = {
  type: "native";
  value: string;
};

type MCPTool = {
  type: "mcp";
  value: string;
  serverId: string;
  tools: {
    name: string;
  }[];
};

type SelectedTool = NativeTool | MCPTool;

type AgentNodeData = {
  label: string;
  instructions: string;
  outputFormat?: "text" | "json";
  responseSchema?: Record<string, unknown>;
  tools?: SelectedTool[];
  model?: string;
};

/**
 * Executes an AI Agent workflow node with realtime streaming support.
 *
 * This function:
 * - Extracts agent configuration from the workflow node
 * - Replaces workflow variables inside instructions
 * - Configures structured JSON output (optional)
 * - Executes the AI agent using the selected model/tools
 * - Streams live AI responses and tool activity to the frontend
 * - Returns the final agent output back to the workflow engine
 *
 * Supported Features:
 * - AI text streaming
 * - Tool calling/tool results
 * - Structured JSON outputs
 * - Variable interpolation from workflow context
 * - Shared conversation history
 * - Realtime workflow UI updates
 *
 * Streaming Event Types:
 * - text-delta → streamed AI text chunks
 * - tool-call  → AI requested a tool execution
 * - tool-result → tool execution completed
 *
 * Workflow Integration:
 * The returned output is stored in the shared workflow context
 * and can be accessed by future workflow nodes.
 */
export async function executeAgentNode(
  node: Node<AgentNodeData>,
  context: ExecutorContextType,
) {
  // 1. Extract shared workflow execution context
  const { outputs, channel, history } = context;

  // 2. Extract agent configuration from node data
  const {
    instructions,
    outputFormat = "text",
    responseSchema,
    tools: selectedTools = [],
    model: selectedModel,
    label,
  } = node.data;

  // 3. Resolve selected AI model
  // Fallback to default model if none selected
  const model = selectedModel || MODELS[0].value;

  // 4. Replace workflow variables inside instructions
  // Example:
  // {{start.input}}
  // {{agent1.output}}
  const replacedInstructions = replaceVariables(instructions, outputs);

  // 5. Configure optional structured JSON output schema
  const jsonOutput = responseSchema
    ? {
        schema: convertJsonSchemaToZod(responseSchema as any),
      }
    : undefined;

  // 6. Execute AI agent with streaming enabled
  const result = await streamAgentAction({
    model,
    instructions: replacedInstructions,
    history,
    jsonOutput,
    selectedTools,
  });

  // 7. Handle structured JSON output mode
  if (outputFormat === "json") {
    if ("experimental_output" in result) {
      console.log("FINAL NODE OUTPUT:", result.output);

      return {
        output: result.output,
      };
    }
  }

  // 8. Handle realtime text/tool streaming mode
  if ("fullStream" in result) {
    // Accumulate streamed text response
    let fullText = "";

    //? This is where the streaming "magic" happens - we process each incoming chunk from the agentAction stream and emit realtime updates to the frontend workflow UI via the channel
    // 9. Process streamed AI events chunk-by-chunk
    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        // 10. Handle streamed AI text chunks
        case "text-delta":
          // Append streamed text to full response
          fullText += chunk.text;

          // Emit realtime text update to frontend
          await channel.emit("workflow.chunk", {
            type: "data-workflow-node",
            id: node.id,
            data: {
              id: node.id,
              nodeType: node.type,
              nodeName: label,
              status: "loading",
              type: "text-delta",
              output: fullText,
            },
          });

          break;

        // 11. Handle AI tool call events
        case "tool-call":
          // Emit realtime tool-call event to frontend
          await channel.emit("workflow.chunk", {
            type: "data-workflow-node",
            id: node.id,
            data: {
              id: node.id,
              nodeType: node.type,
              nodeName: label,
              status: "loading",
              type: "tool-call",
              output: fullText,
              toolCall: {
                name: chunk.toolName,
                toolCallId: chunk.toolCallId,
              },
            },
          });

          break;

        // 12. Handle completed tool execution results
        case "tool-result":
          // Emit realtime tool-result event to frontend
          await channel.emit("workflow.chunk", {
            type: "data-workflow-node",
            id: node.id,
            data: {
              id: node.id,
              nodeType: node.type,
              nodeName: label,
              status: "loading",
              type: "tool-result",
              output: fullText,
              toolResult: {
                toolCallId: chunk.toolCallId,
                name: chunk.toolName,
                result: chunk.output,
              },
            },
          });

          break;
      }
    }

    // 13. Return final accumulated AI response
    // Back to the workflow execution engine
    return {
      output: {
        text: fullText,
      },
    };
  }
}
