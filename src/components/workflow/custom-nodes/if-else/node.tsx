import { NodeProps, Position } from "@xyflow/react";
import WorkflowNode from "../../workflow-node";
import { GitBranch } from "lucide-react";
import { BaseHandle } from "../../react-flow/base-handle";
import IfElseSettings from "./settings";

type Condition = {
  caseName?: string;
  variable?: string;
  operator?: string;
  value?: string;
};

export type IfElseNodeData = {
  label: string;
  conditions: Condition[];
};

const IfElseNode = (props: NodeProps) => {
  const { id, data, selected } = props;
  const conditions = data.conditions as Condition[];
  const bgColor = data?.color as string;
  const settingsData = { conditions: conditions, color: bgColor };

  const conditionStyle = `relative flex items-center justify-end p-2
  rounded-md bg-muted/30 border border-dashed border-border
text-[11px] font-medium text-muted-foreground whitespace-nowrap`;

  return (
    <>
      <WorkflowNode
        nodeId={id}
        label="If/else"
        subText="Conditon"
        icon={GitBranch}
        selected={selected}
        handles={{
          target: true,
          source: false,
        }}
        color={bgColor}
        settingTitle="If / Else Settings"
        settingDescription="Create conditions to branch your workflow"
        settingComponent={<IfElseSettings id={id} data={settingsData} />}
      >
        {conditions?.map((condition, index) => {
          const condition_merge = `${condition.variable}
           ${condition.operator} ${condition.value}
          `;
          return (
            <div key={`condition-${index}`} className="relative">
              <div className={conditionStyle}>
                <p
                  className="whitespace-nowrap overflow-hidden
                 truncate max-w-62.5
                "
                >
                  {condition.caseName ||
                    condition_merge ||
                    `Condition ${index + 1}`}
                </p>
              </div>
              <BaseHandle
                type="source"
                position={Position.Right}
                id={`condition-${index}`}
                className="size-2! -right-1.25"
              />
            </div>
          );
        })}

        <div className="relative">
          <div className={conditionStyle}>Else</div>
          <BaseHandle
            type="source"
            position={Position.Right}
            id="else"
            className="size-2! -right-1.25"
          />
        </div>
      </WorkflowNode>
    </>
  );
};

export default IfElseNode;
