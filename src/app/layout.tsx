import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { BackgroundJobsProvider } from "@/context/background-jobs-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job dooong | Pencarian Lowongan Kerja",
  description: "Platform cerdas untuk mencari lowongan dari Glints, JobStreet, dan LinkedIn dengan fitur AI CV Generator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <BackgroundJobsProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </BackgroundJobsProvider>
      </body>
    </html>
  );
}
