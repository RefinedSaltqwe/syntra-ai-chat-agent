/* eslint-disable @typescript-eslint/no-unused-vars */
import { realtime } from "@/lib/realtime";
import { Edge, Node } from "@xyflow/react";
import { serve } from "@upstash/workflow/nextjs";
import { Client } from "@upstash/qstash";
import { UIMessage } from "ai";
import { db } from "@/lib/prisma";
import { executeWorkflow, WorkflowNode } from "@/lib/workflow/execute-workflow";

/**
 * Real-time streaming endpoint for workflow execution updates.
 *
 * Flow:
 * 1. Client connects using a workflowRunId
 * 2. Server subscribes to the Upstash realtime channel
 * 3. Workflow events ("workflow.chunk") are received live
 * 4. Events are streamed to the frontend using Server-Sent Events (SSE)
 * 5. Stream closes automatically when workflow finishes or client disconnects
 *
 * Used for:
 * - AI response streaming
 * - Live workflow progress updates
 * - Real-time chat/output rendering
 */
export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);

  // 1. Get workflowRunId from query params
  const workflowRunId = searchParams.get("id");

  if (!workflowRunId)
    return new Response("Missing workflow run id", { status: 400 });

  // 2. Connect to the realtime workflow channel
  const channel = realtime.channel(workflowRunId);

  // 3. Create SSE stream for frontend updates
  const stream = new ReadableStream({
    async start(controller) {
      const encofer = new TextEncoder();

      // 4. Subscribe to workflow realtime events
      await channel.subscribe({
        events: ["workflow.chunk"],
        history: true,

        // 5. Stream workflow events to the frontend
        onData({
          event,
          data,
          channel,
        }: {
          event: string;
          data: { type: string };
          channel: unknown;
        }) {
          controller.enqueue(
            encofer.encode(`data: ${JSON.stringify(data)}\n\n`),
          );

          // 6. Close stream when workflow finishes
          if (data.type === "finish") controller.close();
        },
      });

      // Close stream if client disconnects
      req.signal.addEventListener("abort", () => {
        controller.close();
      });
    },
  });

  // Return SSE response to frontend
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
};

/**
 * Main workflow execution endpoint.
 *
 * Flow:
 * 1. Receives workflowId and chat messages from the client
 * 2. Extracts the latest user text input
 * 3. Creates a realtime channel using the workflowRunId
 * 4. Fetches workflow nodes and edges from the database
 * 5. Parses the stored workflow graph (flowObject)
 * 6. Executes the workflow engine using the workflow definition
 * 7. Streams workflow output/events through Upstash Realtime
 *
 * Features:
 * - Durable workflow execution using Upstash Workflow
 * - Real-time streaming updates
 * - Database-driven workflow graphs
 * - Error logging and retry-safe execution
 *
 * Infrastructure:
 * - Upstash Workflow/QStash for orchestration
 * - Prisma for database access
 * - Upstash Realtime for live event streaming
 * - Vercel deployment protection bypass for internal workflow requests
 */
export const { POST } = serve(
  async (ctx) => {
    // 1. Receive workflowId + chat messages from the client
    const { workflowId, messages } = ctx.requestPayload as {
      workflowId: string;
      messages: UIMessage[];
    };

    // 2. Create realtime channel using workflowRunId
    const workflowRunId = ctx.workflowRunId;
    const channel = realtime.channel(workflowRunId);

    // 3. Extract latest user text input from messages
    const message = messages[messages.length - 1];
    const userInput =
      message.role === "user" && message.parts[0].type === "text"
        ? message.parts[0].text
        : "";

    // 4. Fetch workflow graph (nodes + edges) from database
    const { nodes, edges } = await ctx.run("fetch-from-database", async () => {
      const workflowData = await db.workflow.findUnique({
        where: {
          id: workflowId,
        },
      });

      if (!workflowData) throw new Error("Workflow not found");

      // 5. Parse stored workflow JSON graph
      const obj = JSON.parse(workflowData.flowObject);

      const nodes = obj.nodes as Node[];
      const edges = obj.edges as Edge[];

      return { nodes, edges };
    });

    // 6. Execute workflow engine using workflow graph
    await ctx.run("workflow-execution", async () => {
      try {
        await executeWorkflow(
          nodes as WorkflowNode[],
          edges,
          userInput,
          messages,
          channel,
          workflowRunId,
        );
      } catch (error) {
        console.error("Workflow execution error:", error);
        throw error;
      }
    });
  },

  // 7. Configure Upstash QStash workflow client
  {
    qstashClient: new Client({
      token: process.env.QSTASH_TOKEN!,
      headers: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_PROTECTION_BYPASS_TOKEN!,
      },
    }),
  },
);
