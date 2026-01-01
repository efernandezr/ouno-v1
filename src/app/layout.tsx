import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Ouno",
    template: "%s | Ouno",
  },
  description:
    "Your Authentic Intelligence. Turn talk into content. Speak your mind and transform it into polished articles that sound like you.",
  keywords: [
    "Ouno",
    "Ouno Core",
    "Voice to content",
    "AI writing",
    "Authentic content",
    "Voice capture",
    "Content creation",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Ouno",
    title: "Ouno - Your Authentic Intelligence",
    description:
      "Speak your mind. We'll handle the words. Transform your voice into polished content.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ouno - Your Authentic Intelligence",
    description:
      "Speak your mind. We'll handle the words. Transform your voice into polished content.",
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
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          <main id="main-content" className="min-h-[calc(100vh-8rem)]">
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
