import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import BottomNav from "@/components/common/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HubPro | Discover the Best Deals",
  description: "Compare thousands of products from top marketplaces. Track prices, check stock availability, and save more on every purchase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-body-md overflow-x-hidden">
        <AppProviders>
          <Suspense fallback={<div className="h-16 bg-surface-container-lowest" />}>
            <Header />
          </Suspense>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
