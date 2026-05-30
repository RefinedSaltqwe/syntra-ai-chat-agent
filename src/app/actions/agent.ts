/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { decrypt, encrypt } from "@/lib/encryption";
import { openrouter } from "@/lib/openrouter";
import { db } from "@/lib/prisma";
import { createMCPClient } from "@ai-sdk/mcp";
import { webSearch } from "@exalabs/ai-sdk";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  generateText,
  ModelMessage,
  Output,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";

/* ============================================================================
   AGENT EXECUTION ENGINE

   Flow:
   1. Convert UI chat history -> model messages
   2. Register native tools (web search)
   3. Connect selected MCP servers
   4. Load MCP tool definitions
   5. Build system prompt + workflow rules
   6. Execute in JSON mode OR streaming mode
   7. Stream tool calls/results to model
   8. Cleanup MCP connections after execution

   Responsibilities:
   - Message transformation
   - Tool registration
   - MCP integration
   - AI execution
   - Structured output generation
   - Resource cleanup
============================================================================ */

type TextPart = {
  type: "text";
  text: string;
};

type WorkflowNodePart = {
  type: "data-workflow-node";
  data: {
    nodeType: string;
    type?: string;
    output?: string | { text?: string };

    toolCall?: {
      toolCallId: string;
      name: string;
    };

    toolResult?: {
      toolCallId: string;
      name: string;
      result: unknown;
    };
  };
};

type MessagePart = TextPart | WorkflowNodePart;

type JsonOutput = Record<string, unknown>;

type ToolDefinition = {
  description?: string;
};

type McpClient = {
  close: () => Promise<void>;
  tools: () => Promise<Record<string, ToolDefinition>>;
};
// ============================================================================
// Main agent execution pipeline
// - Builds context
// - Loads tools
// - Creates system prompt
// - Runs AI workflow
// - Returns JSON or streamed output
// ============================================================================

export async function streamAgentAction({
  model,
  instructions,
  history,
  jsonOutput,
  selectedTools,
}: {
  model: string;
  instructions: string;
  history: UIMessage[];
  jsonOutput?: JsonOutput;
  selectedTools: Array<
    | { type: "native"; value: string }
    | {
        type: "mcp";
        value: string;
        serverId: string;
        tools: { name: string }[];
      }
  >;
}) {
  //1. Convert UI messages into AI SDK model messages
  const modelMessages: ModelMessage[] = history
    .map((msg) => {
      if (msg.role === "user") {
        const text =
          (msg.parts as MessagePart[])?.find((p) => p.type === "text")?.text ||
          "";

        return {
          role: "user" as const,
          content: text,
        };
      }

      if (msg.role === "assistant") {
        return extractAssistantContent(msg.parts as MessagePart[]);
      }

      return null;
    })
    ?.filter((msg) => msg !== null);

  //const modelMessages = await convertToModelMessages(history)

  //2.  Initialize available tools and MCP clients
  const tools: Record<string, unknown> = {};
  const mcpClients: McpClient[] = [];

  //3.  Register selected native tools
  for (const t of selectedTools.filter((t) => t.type === "native")) {
    if (t.value === "webSearch") {
      tools.webSearch = webSearch();
    }
  }
  //4. Connect selected MCP servers and load tools
  for (const t of selectedTools.filter((t) => t.type === "mcp")) {
    const { toolSet, mcpClient } = await getMcpToolsByServerId(t.serverId);

    mcpClients.push(mcpClient);

    for (const tool of t.tools) {
      if (toolSet[tool.name]) {
        tools[tool.name] = toolSet[tool.name];
      }
    }
  }
  //5. Build tool list for prompt injection
  const toolList = Object.entries(tools)
    ?.map(([name]) => `- ${name}`)
    ?.join("\n");

  //6. Build deterministic workflow system prompt
  const systemPrompt = `You are a helpful assistant.

  **Analyze the conversation flow:**
  1. Check YOUR last message - did you ask the user for information?
  2. If YES and the user is providing that information → treat it as a follow-up response
  3. If NO or the user changes the topic → classify the message independently as a new intent

  **System Instructions:**
  ${instructions}

  ${toolList ? `**Available tools:**\n${toolList}` : ""}`.trim();

  // JSON OUTPUT MODE
  //7. Generate structured object response
  if (jsonOutput) {
    const result = await generateText({
      model: openrouter.chat(model),

      system: systemPrompt,

      messages: modelMessages,

      maxOutputTokens: 300,

      output: Output.object({
        schema: jsonOutput.schema as any,
      }),
      onStepFinish(step) {
        console.log(
          "Tool Results Full:",
          JSON.stringify(step.toolResults, null, 2),
        );
      },
    });

    return result;
  }

  // TEXT OUTPUT MODE
  //8. Stream response with tool execution
  return streamText({
    model: openrouter.chat(model),

    system: systemPrompt,

    messages: modelMessages,

    tools: Object.keys(tools).length > 0 ? (tools as never) : undefined,

    stopWhen: stepCountIs(5),

    maxOutputTokens: 1000,

    onFinish: async (result) => {
      console.log("FINAL TEXT:", result.text);
      console.log("Closing MCP clients");
      //9. Close MCP connections after completion
      for (const client of mcpClients) {
        await client.close();
      }
    },
    onStepFinish(step) {
      console.log(
        "Tool Results Full:",
        JSON.stringify(step.toolResults, null, 2),
      );
    },
  });
}
// Extract assistant text from workflow nodes
function extractAssistantContent(parts: MessagePart[]) {
  const content =
    parts
      ?.filter(
        (p): p is WorkflowNodePart =>
          p.type === "data-workflow-node" && p.data.nodeType === "agent",
      )
      ?.map((p) => {
        const { output } = p.data;

        return typeof output === "string" ? output : output?.text;
      })
      ?.filter(Boolean)
      ?.join("\n\n") || "";

  return {
    role: "assistant" as const,
    content,
  };
}

// Extract assistant text, tool calls, and tool results
function extractAgentContent(parts: MessagePart[]) {
  const content: Array<
    | {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
      }
    | {
        type: "tool-result";
        toolCallId: string;
        toolName: string;
        result: unknown;
      }
    | {
        type: "text";
        text: string;
      }
  > = [];

  parts
    ?.filter(
      (p): p is WorkflowNodePart =>
        p.type === "data-workflow-node" && p.data?.nodeType === "agent",
    )
    ?.map((p) => {
      const { type, toolCall, toolResult, output } = p.data;

      if (type === "tool-call" && toolCall) {
        content.push({
          type: "tool-call",
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.name,
        });
      }

      if (type === "tool-result" && toolResult) {
        content.push({
          type: "tool-result",
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.name,
          result: toolResult.result,
        });
      }

      if (typeof output === "string") {
        content.push({
          type: "text",
          text: output,
        });
      } else if (output?.text) {
        content.push({
          type: "text",
          text: output.text,
        });
      }
    });

  return {
    role: "assistant" as const,
    content: content.length > 0 ? content : "",
  };
}

// Connect MCP server and load available tools
async function getMcpToolsByServerId(serverId: string) {
  const server = await db.mcpServer.findUnique({
    where: { id: serverId },
  });

  if (!server) {
    throw new Error("MCP Server not found");
  }

  const apiKey = server.token ? decrypt(server.token) : undefined;

  const url = server.url;

  const mcpClient = (await createMCPClient({
    transport: {
      type: "http",
      url,
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
          }
        : undefined,
    },
  })) as McpClient;

  const toolSet = await mcpClient.tools();

  return { toolSet, mcpClient };
}

// Test MCP connection and discover tools
export async function connectMcpServer({
  url,
  apiKey,
}: {
  url: string;
  apiKey: string;
}) {
  console.log("url", url, "apiKey", apiKey);

  if (!url || !apiKey) {
    throw new Error("URL and API key are required to connect to MCP server.");
  }

  // const session = await getKindeServerSession();
  // const user = await session.getUser();
  // if (!user) throw new Error("Unauthorized");

  const mcpClient = (await createMCPClient({
    transport: {
      type: "http",
      url,
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`, //! https://supabase.com/dashboard/account/tokens
          }
        : undefined,
    },
  })) as McpClient;

  const toolSet = await mcpClient.tools();

  console.log("MCP client created, fetching tools...", toolSet);

  const toolsArray = Object.entries(toolSet).map(([name, tool]) => ({
    name,
    description: tool.description || "",
  }));

  await mcpClient.close();

  return { tools: toolsArray };
}
// Save or update MCP server configuration to database
export async function addMcpServer({
  url,
  apiKey,
  label,
}: {
  url: string;
  apiKey: string;
  label: string;
}) {
  const session = await getKindeServerSession();
  const user = await session.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let server = await db.mcpServer.findFirst({
    where: {
      userId: user.id,
      url,
    },
  });

  const encryptedKey = apiKey ? encrypt(apiKey) : "";

  if (!server) {
    server = await db.mcpServer.create({
      data: {
        userId: user.id,
        label,
        url,
        token: encryptedKey,
      },
    });
  } else {
    server = await db.mcpServer.update({
      where: { id: server.id },
      data: {
        label,
        token: encryptedKey,
      },
    });
  }

  return { serverId: server.id };
}
