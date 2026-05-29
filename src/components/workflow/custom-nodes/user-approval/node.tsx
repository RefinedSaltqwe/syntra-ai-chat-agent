"use client";

import React from "react";
import { UserCheck } from "lucide-react";
import { Position, NodeProps } from "@xyflow/react";
import WorkflowNode from "../../workflow-node";
import { BaseHandle } from "../../react-flow/base-handle";
import { UserApprovalSetting } from "./settings";

export const UserApprovalNode = ({ data, selected, id }: NodeProps) => {
  const options = (data.options as string[]) || ["Approve", "Reject"];
  const bgcolor = (data?.color as string) || "bg-orange-500";
  const label = (data?.name as string) || "User approval";
  const message = (data?.message as string) || "Condition";

  return (
    <>
      <WorkflowNode
        nodeId={id}
        label={label}
        subText={message}
        className="w-full"
        icon={UserCheck}
        selected={selected}
        handles={{ target: true, source: false }}
        color={bgcolor}
        settingTitle="User approval"
        settingDescription="Pause for a human to approve or reject a step"
        settingComponent={<UserApprovalSetting id={id} data={data} />}
      >
        {options?.map((option: string, index: number) => (
          <div
            key={option}
            className="relative flex items-center justify-end py-2 px-4 rounded-md bg-muted/50 border border-border text-[12px] font-medium"
          >
            {option}
            <BaseHandle
              type="source"
              position={Position.Right}
              id={`option-${index}`}
              className="size-2! -right-1.25"
            />
          </div>
        ))}
      </WorkflowNode>
    </>
  );
};
