"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/apiClient";
import type { ChatMessage, ActiveAgent, UseChatReturn } from "@/modules/overview/types";

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<ActiveAgent | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: "user", content };
    const updatedMessages: ChatMessage[] = [...messages, userMessage];

    setMessages([...updatedMessages, { role: "assistant" as const, content: "" }]);
    setIsLoading(true);
    setActiveAgent(null);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await authFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ส่งข้อความล้มเหลว");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);


            if (parsed.type === "agent_start") {
              setActiveAgent({ name: parsed.agentName, icon: parsed.agentIcon });
              continue;
            }


            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages([
                ...updatedMessages,
                { role: "assistant" as const, content: assistantContent },
              ]);
            }
          } catch {

          }
        }
      }

      setMessages([
        ...updatedMessages,
        { role: "assistant" as const, content: assistantContent },
      ]);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      toast.error("ไม่สามารถรับการตอบกลับได้");
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
      setActiveAgent(null);
      abortRef.current = null;
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsLoading(false);
    setActiveAgent(null);
  }, []);

  return { messages, isLoading, activeAgent, sendMessage, clearMessages };
}
