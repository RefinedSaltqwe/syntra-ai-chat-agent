import { useMemo, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflow-store";

interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
  discardChanges: () => {
    nodes: Node[];
    edges: Edge[];
  };
}

export function useUnsavedChanges({
  nodes,
  edges,
}: {
  nodes: Node[];
  edges: Edge[];
}): UseUnsavedChangesReturn {
  const { savedNodes, savedEdges } = useWorkflowStore();

  const hasUnsavedChanges = useMemo(() => {
    const nodeData = (list: Node[]) =>
      list?.map((n) => ({ id: n.id, type: n.type, data: n.data }));
    const edgeData = (list: Edge[]) =>
      list?.map((e) => ({ source: e.source, target: e.target, id: e.id }));

    return (
      JSON.stringify(nodeData(nodes)) !==
      JSON.stringify(nodeData(savedNodes)) ||
      JSON.stringify(edgeData(edges)) !== JSON.stringify(edgeData(savedEdges))
    );
  }, [nodes, edges, savedNodes, savedEdges]);

  const discardChanges = useCallback(() => {
    return { nodes: savedNodes, edges: savedEdges };
  }, [savedNodes, savedEdges]);

  return {
    hasUnsavedChanges,
    discardChanges,
  };
}
