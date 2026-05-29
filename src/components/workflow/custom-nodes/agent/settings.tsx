/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReactFlow } from "@xyflow/react";
import { useState } from "react";
import MentionInput from "../../mention-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronsUpDownIcon, Plus, X } from "lucide-react";
import { MCPToolType, MODELS, TOOLS } from "@/lib/workflow/constants";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { JsonSchema } from "./json-schema";
import McpDialog from "../../mcp/mcp-dialog";

type PropsType = {
  id: string;
  data: any;
};

const OUTPUT_FORMATS = [
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
];

const AgentSettings = ({ id, data }: PropsType) => {
  const { updateNodeData } = useReactFlow();
  const [openModel, setOpenModel] = useState(false);
  const [openFormat, setOpenFormat] = useState(false);

  const [agentLabel, setAgentLabel] = useState(data?.label || "Agent");
  const [instructionValue, setInstructionValue] = useState(
    data?.instructions || "",
  );
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);

  const model = data?.model;
  const tools = data?.tools || [];
  const outputFormat = data?.outputFormat || "text";
  const responseSchema = data?.responseSchema || {
    type: "object",
    title: "response_schema",
    properties: {},
  };

  const handleChange = (key: string, value: any) => {
    updateNodeData(id, {
      [key]: value,
    });
  };

  const handleAddTool = (toolId: string) => {
    if (toolId === "mcpServer") {
      setMcpDialogOpen(true);
      return;
    }
    const exists = tools.some(
      (t: any) => t.type === "native" && t.value === toolId,
    );
    if (!exists) {
      handleChange("tools", [
        ...tools,
        {
          type: "native",
          value: toolId,
        },
      ]);
    }
  };

  const handleAddMcpTools = ({
    label,
    serverId,
    selectedTools,
  }: {
    label: string;
    serverId: string;
    selectedTools: MCPToolType[];
  }) => {
    handleChange("tools", [
      ...tools,
      {
        type: "mcp",
        label,
        serverId,
        tools: selectedTools,
      },
    ]);
  };

  const handleRemoveTool = (index: number) => {
    handleChange(
      "tools",
      tools.filter((_: any, i: number) => i !== index),
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Agent Name</Label>
          <Input
            value={agentLabel}
            onChange={(e) => setAgentLabel(e.target.value)}
            onBlur={() => handleChange("label", agentLabel)}
            placeholder="My Agent"
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label>System Instructions</Label>
          <MentionInput
            nodeId={id}
            value={instructionValue}
            placeholder="You are a helpful AI assistant..."
            multiline
            onChange={setInstructionValue}
            onBlur={() => handleChange("instructions", instructionValue)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tools</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="outline">
                  <Plus className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TOOLS.filter(
                  (tool) =>
                    !tools.some(
                      (t: any) => t.type === "native" && t.value === tool.id,
                    ),
                ).map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <DropdownMenuItem
                      key={tool.id}
                      onClick={() => handleAddTool(tool.id)}
                    >
                      <Icon className="size-4!" />
                      <span>{tool.name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tools.map((tool: any, index: number) => {
                const nativeTool =
                  tool.type === "native"
                    ? TOOLS.find((t) => t.id === tool.value)
                    : null;
                const Icon = nativeTool?.icon;
                const label =
                  tool.type === "native" ? nativeTool?.name : tool.label;
                return (
                  <Badge key={index} variant="secondary">
                    {Icon && <Icon className="h-4 w-4" />}
                    {label}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveTool(index);
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="flex items-center
        justify-between"
        >
          <Label>Model</Label>

          <Popover open={openModel} onOpenChange={setOpenModel}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between text-xs">
                {model
                  ? MODELS.find((m) => m.value === model)?.label
                  : MODELS[0]?.label}
                <ChevronsUpDownIcon className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search model..." className="h-8" />
                <CommandList>
                  <CommandEmpty>No model found</CommandEmpty>
                  <CommandGroup>
                    {MODELS.map((m) => (
                      <CommandItem
                        key={m.value}
                        value={m.value}
                        className="justify-between"
                        onSelect={(value) => {
                          handleChange("model", value);
                          setOpenModel(false);
                        }}
                      >
                        <span>{m.label}</span>

                        <CheckIcon
                          className={cn(
                            "ml-auto size-4",
                            model === m.value ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div
          className="flex items-center
        justify-between"
        >
          <Label>Output Format</Label>

          <Popover open={openFormat} onOpenChange={setOpenFormat}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between text-xs">
                {OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.label}
                <ChevronsUpDownIcon className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandList>
                  <CommandEmpty>No format found</CommandEmpty>
                  <CommandGroup>
                    {OUTPUT_FORMATS.map((f) => (
                      <CommandItem
                        key={f.value}
                        value={f.value}
                        className="justify-between"
                        onSelect={(value) => {
                          updateNodeData(id, {
                            outputFormat: value,
                            outputs: value === "text" ? ["output.text"] : [],
                            responseSchema:
                              value === "text" ? {} : responseSchema,
                          });
                          setOpenFormat(false);
                        }}
                      >
                        <span>{f.label}</span>

                        <CheckIcon
                          className={cn(
                            "ml-auto size-4",
                            outputFormat === f.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {outputFormat === "json" && (
          <div className="space-y-2 border-t pt-3">
            <Label>JSON Schema</Label>
            {/* {JSONSchema } */}
            <JsonSchema
              schema={responseSchema}
              onChange={(obj) => {
                const newOutputList = Object.keys(obj?.properties || {}).map(
                  (key) => `output.${key}`,
                );
                updateNodeData(id, {
                  responseSchema: obj,
                  outputs: newOutputList,
                });
              }}
            />
          </div>
        )}
      </div>

      <McpDialog
        open={mcpDialogOpen}
        onOpenChange={setMcpDialogOpen}
        onAdd={handleAddMcpTools}
      />
    </>
  );
};

export default AgentSettings;
