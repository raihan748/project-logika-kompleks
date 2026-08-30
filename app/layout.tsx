import type { Metadata, Viewport } from "next";
import "./globals.css";
import { POSProvider } from "../lib/store/pos-context";

export const metadata: Metadata = {
  title: "WarungPro POS - Aplikasi Kasir UMKM Pintar",
  description: "Sistem Kasir & Pembukuan Usaha UMKM Modern dengan Barcode Scanner, QRIS, Kasbon, dan Struk WhatsApp.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
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
