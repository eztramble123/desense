import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";

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
  title: "Zeus - Proof-of-Generation",
  description: "Verified energy generation monitoring on ADI Chain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zeus-stone-50`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 bg-zeus-stone-900 border-b border-zeus-stone-700 flex items-center px-8">
              <span className="zeus-label text-zeus-stone-400">ADI CHAIN TESTNET · READ-ONLY</span>
            </header>
            <main className="flex-1 p-8 bg-zeus-stone-50">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
