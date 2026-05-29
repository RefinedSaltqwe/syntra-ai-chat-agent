import { createNode, NodeTypeEnum } from "@/lib/workflow/node-config";
import { Edge, Node } from "@xyflow/react";
import { createContext, useContext, useState } from "react";

export type WorkflowView = "edit" | "preview";

interface WorkflowContextType {
  view: WorkflowView;
  setView: (view: WorkflowView) => void;
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  getVariablesForNode: (nodeId: string) => {
    id: string;
    label: string;
    outputs: string[];
  }[];
}

//Workflow context to manage the state of the workflow editor, including the nodes, edges, view mode and helper functions to get upstream nodes and their outputs for variable mapping in node settings
const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined,
);

//Custom hook to use the workflow context, ensures that the hook is used within a WorkflowProvider and provides type safety for the context value
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}

//WorkflowProvider component that wraps the workflow editor and provides the workflow context to all child components, handles the state for nodes, edges and view mode, also includes helper functions to get upstream nodes and their outputs for variable mapping in node settings
export function WorkflowProvider({
  // workflowId,
  initialNodes,
  initialEdges,
  children,
}: {
  children: React.ReactNode;
  // workflowId: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const start_node = createNode({
    type: NodeTypeEnum.START,
  });

  const [view, setView] = useState<WorkflowView>("edit");
  //Set initial nodes and edges from props, if not provided, create a default start node
  const [nodes, setNodes] = useState<Node[]>(
    initialNodes.length ? initialNodes : [start_node],
  );

  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  //Helper function to get all upstream nodes for a given node id, used for variable mapping in node settings
  const getUpstreamNodes = (nodeId: string) => {
    const upstream = new Set<string>();

    const addToSet = (id: string) => {
      edges
        .filter((e) => e.target === id)
        .forEach((e) => {
          upstream.add(e.source);
          //Recursively add upstream nodes of the source node to the set, ensures that all upstream nodes are included in the result
          addToSet(e.source);
        });
    };
    addToSet(nodeId);
    return upstream;
  };
  //Get all upstream nodes and their outputs for a given node id, used for variable mapping in node settings
  const getVariablesForNode = (nodeId: string) => {
    const upstreamIds = getUpstreamNodes(nodeId);
    return nodes
      .filter((node) => upstreamIds.has(node.id))
      .map((node) => ({
        id: node.id,
        label: String(node.data.label) || "Unknown",
        outputs: (node.data.outputs as string[]) || [],
      }));
  };

  return (
    <WorkflowContext.Provider
      value={{
        view,
        setView,
        nodes,
        edges,
        setNodes,
        setEdges,
        getVariablesForNode,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}
