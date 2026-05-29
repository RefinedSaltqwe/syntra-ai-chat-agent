import { NodeProps } from "@xyflow/react";
import { Square } from "lucide-react";
import WorkflowNode from "../../workflow-node";
import EndSettings from "./settings";

const EndNode = ({ data, selected, id }: NodeProps) => {
  const bgColor = data.color as string;
  return (
    <>
      <WorkflowNode
        nodeId={id}
        label="End"
        subText=""
        className="min-w-fit!"
        isDeletable={true}
        icon={Square}
        selected={selected}
        handles={{ target: true, source: false }}
        color={bgColor}
        settingTitle="End Node Settings"
        settingDescription="Choose the workflow output"
        settingComponent={<EndSettings id={id} data={data} />}
      />
    </>
  );
};

export default EndNode;
