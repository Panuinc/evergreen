import { JetBrains_Mono, Bai_Jamjuree } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/contexts/AuthContext";
import { RBACProvider } from "@/contexts/RBACContext";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["latin", "thai"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "EverGreen Internal",
  description: "Company operations management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo/logo-01.png" />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${baiJamjuree.variable} antialiased`}
        style={{ fontFamily: "var(--font-jetbrains-mono), var(--font-bai-jamjuree)" }}
      >
        <Providers>
          <AuthProvider>
            <RBACProvider>
              <div className="flex items-center justify-center w-full h-screen text-xs transition-colors duration-300">
                {children}
              </div>
            </RBACProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
