"use client";

import { useRef, useCallback } from "react";

export default function PinInput({ value = "", onChange, onComplete, length = 6, disabled = false, error = false }) {
  const inputRefs = useRef([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = useCallback(
    (index, e) => {
      const val = e.target.value.replace(/\D/g, "");
      if (!val) return;

      const newDigits = [...digits];
      newDigits[index] = val.slice(-1);
      const newPin = newDigits.join("");
      onChange(newPin);

      // Auto-focus next or auto-submit
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (newPin.length === length && onComplete) {
        onComplete(newPin);
      }
    },
    [digits, length, onChange]
  );

  const handleKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Enter" && value.length === length && onComplete) {
        e.preventDefault();
        onComplete(value);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        const newDigits = [...digits];
        if (newDigits[index]) {
          newDigits[index] = "";
          onChange(newDigits.join(""));
        } else if (index > 0) {
          newDigits[index - 1] = "";
          onChange(newDigits.join(""));
          inputRefs.current[index - 1]?.focus();
        }
      }
    },
    [digits, onChange]
  );

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted) {
        onChange(pasted);
        const focusIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
      }
    },
    [length, onChange]
  );

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 outline-none transition-colors
            ${error ? "border-danger bg-danger-50" : "border-default-300 focus:border-primary"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      ))}
    </div>
  );
}
