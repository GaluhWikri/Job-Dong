import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { BackgroundJobsProvider } from "@/context/background-jobs-context";

// Amsi Pro berbayar (Stawix) — tidak bisa dibundel. Plus Jakarta Sans adalah
// grotesque geometris gratis yang paling dekat bentuknya.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobDong | Job Search & AI CV",
  description: "Cari lowongan dari Glints, JobStreet, dan LinkedIn, nilai kecocokan CV dengan AI, dan pantau lamaran dalam satu dashboard.",
  manifest: "/favicon/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <BackgroundJobsProvider>
          {/* App shell: tinggi dikunci ke viewport, konten scroll di dalam main
              supaya halaman kanban bisa mengisi sisa layar tanpa scroll halaman. */}
          <div className="flex h-dvh overflow-hidden flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 min-w-0 flex flex-col overflow-y-auto scroll-thin">{children}</main>
          </div>
        </BackgroundJobsProvider>
      </body>
    </html>
  );
}
