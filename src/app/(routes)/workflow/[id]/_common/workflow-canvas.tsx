/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActionBar,
  ActionBarGroup,
  ActionBarItem,
} from "@/components/ui/action-bar";
import { Spinner } from "@/components/ui/spinner";
import ChatView from "@/components/workflow/chat";
import Controls from "@/components/workflow/controls";
import AgentNode from "@/components/workflow/custom-nodes/agent/node";
import CommentNode from "@/components/workflow/custom-nodes/comment/node";
import EndNode from "@/components/workflow/custom-nodes/end/node";
import { HttpNode } from "@/components/workflow/custom-nodes/http/node";
import IfElseNode from "@/components/workflow/custom-nodes/if-else/node";
import StartNode from "@/components/workflow/custom-nodes/start/node";
import { TOOL_MODE_ENUM, ToolModeType } from "@/constant/workflow";
import { useWorkflow } from "@/context/workflow-context";
import { useUpdateWorkflow } from "@/features/use-workflow";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { cn } from "@/lib/utils";
import { createNode, NodeType, NodeTypeEnum } from "@/lib/workflow/node-config";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Edge,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useState } from "react";
import NodePanel from "./node-panel";

const WorkflowCanvas = ({ workflowId }: { workflowId: string }) => {
  const { view, nodes, edges, setNodes, setEdges } = useWorkflow();
  const { screenToFlowPosition } = useReactFlow();

  const [toolMode, setToolMode] = useState<ToolModeType>(TOOL_MODE_ENUM.HAND);

  const { mutate: updateWorkflow, isPending: isSaving } =
    useUpdateWorkflow(workflowId);

  const { hasUnsavedChanges, discardChanges } = useUnsavedChanges({
    nodes,
    edges,
  });

  const isSelectMode = toolMode === TOOL_MODE_ENUM.SELECT;
  const isPreview = view === "preview";

  const nodeTypes = {
    [NodeTypeEnum.START]: StartNode,
    [NodeTypeEnum.AGENT]: AgentNode,
    [NodeTypeEnum.IF_ELSE]: IfElseNode,
    [NodeTypeEnum.HTTP]: HttpNode,
    [NodeTypeEnum.COMMENT]: CommentNode,
    [NodeTypeEnum.END]: EndNode,
  };

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges],
  );
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [setEdges],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      setEdges((eds) =>
        eds.filter((e) => !deletedEdges.some((de) => de.id === e.id)),
      );
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const node_type = event.dataTransfer.getData(
        "application/reactflow",
      ) as NodeType;
      if (!node_type) return null;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = createNode({
        type: node_type,
        position,
      });
      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const handleDiscard = () => {
    const result = discardChanges();
    setNodes(result.nodes);
    setEdges(result.edges);
  };

  const handleSaveChanges = () => {
    updateWorkflow({ nodes, edges });
  };

  console.log("ALL NODES", nodes);
  console.log("ALL EDGES", edges);

  return (
    <>
      <div className="relative flex flex-1 h-full overflow-hidden">
        <div className="flex-1 relative h-full bg-sidebar">
          <ReactFlow
            className={cn(
              isSelectMode
                ? "cursor-default"
                : "cursor-grab active:cursor-grabbing",
            )}
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgesDelete={onEdgesDelete}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            // fitView
            panOnDrag={!isSelectMode}
            panOnScroll={!isSelectMode}
            zoomOnScroll={!isSelectMode}
            // nodesDraggable={isSelectMode}
            selectionOnDrag={isSelectMode}
            defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              className="pointer-events-none"
            />
            {!isPreview && (
              <div className="absolute left-4 top-4 z-50">
                <NodePanel />
              </div>
            )}
            {!isPreview && (
              <Controls toolMode={toolMode} setToolMode={setToolMode} />
            )}
          </ReactFlow>
        </div>

        <ChatView workflowId={workflowId} />
      </div>

      <ActionBar
        open={hasUnsavedChanges}
        side="top"
        align="center"
        sideOffset={70}
        className="max-w-xs"
      >
        <ActionBarGroup>
          <ActionBarItem
            disabled={isSaving}
            variant="ghost"
            onClick={handleDiscard}
          >
            Discard
          </ActionBarItem>
          <ActionBarItem disabled={isSaving} onClick={handleSaveChanges}>
            {isSaving && <Spinner />}
            Save Changes
          </ActionBarItem>
        </ActionBarGroup>
      </ActionBar>
    </>
  );
};

export default WorkflowCanvas;
