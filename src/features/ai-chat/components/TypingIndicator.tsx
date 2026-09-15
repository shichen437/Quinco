import { Message, MessageContent, MessageGroup } from "@/components/ui/message"

export function TypingIndicator() {
  return (
    <MessageGroup>
      <Message align="start">
        <MessageContent className="mx-4 my-1">
          <div className="flex items-center gap-1  px-4 py-3">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
          </div>
        </MessageContent>
      </Message>
    </MessageGroup>
  )
}
