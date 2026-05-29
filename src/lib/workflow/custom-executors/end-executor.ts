import { ExecutorContextType } from "@/types/workflow";
import { Node } from "@xyflow/react"

export async function executeEndNode(
  node: Node,
  context: ExecutorContextType
) {
  const text = node.data.value as string;
  return {
    output: text,
  }
}
