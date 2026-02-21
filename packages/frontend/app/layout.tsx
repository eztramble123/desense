import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
<<<<<<< Updated upstream
import { Sidebar } from "./components/Sidebar";
=======
import { Providers } from "./providers";
>>>>>>> Stashed changes

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Zeus — Verifiable Energy Monitoring",
  description: "Verified energy generation monitoring on ADI Chain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#04091c] text-white antialiased`}>
<<<<<<< Updated upstream
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
=======
        <Providers>{children}</Providers>
>>>>>>> Stashed changes
      </body>
    </html>
  );
}
