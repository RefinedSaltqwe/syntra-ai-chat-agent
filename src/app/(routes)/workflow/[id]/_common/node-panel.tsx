import { cn } from "@/lib/utils";
import { getNodeConfig, NodeTypeEnum } from "@/lib/workflow/node-config";
import { Panel } from "@xyflow/react";

const NodePanel: React.FC = () => {
  const NODE_LIST = [
    {
      group: "Core",
      items: [NodeTypeEnum.AGENT, NodeTypeEnum.END, NodeTypeEnum.COMMENT],
    },
    {
      group: "Logic",
      items: [NodeTypeEnum.IF_ELSE],
    },
    {
      group: "Network",
      items: [NodeTypeEnum.HTTP],
    },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <Panel
      position="top-left"
      className="flex flex-col w-60 top-10! h-fit bg-card
      shadow-xl pb-5 rounded-lg
      "
    >
      <div className="flex-1 p-4 space-y-2">
        {NODE_LIST.map((group) => (
          <div key={group.group} className="space-y-1">
            <h4
              className="text-[11px]
            font-medium text-muted-foreground px-1
            "
            >
              {group.group}
            </h4>
            <div className="space-y-1">
              {group.items.map((nodeType) => {
                const config = getNodeConfig(nodeType);
                if (!config) return null;
                const Icon = config.icon;

                return (
                  <button
                    key={nodeType}
                    draggable
                    onDragStart={(e) => onDragStart(e, nodeType)}
                    disabled={false}
                    className={cn(
                      `w-full flex items-center gap-3 p-1
                        hover:bg-muted transition-all
                         cursor-grab active:cursor-grabbing
                      disabled:opacity-50
                       disabled:pointer-events-none
                      `,
                    )}
                  >
                    <div
                      className={cn(
                        `rounded-sm size-7 flex items-center
                    justify-center
                    `,
                        config.color,
                      )}
                    >
                      <Icon className="size-3.5! text-white" />
                    </div>

                    <span
                      className="text-sm font-medium
                    text-foreground
                    "
                    >
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="space-y-1">
          <h4
            className="
              flex items-center gap-1
              text-[11px]
              font-medium
              text-muted-foreground
              px-1  
            "
          >
            Tips
          </h4>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select an edge or node, then press{" "}
              <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-medium">
                <b>Backspace</b>
              </kbd>{" "}
              to delete it.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-medium">
                <b>Double click</b>
              </kbd>{" "}
              a node to edit its settings.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default NodePanel;
