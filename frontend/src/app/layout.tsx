import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { XMPPProvider } from "./context/XMPPContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat XMPP",
  description: "Chat XMPP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <XMPPProvider>
          {children}
        </XMPPProvider>
      </body>
    </html>
  );
}
