import { NodeProps } from "@xyflow/react";
import WorkflowNode from "../../workflow-node";
import { PlayIcon } from "lucide-react";
import StartNodeSetting from "./setting";

const StartNode = (props: NodeProps) => {
  const { id, data, selected } = props;
  const bgColor = data?.color as string;
  return (
    <>
      <WorkflowNode
        nodeId={id}
        label="Start"
        subText="Trigger"
        icon={PlayIcon}
        className="min-w-28!"
        isDeletable={false}
        selected={selected}
        handles={{
          target: false,
          source: true,
        }}
        color={bgColor}
        settingTitle="Start Node Settings"
        settingDescription="The worflow starting point"
        settingComponent={<StartNodeSetting nodeId={id} />}
      />
    </>
  );
};

export default StartNode;
