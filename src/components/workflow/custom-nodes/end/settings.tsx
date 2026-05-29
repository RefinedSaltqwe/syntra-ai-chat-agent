import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReactFlow } from "@xyflow/react";
import React from "react";

interface EndNodeData {
  value?: string;
  color?: string;
}

type PropsType = {
  id: string;
  data: EndNodeData;
};
const EndSettings = ({ id, data }: PropsType) => {
  const { updateNodeData } = useReactFlow();
  const [value, setValue] = React.useState(data.value || "");

  const handleValueChange = () => {
    updateNodeData(id, {
      value: value,
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="output" className="font-medium">
        Output
      </Label>
      <Textarea
        id="output"
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleValueChange}
        placeholder="Define the output variable or message"
        className="bg-muted/50 resize-none"
      />
      <p className="text-xs text-muted-foreground">
        Set the final output value or message for the workflow
      </p>
    </div>
  );
};

export default EndSettings;
