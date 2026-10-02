import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SiteHeader from "../components/SiteHeader";
import ScrollToTopBottom from "@/components/ScrollToTopBottom";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haske International Tutors | WAEC & JAMB Past Questions",
  description: "Free WAEC and JAMB past questions with answers, organized by subject, year and topic. Practice for your exams with Haske International Tutors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
            <body className="min-h-full flex flex-col">
        <SiteHeader />
        <Providers>{children}</Providers>
        <ScrollToTopBottom />
      </body>
    </html>
  );
}