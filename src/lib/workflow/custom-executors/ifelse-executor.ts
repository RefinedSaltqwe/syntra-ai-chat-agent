import { replaceVariables } from "@/lib/helper";
import { ExecutorContextType } from "@/types/workflow";
import { Parser } from "expr-eval";
import { Node } from "@xyflow/react"

type Condition = {
  caseName?: string;
  variable?: string;
  operator?: string;
  value?: string;
}

export async function executeIfElseNode(
  node: Node,
  context: ExecutorContextType
) {
  const { outputs } = context;
  const conditions = (node.data.conditions as Condition[]) || []

   function needsQuoting(val: string) {
    // Checks if val does not already start and end with a quote
    return isNaN(Number(val)) && !/^["'].*["']$/.test(val);
  }

  if (!Array.isArray(conditions)) {
    throw new Error("Conditions must be an array");
  }

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    if (
      !condition.variable ||
      !condition.operator ||
      condition.value === undefined
    )
      continue;

     // Replace variables in variable and value fields
    const variable = replaceVariables(condition.variable, outputs).trim();
    const value = replaceVariables(condition.value, outputs).trim();

    // If variable is a string and not a number, quote it
    const variableExpr = needsQuoting(variable)
      ? JSON.stringify(variable)
      : variable;
    const valueExpr = needsQuoting(value) ? JSON.stringify(value) : value;

      // Normalize both sides consistently
      // const variableExpr = buildExpr(resolvedVariable);
      // const valueExpr = buildExpr(resolvedValue);

    const expr = `${variableExpr} ${condition.operator} ${valueExpr}`;

    try {
      const parser = new Parser();
      const result = parser.evaluate(expr);
      console.log(`Evaluating condition: ${expr} => ${result}`);
      if (result) {
        return {
          output: {
            result: true,
            selectedBranch: `condition-${i}`,
          }
        }
      }
    } catch (error) {
      console.log("Condition evaluation error:", error);
      throw new Error(`Error evaluating condition`);
    }
  }

  return {
    output: {
      result: false,
      selectedBranch: "else",
    }
  }

}
