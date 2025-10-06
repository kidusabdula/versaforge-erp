// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import LayoutComponent from "@/components/Layout";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"],  variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Ma Ma Beignet Dashboard",
  description: "Custom dashboard for Ma Ma Beignet by Versalabs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="m-0 p-0 bg-[#0f0f0f] overflow-auto min-h-screen">
        <div
          className="origin-top-left"
          // style={{
          //   transform: "scale(0.9)",
          //   width: "111.1111vw", // Compensates for 90% scale width
          //   transformOrigin: "0 0",
          // }}
        >
          <ToastProvider>
            <LayoutComponent>{children}</LayoutComponent>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}