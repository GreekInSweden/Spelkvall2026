import type { Metadata, Viewport } from "next";
import { PlayerProvider } from "@/context/PlayerContext";
import { GroupProvider } from "@/context/GroupContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spelkväll",
  description: "Minispel och topplistor för familj och vänner",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0B0D"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <PlayerProvider>
          <GroupProvider>
            <AppShell>{children}</AppShell>
          </GroupProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
