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

  const tools: Record<string, unknown> = {};
  const mcpClients: McpClient[] = [];

  //Native tools
  for (const t of selectedTools.filter((t) => t.type === "native")) {
    if (t.value === "webSearch") {
      tools.webSearch = webSearch();
    }
  }

  for (const t of selectedTools.filter((t) => t.type === "mcp")) {
    const { toolSet, mcpClient } = await getMcpToolsByServerId(t.serverId);

    mcpClients.push(mcpClient);

    for (const tool of t.tools) {
      if (toolSet[tool.name]) {
        tools[tool.name] = toolSet[tool.name];
      }
    }
  }

  const toolList = Object.entries(tools)
    ?.map(([name]) => `- ${name}`)
    ?.join("\n");

  const systemPrompt = `
You are a workflow AI assistant.

Your role is to execute workflow tasks accurately and deterministically.

Follow the provided instructions exactly and respond according to the configured output format.

Conversation handling rules:
1. Analyze the previous assistant message.
2. If the assistant previously asked for missing information and the user is now providing it, treat the message as a continuation of the current workflow.
3. If the user changes the topic entirely, treat it as a new request.
4. Never invent, assume, expand, summarize, or rewrite user-provided information.
5. Extract or use only information explicitly written by the user.
6. If a required field is missing, return an empty string instead of guessing.
7. Preserve exact wording when extracting values from the user.

${instructions}

${toolList ? `Available tools:\n${toolList}` : ""}

Critical rules:
- Return ONLY the requested output
- Do NOT add explanations
- Do NOT add conversational filler
- Do NOT continue the user's story or message
- Do NOT hallucinate missing values
- Keep outputs concise and deterministic
- Never invent fields that were not provided
- Never rewrite extracted values
- Never output markdown unless explicitly requested

JSON mode rules:
- When structured output is requested, return ONLY valid structured data
- Do NOT wrap JSON in markdown
- Do NOT include extra keys
- All required schema fields must always be returned
`.trim();
  // =========================
  // JSON MODE
  // =========================
  if (jsonOutput) {
    const result = await generateText({
      model: openrouter.chat(model),

      system: systemPrompt,

      messages: modelMessages,

      maxOutputTokens: 300,

      output: Output.object({
        schema: jsonOutput.schema as any,
      }),
    });

    return result;
  }

  // =========================
  // TEXT MODE
  // =========================
  return streamText({
    model: openrouter.chat(model),

    system: systemPrompt,

    messages: modelMessages,

    tools: Object.keys(tools).length > 0 ? (tools as never) : undefined,

    stopWhen: stepCountIs(5),

    maxOutputTokens: 1000,

    onFinish: async () => {
      console.log("Closing MCP clients");

      for (const client of mcpClients) {
        await client.close();
      }
    },
  });
}

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
