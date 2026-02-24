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
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-default-100 text-default-500 animate-pulse">
        <Icon size={12} />
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
      {/* Floating Button */}
      <Button
        isIconOnly
        color="primary"
        size="lg"
        radius="full"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 shadow-lg w-14 h-14"
        onPress={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </Button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 left-4 md:left-auto md:right-6 z-50 md:w-96 h-[70vh] md:h-125 flex flex-col bg-background border-2 border-default rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b-2 border-default">
              <span className="font-semibold text-lg">ผู้ช่วย AI</span>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                radius="md"
                onPress={clearMessages}
              >
                <Trash2 size={16} />
              </Button>
            </div>

            {/* Messages */}
            <ScrollShadow ref={scrollRef} className="flex-1 p-3 overflow-y-auto">
              {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full text-default-400 text-sm">
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
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-default-100"
                      }`}
                    >
                      {msg.content || (isLoading && i === messages.length - 1 ? "..." : "")}
                    </div>
                  </div>
                ))}

                {/* Active agent indicator */}
                {activeAgent && <AgentIndicator agent={activeAgent} />}
              </div>
            </ScrollShadow>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 border-t-2 border-default">
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
                <Send size={18} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
