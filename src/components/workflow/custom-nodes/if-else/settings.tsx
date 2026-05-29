"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReactFlow } from "@xyflow/react";
import { Plus, Trash2Icon } from "lucide-react";
import MentionInput from "../../mention-input";
import { useState } from "react";

type Condition = {
  caseName?: string;
  variable?: string;
  operator?: string;
  value?: string;
};

interface IfElseNodeData {
  conditions: Condition[];
  color?: string;
}

type PropsType = {
  id: string;
  data: IfElseNodeData;
};

const OPERATORS = [
  { label: "Equals", value: "==" },
  { label: "Not equals", value: "!=" },
  { label: "Greater than", value: ">" },
  { label: "Less than", value: "<" },
];

const IfElseSettings = ({ id, data }: PropsType) => {
  const { updateNodeData } = useReactFlow();
  // const conditions = data.conditions as Condition[];
  const [conditions, setConditions] = useState<Condition[]>(
    data.conditions || [],
  );

  const handleAddCondition = () => {
    const updatedConditions = [
      ...conditions,
      {
        caseName: "",
        variable: "",
        operator: "",
        value: "",
      },
    ];

    setConditions(updatedConditions);

    updateNodeData(id, {
      conditions: updatedConditions,
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      const updatedConditions = conditions.filter((_, i) => i !== index);
      setConditions(updatedConditions);
      updateNodeData(id, {
        conditions: updatedConditions,
      });
    }
  };

  // const handleUpdateCondition = (
  //   index: number,
  //   field: keyof Condition,
  //   value: string,
  // ) => {
  //   const updateConditions = [...conditions];
  //   updateConditions[index] = {
  //     ...updateConditions[index],
  //     [field]: value,
  //   };
  //   updateNodeData(id, {
  //     conditions: updateConditions,
  //   });
  // };

  const handleUpdateCondition = (
    index: number,
    field: keyof Condition,
    value: string,
  ) => {
    //Update the local state immediately for better UX, the changes will be saved to the node data on blur or operator change
    setConditions((prev) => {
      const newConditions = [...prev];
      newConditions[index] = {
        ...newConditions[index],
        [field]: value,
      };
      return newConditions;
    });
  };

  const saveData = () => {
    updateNodeData(id, {
      conditions,
    });
  };

  const getConditionLabel = (index: number) => {
    if (index === 0) return "If";
    return "Else if";
  };

  return (
    <div>
      <div className="space-y-2">
        {conditions?.map((condition, index) => {
          return (
            <div
              key={`condtion-setting-${index}`}
              className="space-y-2 pb-2.5 border-b
               last:border-b-0
              "
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {getConditionLabel(index)}
                </h4>

                {conditions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6 hover:bg-destructive/10
                     hover:text-destructive
                    "
                    onClick={() => handleRemoveCondition(index)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  value={condition.caseName || ""}
                  placeholder="Case name (optional)"
                  className="bg-muted/50"
                  onChange={(e) => {
                    handleUpdateCondition(index, "caseName", e.target.value);
                  }}
                  onBlur={saveData}
                />

                <div className="flex gap-2">
                  <MentionInput
                    nodeId={id}
                    value={condition.variable || ""}
                    placeholder="{{agent.ouput}}"
                    multiline={false}
                    onChange={(value) =>
                      handleUpdateCondition(index, "variable", value)
                    }
                    onBlur={saveData}
                    className="bg-muted/50! text-xs w-full max-w-48!"
                  />

                  <Select
                    value={condition.operator || ""}
                    onValueChange={(value) => {
                      handleUpdateCondition(index, "operator", value);
                      saveData();
                    }}
                  >
                    <SelectTrigger className="w-28 text-lg">
                      <SelectValue>{condition.operator || ""}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS?.map((operator) => (
                        <SelectItem
                          key={operator.value}
                          value={operator.value}
                          onClick={saveData}
                        >
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value || ""}
                    onChange={(e) =>
                      handleUpdateCondition(index, "value", e.target.value)
                    }
                    onBlur={saveData}
                    placeholder="Value"
                    className="bg-muted/50 text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="outline" size="sm" onClick={handleAddCondition}>
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  );
};

export default IfElseSettings;
