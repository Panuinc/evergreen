"use client";

import Image from "next/image";
import { Button, ScrollShadow } from "@heroui/react";
import { Send, Trash2, ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const suggestions = [
  "มีลูกค้าทั้งหมดกี่คน?",
  "สินค้าไหนมี inventory คงเหลืออยู่?",
  "ใบสั่งขายล่าสุด 5 รายการมีอะไรบ้าง?",
  "มีพนักงานทั้งหมดกี่คน?",
  "รถในระบบ TMS มีสถานะอะไรบ้าง?",
  "คนขับรถที่ใบขับขี่ใกล้หมดอายุมีใครบ้าง?",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-default-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function AssistantMessage({ content, isLoading }) {
  return (
    <div className="flex gap-3 max-w-3xl w-full">
      {}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-light mt-0.5">
        E
      </div>

      {}
      <div className="flex-1 min-w-0 pt-0.5">
        {isLoading && !content ? (
          <TypingIndicator />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert text-foreground text-xs leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="border-collapse w-full text-xs">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-default-100">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-3 py-1.5 text-left font-light text-foreground">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-1.5 text-foreground">
                    {children}
                  </td>
                ),
                tr: ({ children }) => (
                  <tr className="even:bg-default-50">{children}</tr>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
                ),
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-light text-foreground">{children}</strong>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="bg-default-100 rounded px-1 py-0.5 text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-default-100 rounded-lg p-3 overflow-x-auto my-2">
                      <code className="text-xs font-mono">{children}</code>
                    </pre>
                  ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex justify-end max-w-3xl w-full ml-auto">
      <div className="max-w-[75%] bg-default-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs text-foreground whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

export default function DashboardView({
  messages,
  isLoading,
  input,
  setInput,
  showScrollBtn,
  scrollRef,
  textareaRef,
  bottomRef,
  handleSend,
  handleKeyDown,
  handleSuggestion,
  clearMessages,
  scrollToBottom,
}) {
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full relative">
      {}
      <ScrollShadow
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        hideScrollBar
      >
        {isEmpty ? (

          <div className="flex flex-col items-center justify-center min-h-full px-4 py-16 gap-8">
            {}
            <div className="flex flex-col items-center gap-4 text-center">
              <Image
                src="/logo/logo-01.png"
                alt="Evergreen"
                width={64}
                height={64}
                className="w-16 h-16 object-contain opacity-90"
              />
              <div>
                <p className="text-xs font-light text-foreground">
                  Evergreen AI Assistant
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  ถามอะไรก็ได้เกี่ยวกับข้อมูลในระบบ
                </p>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-left px-4 py-3 rounded-xl border border-border hover:border-border hover:bg-default-50 text-xs text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (

          <div className="flex flex-col items-center gap-6 px-4 py-6">
            {messages.map((msg, i) => (
              <div key={i} className="w-full max-w-3xl">
                {msg.role === "user" ? (
                  <UserMessage content={msg.content} />
                ) : (
                  <AssistantMessage
                    content={msg.content}
                    isLoading={isLoading && i === messages.length - 1}
                  />
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollShadow>

      {}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-default-100 border border-border flex items-center justify-center shadow-sm hover:bg-default-200 transition-colors z-10"
        >
          <ArrowDown className="text-muted-foreground" />
        </button>
      )}

      {}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-border transition-colors shadow-sm">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="ถามอะไรก็ได้... (Shift+Enter เพื่อขึ้นบรรทัดใหม่)"
              className="flex-1 resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none min-h-[24px] max-h-40 py-1 disabled:opacity-50"
            />
            <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-default-100 transition-colors"
                  title="ล้างประวัติ"
                >
                  <Trash2 />
                </button>
              )}
              <Button
                isIconOnly
                color="primary"
                size="md"
                radius="md"
                onPress={handleSend}
                isDisabled={!input.trim() || isLoading}
                isLoading={isLoading}
                className="w-8 h-8 min-w-8"
              >
                {!isLoading && <Send />}
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            AI อาจให้ข้อมูลผิดพลาดได้ กรุณาตรวจสอบข้อมูลสำคัญจากระบบโดยตรง
          </p>
        </div>
      </div>
    </div>
  );
}
