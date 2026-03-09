"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Input, ScrollShadow } from "@heroui/react";
import { MessageCircle, X, Trash2, Send, Users, ShoppingCart, Truck, Landmark, Bot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/hooks/shared/useChat";

const AGENT_ICONS = {
  users: Users,
  "shopping-cart": ShoppingCart,
  truck: Truck,
  landmark: Landmark,
};

function AgentIndicator({ agent }) {
  const Icon = AGENT_ICONS[agent.icon] || Bot;
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-default-100 text-muted-foreground animate-pulse">
        <Icon />
        <span>{agent.name} กำลังค้นหา...</span>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, activeAgent, sendMessage, clearMessages } = useChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeAgent]);

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

  return (
    <>
      {}
      <Button
        isIconOnly
        color="primary"
        size="lg"
        radius="full"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 shadow-lg w-14 h-14"
        onPress={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <MessageCircle />}
      </Button>

      {}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 left-4 md:left-auto md:right-6 z-50 md:w-96 h-[70vh] md:h-125 flex flex-col bg-background border-2 border-border rounded-xl shadow-xl overflow-hidden"
          >
            {}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-light text-xs">ผู้ช่วย AI</span>
              <Button
                isIconOnly
                variant="light"
                size="md"
                radius="md"
                onPress={clearMessages}
              >
                <Trash2 />
              </Button>
            </div>

            {}
            <ScrollShadow ref={scrollRef} className="flex-1 p-3 overflow-y-auto">
              {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                  ถามอะไรก็ได้เกี่ยวกับข้อมูลในระบบ
                </div>
              )}
              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-default-100"
                      }`}
                    >
                      {msg.content || (isLoading && i === messages.length - 1 ? "..." : "")}
                    </div>
                  </div>
                ))}

                {}
                {activeAgent && <AgentIndicator agent={activeAgent} />}
              </div>
            </ScrollShadow>

            {}
            <div className="flex items-center gap-2 p-3 border-t border-border">
              <Input
                placeholder="พิมพ์ข้อความ..."
                variant="bordered"
                size="md"
                radius="md"
                value={input}
                onValueChange={setInput}
                onKeyDown={handleKeyDown}
                isDisabled={isLoading}
              />
              <Button
                isIconOnly
                color="primary"
                size="md"
                radius="md"
                onPress={handleSend}
                isLoading={isLoading}
              >
                <Send />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
