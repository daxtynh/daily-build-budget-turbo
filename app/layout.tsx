import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BudgetTurbo - TurboTax for Your Budget",
  description: "Build a personalized budget in minutes. Upload your bank statement, answer a few questions, get a custom spending plan.",
  keywords: ["budget", "budgeting", "personal finance", "money management", "expense tracker"],
  openGraph: {
    title: "BudgetTurbo - TurboTax for Your Budget",
    description: "Build a personalized budget in minutes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
