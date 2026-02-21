import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "./components/Sidebar";
import { ConnectButton } from "./components/ConnectButton";

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
  title: "DeSense - Proof-of-Sensing DePIN Network",
  description: "Sensor-network DePIN marketplace on ADI Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
      >
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                <div />
                <ConnectButton />
              </header>
              <main className="flex-1 p-8">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
