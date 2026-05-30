import { Node, Edge } from "@xyflow/react";
import { UIMessage } from "ai";
import TopologicalSort from "topological-sort";
import { getNodeExecutor, NodeType, NodeTypeEnum } from "./node-config";
import { ExecutorContextType, WorkflowNodeOutput } from "@/types/workflow";

export type AgentNodeData = {
  label: string;
  instructions: string;
};

export type WorkflowNode = Node<AgentNodeData>;

// ============================================================================
// Sort workflow nodes into dependency-safe execution order
// - Builds graph from nodes and edges
// - Detects circular dependencies
// - Excludes non-executable nodes
// ============================================================================

export function topologicalSort(nodes: WorkflowNode[], edges: Edge[]) {
  // Initialize dependency graph
  const ts = new TopologicalSort(new Map());

  // Node types excluded from execution
  const excludedNodes: NodeType[] = [NodeTypeEnum.COMMENT];

  // Register all workflow nodes
  nodes.forEach((node) => {
    ts.addNode(node.id, node);
  });

  // Register node dependencies
  edges.forEach((edge) => {
    ts.addEdge(edge.source, edge.target);
  });

  // Optional edge deduplication safeguard
  // const seenEdges = new Set<string>();
  // edges.forEach((edge) => {
  //   const key = `${edge.source}->${edge.target}`;
  //   if (!seenEdges.has(key)) {
  //     seenEdges.add(key);
  //     ts.addEdge(edge.source, edge.target);
  //   }
  // });

  try {
    // Generate dependency-sorted graph
    const sortedMap = ts.sort();

    // Extract sorted node ids
    const sortedIds = Array.from(sortedMap.keys());

    // Convert ids back to workflow nodes
    return (
      sortedIds
        .map((id) => nodes.find((node) => node.id === id)!)

        // Remove excluded node types
        .filter(
          (node) =>
            node.type !== undefined &&
            !excludedNodes.includes(node.type as NodeType),
        )
    );
  } catch (error) {
    // Workflow contains circular dependencies
    throw new Error(
      "Workflow contains a cycle or invalid dependencies. Cannot execute.",
      { cause: error },
    );
  }
}
/* ============================================================================
   NEXT NODE RESOLUTION

   Flow:
   1. Find outgoing edges
   2. Check for workflow completion
   3. Read current node output
   4. Resolve branch selection
   5. Return next node(s)

   Responsibilities:
   - Flow navigation
   - Branch routing
   - Execution path resolution
============================================================================ */
export function getNextNodes(
  currentNodeId: string,
  edges: Edge[],
  context: ExecutorContextType,
) {
  // Find all outgoing connections
  const outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);

  // End of workflow reached
  if (outgoingEdges.length === 0) return [];

  // Retrieve current node execution result
  const currentOutput = context.outputs[currentNodeId];

  // Route using selected branch output
  if (currentOutput?.selectedBranch) {
    // Find matching branch edge
    const branchEdge = outgoingEdges.find(
      (edge) => edge.sourceHandle === currentOutput.selectedBranch,
    );

    // Return selected path only
    return branchEdge ? [branchEdge.target] : [];
  }

  // Return all connected downstream nodes
  return outgoingEdges.map((edge) => edge.target);
}

/**
 * Executes the workflow graph node-by-node in topological order.
 *
 * Flow:
 * 1. Finds the START node and initializes execution context
 * 2. Sorts workflow nodes based on dependencies/edges
 * 3. Executes eligible nodes sequentially
 * 4. Streams realtime node status updates to the client
 * 5. Stores node outputs in shared workflow context
 * 6. Resolves next executable nodes from graph edges
 * 7. Stops when reaching the END node or no next nodes exist
 *
 * Features:
 * - Realtime workflow progress streaming
 * - Shared node execution context/history
 * - Dynamic node executor system
 * - Error handling with streamed error states
 * - Conditional workflow branching support
 *
 * Stream Events:
 * - loading → node execution started
 * - complete → node execution finished
 * - error → node execution failed
 * - finish → workflow execution ended
 */
export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: Edge[],
  userInput: string,
  messages: UIMessage[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel: any,
  workflowRunId: string,
) {
  // 1. Find START node in workflow graph
  const startNode = nodes.find((node) => node.type === NodeTypeEnum.START);

  if (!startNode) throw new Error("Start node not found in the workflow");

  // 2. Initialize shared workflow execution context
  const context: ExecutorContextType = {
    outputs: {
      [startNode.id]: { input: userInput }, // {{startId.input}}
    },
    history: messages || [],
    workflowRunId,
    channel,
  };

  // 3. Sort workflow nodes based on dependencies/edges
  const sortedNodes = topologicalSort(nodes, edges);

  console.log("Execution history:", JSON.stringify(messages, null, 2));

  // Track nodes ready for execution
  const nodesToExecute = new Set<string>([startNode.id]);

  // 4. Execute workflow nodes sequentially
  for (const node of sortedNodes) {
    // Skip nodes not ready for execution
    if (!nodesToExecute.has(node.id)) {
      continue;
    }

    const nodeType = node.type as NodeType;

    // 5. Get node executor from node-config.ts
    const executor = getNodeExecutor(nodeType);

    // Emit loading state to frontend
    await channel.emit("workflow.chunk", {
      type: "data-workflow-node",
      id: node.id,
      data: {
        id: node.id,
        nodeType: node.type,
        nodeName: node.data.label,
        status: "loading",
      },
    });

    // 6. Execute node logic and stream output/errors
    try {
      const result = await executor(node, context);

      // Emit completed node state + output
      await channel.emit("workflow.chunk", {
        type: "data-workflow-node",
        id: node.id,
        data: {
          id: node.id,
          nodeType: node.type,
          nodeName: node.data.label,
          status: "complete",
          output:
            typeof result?.output === "object" &&
            result.output !== null &&
            "text" in result.output
              ? result.output.text
              : result?.output,
        },
      });

      // 7. Store node output in shared workflow context
      if (node.type !== NodeTypeEnum.START) {
        const outputResult =
          node.type === NodeTypeEnum.AGENT ? result : result?.output;

        context.outputs[node.id] = outputResult as WorkflowNodeOutput;
      }

      // 8. Stop workflow when END node is reached
      if (node.type === NodeTypeEnum.END) {
        console.log("Workflow execution completed.");

        await channel.emit("workflow.chunk", {
          type: "finish",
          reason: "stop",
        });

        return {
          success: true,
          output: context.outputs,
        };
      }

      // 9. Resolve next executable nodes from graph edges
      const nextNodeIds = getNextNodes(node.id, edges, context);

      // Stop workflow if no next nodes exist
      if (nextNodeIds.length === 0) {
        await channel.emit("workflow.chunk", {
          type: "finish",
          reason: "stop",
        });

        return {
          success: true,
          output: "Workflow stopped. No next nodes to execute.",
        };
      }

      // Queue next nodes for execution
      nextNodeIds.forEach((id) => nodesToExecute.add(id));
    } catch (error) {
      // 10. Emit node execution error to frontend
      await channel.emit("workflow.chunk", {
        type: "data-workflow-node",
        id: node.id,
        data: {
          id: node.id,
          nodeType: node.type,
          nodeName: node.data?.label,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
      });

      // Emit workflow finish event before stopping
      await channel.emit("workflow.chunk", {
        type: "finish",
        reason: "error",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Final workflow completion event
  await channel.emit("workflow.chunk", {
    type: "finish",
    reason: "stop",
  });

  return {
    success: true,
    output: context.outputs,
  };
}
