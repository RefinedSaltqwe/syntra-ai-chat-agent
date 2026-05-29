import { NodeProps } from "@xyflow/react";
import WorkflowNode from "../../workflow-node";
import { MousePointer2Icon } from "lucide-react";
import AgentSettings from "./settings";

const AgentNode = (props: NodeProps) => {
  const { id, data, selected } = props;
  const bgColor = data?.color as string;
  const label = (data?.label as string) || "Agent";
  return (
    <>
      <WorkflowNode
        nodeId={id}
        label={label}
        subText="Agent"
        icon={MousePointer2Icon}
        selected={selected}
        handles={{
          target: true,
          source: true,
        }}
        color={bgColor}
        settingTitle={`${label} Settings`}
        settingDescription="Call the model with instructions and tools"
        settingComponent={<AgentSettings id={id} data={data} />}
      />
    </>
  );
};

export default AgentNode;
