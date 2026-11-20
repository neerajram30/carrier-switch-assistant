import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./layers.css";
import "./globals.css";
import "@astryxdesign/charts/charts.css";
import { ThemeProvider } from "./theme-provider";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Career Switch Assistant",
  description: "Turn your career goal into an actionable roadmap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
