import type { Metadata, Viewport } from "next";
import "./globals.css";
import { POSProvider } from "../lib/store/pos-context";

export const metadata: Metadata = {
  title: "WarungPro POS - Global Edition | Smart Cloud Point of Sale",
  description: "Aplikasi Kasir & Pembukuan Usaha Modern Berstandar Internasional dengan Multi-Mata Uang, Barcode Scanner, QRIS, Kasbon, dan Struk WhatsApp.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "WarungPro POS - Global Edition",
    description: "Smart Cloud Point of Sale & Retail Inventory Management",
    images: [{ url: "/logo.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        <POSProvider>{children}</POSProvider>
      </body>
    </html>
  );
}
