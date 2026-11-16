import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VerifiedRoomie | Find a verified housemate in Nigeria",
    template: "%s | VerifiedRoomie",
  },
  description:
    "VerifiedRoomie helps students, corps members, working professionals and other adults across all 36 Nigerian states and the FCT find compatible, verified housemates.",
};

export const viewport: Viewport = {
  themeColor: "#1f6bf0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}