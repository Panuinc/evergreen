"use client";

import { useState, useEffect } from "react";
import { Input, Button, Tooltip } from "@heroui/react";
import { Send, Sparkles } from "lucide-react";

export default function MessageInput({ onSend, onSuggest, sending, suggestLoading, disabled, suggestedText }) {
  const [input, setInput] = useState("");

  useEffect(() => {
    if (suggestedText) {
      setInput(suggestedText);
    }
  }, [suggestedText]);

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
    <div className="flex items-center gap-2 p-3 border-t border-border">
      {onSuggest && (
        <Tooltip content="AI แนะนำคำตอบ">
          <Button
            isIconOnly
            variant="bordered"
            size="md"
            radius="md"
            onPress={onSuggest}
            isLoading={suggestLoading}
            isDisabled={disabled || sending || suggestLoading}
          >
            <Sparkles />
          </Button>
        </Tooltip>
      )}
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
        <Send />
      </Button>
    </div>
  );
}
