import { Sparkles } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { GradientIcon } from "@/components/common/GradientIcon"
import { Message, MessageContent, MessageGroup } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { useAiChatStore } from "@/stores/aiChatStore"

import { TypingIndicator } from "./TypingIndicator"

const mdComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-4 mb-2 text-lg font-semibold" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-3 mb-1.5 text-base font-semibold" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-2 leading-relaxed" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-2 ml-4 list-disc space-y-0.5" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-2 ml-4 list-decimal space-y-0.5" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="leading-relaxed" {...props} />,
  code: ({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) => {
    const isInline = !className?.startsWith("language-")
    return isInline ? (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] font-medium" {...rest}>
        {children}
      </code>
    ) : (
      <code className="block font-mono text-[13px]" {...rest}>
        {children}
      </code>
    )
  },
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-muted/60 p-3 dark:bg-muted/40" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-2 border-l-2 border-muted-foreground/40 pl-3 text-muted-foreground italic"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-primary underline underline-offset-2 hover:text-primary/80" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-border px-3 py-1.5 text-left text-sm font-medium" {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-border px-3 py-1.5 text-sm" {...props} />
  ),
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="max-w-none px-4 py-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function ChatMessages() {
  const { t } = useTranslation("home")
  const messages = useAiChatStore((s) => s.messages)
  const loading = useAiChatStore((s) => s.loading)

  return (
    <MessageScroller>
      <MessageScrollerViewport>
        <MessageScrollerContent className="gap-4 pt-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
              <GradientIcon icon={Sparkles} className="mb-4 size-10" />
              <h3 className="mb-1 text-base font-medium">{t("welcomeMessage.heading")}</h3>
              <p className="max-w-xs text-sm text-muted-foreground">{t("welcomeMessage.text")}</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageGroup>
                  <Message align={msg.role === "user" ? "end" : "start"}>
                    <MessageContent className="my-1">
                      {msg.role === "user" ? (
                        <div className="ml-auto mr-1 max-w-[85%] rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                          {msg.content}
                        </div>
                      ) : (
                        <AssistantMessage content={msg.content} />
                      )}
                    </MessageContent>
                  </Message>
                </MessageGroup>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && <TypingIndicator />}

          <MessageScrollerItem />
        </MessageScrollerContent>
      </MessageScrollerViewport>

      <MessageScrollerButton />
    </MessageScroller>
  )
}
