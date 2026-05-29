"use client";

import { Spinner } from "@/components/ui/spinner";
import { WorkflowProvider } from "@/context/workflow-context";
import { useGetWorkflowById } from "@/features/use-workflow";
import { ReactFlowProvider } from "@xyflow/react";
import { useParams } from "next/navigation";
import Header from "./_common/header";
import WorkflowCanvas from "./_common/workflow-canvas";

const Page = () => {
  const params = useParams();
  const id = params.id as string;
  //Fetch workflow data using the id from params
  const { data: workflow, isPending } = useGetWorkflowById(id);

  const nodes = workflow?.flowObject?.nodes ?? [];
  const edges = workflow?.flowObject?.edges ?? [];

  if (isPending) {
    return (
      <div
        className="flex items-center justify-center
          h-screen
          "
      >
        <Spinner className="size-12 text-primary" />
      </div>
    );
  }

  if (!workflow) {
    return <div>Workflow not found</div>;
  }

  return (
    <div className="min-h-screen bg-sidebar">
      <ReactFlowProvider>
        <WorkflowProvider
          //workflowId={workflow?.id || ""}
          //Set initial nodes and edges from workflow data, if not available, it will be handled in the context provider by creating a default start node
          initialNodes={nodes}
          initialEdges={edges}
        >
          <div className="flex flex-col h-screen relative">
            <Header
              isLoading={isPending}
              name={workflow?.name}
              workflowId={workflow?.id}
            />
            <div className="flex-1 relative overflow-hidden">
              {isPending ? (
                <div
                  className="flex items-center justify-center
          h-full
          "
                >
                  <Spinner className="size-12 text-primary" />
                </div>
              ) : (
                <WorkflowCanvas workflowId={workflow.id} />
              )}
            </div>
          </div>
        </WorkflowProvider>
      </ReactFlowProvider>
    </div>
  );
};

export default Page;
