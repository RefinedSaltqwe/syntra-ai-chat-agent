import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWorkflow } from "@/context/workflow-context";
import ChatPanel from "./chat-panel";

const ChatView = ({ workflowId }: { workflowId: string }) => {
  const { view, setView } = useWorkflow();
  const isPreview = view === "preview";

  const handlePreviewClose = () => {
    setView("edit");
  };
  return (
    <>
      <Sheet
        modal={false}
        open={isPreview}
        onOpenChange={(open) => !open && handlePreviewClose()}
      >
        <SheetOverlay className="bg-black/5! backdrop-blur-none!" />
        <SheetContent
          side="right"
          showCloseButton={false}
          className="sm:max-w-lg! w-full p-0 top-18! h-full
          max-h-[calc(100vh-5rem)] z-95 bg-background
          rounded-md overflow-hidden mr-1
          "
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workflow Chat Preview</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            <ChatPanel workflowId={workflowId} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChatView;
