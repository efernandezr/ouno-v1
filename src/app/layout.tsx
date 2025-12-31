import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VoiceDNA",
    template: "%s | VoiceDNA",
  },
  description:
    "Voice-first AI content creation. Capture your authentic thinking through speech and transform it into polished content that sounds like you.",
  keywords: [
    "VoiceDNA",
    "Voice to text",
    "AI writing",
    "Content creation",
    "Speech to blog",
    "Voice capture",
    "Authentic content",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VoiceDNA",
    title: "VoiceDNA - Voice-First AI Content Creation",
    description:
      "Capture your authentic thinking through speech and transform it into polished content.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceDNA - Voice-First AI Content Creation",
    description:
      "Capture your authentic thinking through speech and transform it into polished content.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
