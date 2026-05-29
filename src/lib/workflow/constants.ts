import { GlobeIcon, Server } from "lucide-react";

// For Openrouter
export const MODELS = [
  {
    value: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
  },
  {
    value: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
  },
  {
    value: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
  },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku (Fast)" },
];

// For Vercel AI Gateway
// export const MODELS = [
//   {
//     value: "google/gemini-2.5-flash",
//     label: "Google Gemini 2.5 Flash",
//   },
//   {
//     value: "google/gemini-2.5-pro",
//     label: "Google Gemini 2.5 Pro",
//   },
//   {
//     value: "google/gemini-3-flash",
//     label: "Google Gemini 3 Flash",
//   },
//   {
//     value: "anthropic/claude-sonnet-4.5",
//     label: "Anthropic Claude Sonnet 4.5",
//   },
//   {
//     value: "anthropic/claude-opus-4.6",
//     label: "Anthropic Claude Opus 4.6",
//   },
//   {
//     value: "openai/gpt-5.2",
//     label: "OpenAI GPT-5.2",
//   },
//   {
//     value: "openai/gpt-5-chat",
//     label: "OpenAI GPT-5 Chat",
//   },

//   {
//     value: "xai/grok-4.1-fast-reasoning",
//     label: "xAI Grok 4.1 Fast Reasoning",
//   },
//   {
//     value: "zai/glm-4.7",
//     label: "Zai GLM 4.7",
//   },
// ];


export type MCPToolType = {
  name: string;
  description: string;
};

export type ToolType = {
  id: string;
  type: "native" | "mcp";
  name: string;
  description: string;
  icon: React.ElementType;
  tools?: MCPToolType[];
};

export const TOOLS: ToolType[] = [
  {
    id: "webSearch",
    type: "native",
    name: "Web Search",
    description: "Search the web",
    icon: GlobeIcon,
  },
  {
    id: "mcpServer",
    type: "mcp",
    name: "MCP Server",
    description: "Connect to external MCP server",
    icon: Server,
    tools: [],
  },
];
