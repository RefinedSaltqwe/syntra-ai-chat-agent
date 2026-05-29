/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FileIcon,
  GitBranch,
  Globe,
  MousePointer2Icon,
  Play,
  Square,
} from "lucide-react";
import { generateId } from "../helper";
import { MODELS } from "./constants";
import { executeStartNode } from "./custom-executors/startnode-executor";
import { executeAgentNode } from "./custom-executors/agentnode-executor";
import { executeIfElseNode } from "./custom-executors/ifelse-executor";
import { executeEndNode } from "./custom-executors/end-executor";
import { executeHttpNode } from "./custom-executors/httpnode-executor";

export const NodeTypeEnum = {
  START: "start",
  AGENT: "agent",
  IF_ELSE: "if_else",
  END: "end",
  HTTP: "http",
  COMMENT: "comment",
} as const;

export type NodeType = (typeof NodeTypeEnum)[keyof typeof NodeTypeEnum];

// Node executors
export const NODE_EXECUTORS = {
  [NodeTypeEnum.START]: executeStartNode,
  [NodeTypeEnum.AGENT]: executeAgentNode,
  [NodeTypeEnum.IF_ELSE]: executeIfElseNode,
  [NodeTypeEnum.HTTP]: executeHttpNode,
  [NodeTypeEnum.END]: executeEndNode,
};

type NodeConfigBase = {
  type: NodeType;
  label: string;
  icon: React.ElementType;
  color: string;

  //
  inputs: Record<string, any>;
  outputs: string[];
};

// Node config for each node type, used to define the default inputs and outputs for each node when creating new nodes and to render the node settings in the UI
export const NODE_CONFIG: Record<NodeType, NodeConfigBase> = {
  [NodeTypeEnum.START]: {
    type: NodeTypeEnum.START,
    label: "Start",
    icon: Play,
    color: "bg-emerald-500",
    inputs: {
      inputValue: "",
    },
    outputs: ["input"], //{{startId.input}}
  },
  [NodeTypeEnum.AGENT]: {
    type: NodeTypeEnum.AGENT,
    label: "Agent",
    icon: MousePointer2Icon,
    color: "bg-blue-500",
    inputs: {
      label: "Agent",
      instructions: "",
      model: MODELS[0].value,
      tools: [],
      outputFormat: "text", //text or json
      responseSchema: null,
    },
    outputs: ["output.text"], //{{agentid.output.text}} === "return_item"
  },
  [NodeTypeEnum.IF_ELSE]: {
    type: NodeTypeEnum.IF_ELSE,
    label: "If / Else",
    color: "bg-orange-500",
    icon: GitBranch,
    inputs: {
      conditions: [
        {
          caseName: "",
          variable: "",
          operator: "",
          value: "",
        },
      ],
    },
    outputs: ["output.result"],
  },
  [NodeTypeEnum.HTTP]: {
    type: NodeTypeEnum.HTTP,
    label: "HTTP",
    color: "bg-blue-400",
    icon: Globe,
    inputs: {
      method: "GET",
      url: "",
      headers: {},
      body: {},
    },
    outputs: ["output.body"],
  },
  [NodeTypeEnum.END]: {
    type: NodeTypeEnum.END,
    label: "End",
    color: "bg-red-400",
    icon: Square,
    inputs: {
      value: "",
    },
    outputs: ["output.text"],
  },
  [NodeTypeEnum.COMMENT]: {
    type: NodeTypeEnum.COMMENT,
    label: "Note",
    color: "bg-gray-500",
    icon: FileIcon,
    inputs: {
      comment: "",
    },
    outputs: [],
  },
} as const;

//Helper function to get node config by type, used when creating new nodes to get their default config
export const getNodeConfig = (type: NodeType) => {
  const nodetype = NODE_CONFIG?.[type];
  if (!nodetype) return null;
  return nodetype;
};

//Helper function to get node executor by type, used when executing the workflow to run the logic for each node
export const getNodeExecutor = (type: NodeType) => {
  const executor = NODE_EXECUTORS?.[type as keyof typeof NODE_EXECUTORS];
  if (!executor) {
    throw new Error(`No executor found for node type ${type}`);
  }
  return executor;
};

export type CreateNodeOptions = {
  type: NodeType;
  position?: { x: number; y: number };
};

//Helper function to create a new node with default config based on type, used when dragging a new node onto the canvas or creating a new node from settings
export function createNode({
  type,
  position = { x: 400, y: 200 },
}: CreateNodeOptions) {
  const config = getNodeConfig(type);
  if (!config) throw new Error(`No node config found ${type}`);
  const id = generateId(type);
  return {
    id,
    type,
    position,
    deletable: type === NodeTypeEnum.START ? false : true,
    data: {
      label: config.label,
      color: config.color,
      outputs: config.outputs,
      ...config.inputs,
    },
  };
}
