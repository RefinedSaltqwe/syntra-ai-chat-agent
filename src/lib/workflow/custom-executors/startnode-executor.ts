import { ExecutorContextType } from "@/types/workflow";
import { Node } from "@xyflow/react"

export async function executeStartNode(
  node: Node,
  context: ExecutorContextType
) {
  return {
    output: {
      input: context.outputs[node.id].input || ""
    }
  }
}
