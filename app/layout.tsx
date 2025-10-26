import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/providers/react-query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameHub",
  description: "A place to connect and play with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
