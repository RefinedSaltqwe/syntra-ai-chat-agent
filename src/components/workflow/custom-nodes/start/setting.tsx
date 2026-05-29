import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { CopyIcon, FileText } from "lucide-react";
import { toast } from "sonner";

const StartNodeSetting = ({ nodeId }: { nodeId: string }) => {
  const inputVariable = `${nodeId}-input`;

  const onCopy = () => {
    navigator.clipboard.writeText(`{{${inputVariable}}}`);
    toast.success("Variable copied to clipboard");
  };
  return (
    <div className="space-y-2">
      <h5 className="font-medium">Input Variable</h5>
      <InputGroup className="border!">
        <InputGroupAddon align="inline-start">
          <FileText className="size-4 text-primary" />
        </InputGroupAddon>
        <code
          className="flex-1 bg-background
         px-2 py-1 text-[15px]
          "
        >{`{{${inputVariable}}}`}</code>

        <InputGroupButton variant="ghost" size="icon-sm" onClick={onCopy}>
          <CopyIcon className="size-4 text-muted-foreground" />
        </InputGroupButton>
      </InputGroup>
    </div>
  );
};

export default StartNodeSetting;
