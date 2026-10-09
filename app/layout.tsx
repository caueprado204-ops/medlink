import type { Metadata, Viewport } from "next";
import "@fontsource-variable/hanken-grotesk";
import "./globals.css";
import { ToastProvider } from "@/components/ui/overlay";

export const metadata: Metadata = {
  title: { default: "MedLink", template: "%s · MedLink" },
  description: "Gestão de escalas e equipes para instituições de saúde.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#16324F", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
