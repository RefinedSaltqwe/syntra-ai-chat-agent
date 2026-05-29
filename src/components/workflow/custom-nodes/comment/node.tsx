import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NodeProps, useReactFlow } from '@xyflow/react'
import { Textarea } from '@/components/ui/textarea'

const CommentNode = ({ data, id }: NodeProps) => {
  const { updateNodeData } = useReactFlow()
  const comment_str = data.comment as string
  const [comment, setComment] = useState(comment_str)

  const handleCommentChange = (value: string) => {
    updateNodeData(id, { comment: value })
  }

  return (
    <div
      className={cn(
        `w-full h-full box-border p-1 border rounded-lg
        bg-amber-300 dark:bg-[#b08915]
        `
      )}
      style={{
        width: '150px',
        minHeight: '65px',
        maxHeight: '150px'
      }}
    >
      <Textarea
        value={comment || ""}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => handleCommentChange(comment)}
        placeholder="write a comment..."
        className="w-full h-full px-1! resize-none
        border-none bg-transparent focus-visible:ring-0
        focus-visible:ring-offset-0 text-xs! shadow-none
        overflow-auto  dark:text-black"
        style={{
          minHeight: '65px',
          maxHeight: '150px'
        }}
      />
    </div>
  )
}

export default CommentNode
