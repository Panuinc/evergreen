"use client";

import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { Send } from "lucide-react";

export default function MessageInput({ onSend, sending, disabled }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border-t-2 border-default">
      <Input
        placeholder={disabled ? "การสนทนานี้ปิดแล้ว" : "พิมพ์ข้อความ..."}
        variant="bordered"
        size="md"
        radius="md"
        value={input}
        onValueChange={setInput}
        onKeyDown={handleKeyDown}
        isDisabled={disabled || sending}
      />
      <Button
        isIconOnly
        color="primary"
        size="md"
        radius="md"
        onPress={handleSend}
        isLoading={sending}
        isDisabled={disabled || !input.trim()}
      >
        <Send size={18} />
      </Button>
    </div>
  );
}
