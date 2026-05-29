import React, { useState } from "react";
import { UIMessage, useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowUp,
  Check,
  PlusIcon,
  SparkleIcon,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader, TextShimmerLoader } from "@/components/ui/loader";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { createWorkflowTransport } from "@/lib/transport";
import { getNodeConfig, NodeType } from "@/lib/workflow/node-config";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ToolResultData = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

type NodeOutput =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | unknown[];

type NodeDataType = {
  id: string;
  nodeType: NodeType;
  nodeName: string;
  status: "loading" | "error" | "complete";
  type: "text-delta" | "tool-call" | "tool-result";

  toolCall?: {
    name: string;
  };

  toolResult?: {
    name: string;
    result: ToolResultData;
  };

  output?: NodeOutput;

  error?: unknown;
};

const ChatPanel = ({ workflowId }: { workflowId: string }) => {
  const [input, setInput] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(() =>
    crypto.randomUUID(),
  );
  /**
   * Initializes the AI chat state and connects the chat UI
   * to the workflow streaming system.
   *
   * Features:
   * - Manages chat messages and request state
   * - Sends user messages to the workflow backend
   * - Streams realtime AI/workflow responses to the UI
   *
   * Returned values:
   * - messages: current conversation history
   * - sendMessage(): sends a new message
   * - status: current chat/request state
   *
   * Flow:
   * User message → Workflow backend → Workflow execution
   * → Realtime stream → UI updates automatically
   */
  const { messages, sendMessage, status } = useChat<UIMessage>({
    id: chatId ?? undefined,
    messages: [],
    transport: createWorkflowTransport({
      workflowId,
    }),
  });

  const isLoading =
    status === "submitted" ||
    (status === "streaming" &&
      !Boolean(
        messages[messages.length - 1]?.parts.some(
          (part) => part.type === "text" && Boolean(part.text),
        ),
      ));

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    sendMessage({
      text: message.text,
    });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* {Chat Header} */}
      <div
        className="bg-linear-to-br from-primary
      via-primary/90 to-primary/80 px-6 py-4 relative shadow-sm
      "
      >
        <div
          className="flex items-center justify-between
          text-white
        "
        >
          <h5 className="text-lg font-bold">Workflow Preview</h5>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChatId(crypto.randomUUID())}
          >
            New chat <PlusIcon size={14} />
          </Button>
        </div>
      </div>

      <div
        className="relative flex flex-col flex-1
       overflow-hidden
      "
      >
        {messages.length > 0 ? (
          <Conversation className="flex-1">
            <ConversationContent className="pt-5 px-4 pl-2">
              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent className="text-[14.5px]">
                    {message.parts.map((part, index) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <MessageResponse key={`${message.id}-${index}`}>
                              {part.text}
                            </MessageResponse>
                          );
                        case "data-workflow-node":
                          const data = part.data as NodeDataType;

                          return (
                            <NodeDisplay
                              key={`${message.id}-workflow-${index}`}
                              data={data}
                            />
                          );

                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              ))}

              {isLoading ? (
                <div className="px-2">
                  <Loader variant={"dots"} size={"md"} />
                </div>
              ) : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SparkleIcon size={20} className="text-primary" />
                </EmptyMedia>
                <EmptyTitle>Preview your workflow</EmptyTitle>
                <EmptyDescription>
                  Write a prompt as if you&apos;re the user to test your
                  workflow.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}

        <div className="p-4 bg-background border-t">
          <PromptInput
            className="rounded-xl! shadow-sm border"
            onSubmit={handleSubmit}
          >
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                placeholder="Send a message..."
                className="pt-3"
                onChange={(e) => setInput(e.target.value)}
              />
            </PromptInputBody>
            <PromptInputFooter
              className="
             flex justify-end p-2 pt-0
            "
            >
              <PromptInputSubmit
                disabled={!input.trim() || isLoading}
                className="h-9! w-9! p-0! rounded-xl!
                 bg-primary! text-primary-foreground!"
              >
                <ArrowUp size={18} />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

type NodeDisplayType = {
  data: NodeDataType;
};

export const NodeDisplay = ({ data }: NodeDisplayType) => {
  const nodeConfig = getNodeConfig(data.nodeType);
  if (!nodeConfig) return null;

  const Icon = nodeConfig.icon;
  const { status, output, error, toolCall, toolResult } = data;

  console.log(toolCall, toolResult, "tool-calling");

  return (
    <div>
      <div
        className={cn(
          `px-1 py-2 flex items-center gap-2`,
          status === "loading" && "animate-pulse",
        )}
      >
        {status === "loading" ? (
          <Spinner />
        ) : status === "error" ? (
          <AlertCircle className="text-destructive h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">{data.nodeName}</span>
      </div>

      <div>
        {toolCall || toolResult ? (
          <div
            className="mx-3 my-2 py-3
          bg-muted/50 rounded-lg border
          flex items-center gap-2 w-fit!
          "
          >
            {toolResult ? (
              <>
                <Check className="size-4 text-green-500" />
                <span className="text-sm">{toolResult.name}</span>
              </>
            ) : (
              <TextShimmerLoader text={`Calling ${toolCall?.name}...`} />
            )}
          </div>
        ) : null}

        {output && (
          <div className="px-3 py-2">
            <MessageResponse>
              {typeof output === "string"
                ? output
                : JSON.stringify(output, null, 2)}
            </MessageResponse>
          </div>
        )}

        {status === "error" && (
          <div
            className="p-3 bg-destructive/10
           text-destructive rounded-md
          "
          >
            {JSON.stringify({
              error,
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
