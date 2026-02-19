"use client";

import { useState, useRef, useEffect } from "react";
import { Button, ScrollShadow } from "@heroui/react";
import { Send, Trash2, ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/hooks/useChat";

const SUGGESTIONS = [
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
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold mt-0.5">
        E
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {isLoading && !content ? (
          <TypingIndicator />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert text-foreground text-sm leading-relaxed">
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
                  <th className="border border-default-200 px-3 py-1.5 text-left font-semibold text-foreground">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-default-200 px-3 py-1.5 text-foreground">
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
                  <strong className="font-semibold text-foreground">{children}</strong>
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
      <div className="max-w-[75%] bg-default-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-foreground whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

export default function OverviewDashboardPage() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show scroll-to-bottom button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  // Refocus textarea when AI finishes responding
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    if (isLoading) return;
    sendMessage(text);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Messages area ── */}
      <ScrollShadow
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        hideScrollBar
      >
        {isEmpty ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-16 gap-8">
            {/* Logo + Title */}
            <div className="flex flex-col items-center gap-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/logo-03.png"
                alt="Evergreen"
                className="w-16 h-16 object-contain opacity-90"
              />
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Evergreen AI Assistant
                </h1>
                <p className="text-default-500 text-sm mt-1">
                  ถามอะไรก็ได้เกี่ยวกับข้อมูลในระบบ
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-left px-4 py-3 rounded-xl border border-default-200 hover:border-default-400 hover:bg-default-50 text-sm text-default-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat messages */
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

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-default-100 border border-default-200 flex items-center justify-center shadow-sm hover:bg-default-200 transition-colors z-10"
        >
          <ArrowDown size={14} className="text-default-500" />
        </button>
      )}

      {/* ── Input area ── */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl border border-default-200 bg-background px-3 py-2 focus-within:border-default-400 transition-colors shadow-sm">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="ถามอะไรก็ได้... (Shift+Enter เพื่อขึ้นบรรทัดใหม่)"
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-default-400 outline-none min-h-[24px] max-h-40 py-1 disabled:opacity-50"
            />
            <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="p-1.5 rounded-lg text-default-400 hover:text-default-600 hover:bg-default-100 transition-colors"
                  title="ล้างประวัติ"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <Button
                isIconOnly
                color="primary"
                size="sm"
                radius="lg"
                onPress={handleSend}
                isDisabled={!input.trim() || isLoading}
                isLoading={isLoading}
                className="w-8 h-8 min-w-8"
              >
                {!isLoading && <Send size={14} />}
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-default-400 mt-2">
            AI อาจให้ข้อมูลผิดพลาดได้ กรุณาตรวจสอบข้อมูลสำคัญจากระบบโดยตรง
          </p>
        </div>
      </div>
    </div>
  );
}
