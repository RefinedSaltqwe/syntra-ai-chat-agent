import { Client } from "@upstash/workflow";
import { NextResponse } from "next/server";

const client = new Client({
  baseUrl: process.env.QSTASH_BASE_URL!,
  token: process.env.QSTASH_TOKEN!,
});

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:3000`;

/**
 * Triggers a new Upstash workflow execution.
 *
 * Flow:
 * 1. Receives workflowId and chat messages from the client
 * 2. Triggers the workflow endpoint using QStash
 * 3. Starts a durable workflow execution
 * 4. Returns a workflowRunId to the frontend
 * 5. Frontend uses the workflowRunId to connect to the realtime stream
 *
 * Features:
 * - Durable/retryable workflow execution
 * - Supports Vercel protected deployments
 * - Returns execution status and workflowRunId
 */

export async function POST(request: Request) {
  // 1. Receive workflowId + messages from the client
  const { workflowId, messages } = await request.json();

  console.log("Triggering workflow messages:", messages);

  try {
    // 2. Trigger the workflow endpoint using QStash
    // 3. Start durable workflow execution
    const { workflowRunId } = await client.trigger({
      url: `${BASE_URL}/api/workflow/chat`,
      retries: 3,
      headers: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_PROTECTION_BYPASS_TOKEN!,
      },
      body: {
        workflowId,
        messages,
      },
    });

    // 4. Return workflowRunId to the frontend
    // 5. Frontend connects to realtime SSE stream using workflowRunId
    return NextResponse.json({
      success: true,
      workflowRunId,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger workflow",
      },
      { status: 500 },
    );
  }
}
