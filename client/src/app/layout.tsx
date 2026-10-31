import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Networkinng • Community Commerce, 28-Day Capital Recovery & Student Academy",
  description:
    "West Africa & Global Multi-Currency Community Networking, 28-Day Broken Installment Capital Return, Offline Sales Verification, LMS Academy & Promoter Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
