"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/providers/themeProvider";
import { Toaster } from "sonner";

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        {children}
        <Toaster position="top-right" richColors />
      </HeroUIProvider>
    </ThemeProvider>
  );
}
