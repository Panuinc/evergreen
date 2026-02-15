"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (content) => {
    const userMessage = { role: "user", content };
    const updatedMessages = [...messages, userMessage];

    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
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
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages([
                ...updatedMessages,
                { role: "assistant", content: assistantContent },
              ]);
            }
          } catch {
            // skip malformed JSON chunks
          }
        }
      }

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: assistantContent },
      ]);
    } catch (error) {
      if (error.name === "AbortError") return;
      toast.error("Failed to get response");
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
