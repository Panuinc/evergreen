"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>{children}</HeroUIProvider>
    </ThemeProvider>
  );
}
