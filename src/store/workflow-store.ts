import { Node, Edge } from "@xyflow/react";
import { create } from "zustand";

interface WorkflowStoreState {
  // Saved state from database
  savedNodes: Node[];
  savedEdges: Edge[];
  setSavedState: (nodes: Node[], edges: Edge[]) => void;
  resetSavedState: () => void;
}

export const useWorkflowStore = create<WorkflowStoreState>((set) => ({
  savedNodes: [],
  savedEdges: [],
  setSavedState: (nodes, edges) =>
    set({
      savedNodes: nodes,
      savedEdges: edges,
    }),
  resetSavedState: () =>
    set({
      savedNodes: [],
      savedEdges: [],
    }),
}));
