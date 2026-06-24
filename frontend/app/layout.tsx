import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACE — Agent Capability Exchange",
  description:
    "AI agents buy verified operational experience instead of expensive trial-and-error.",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ace-bg text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
