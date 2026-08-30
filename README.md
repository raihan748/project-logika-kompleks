# 🏪 WarungPro POS - Aplikasi Kasir & Pembukuan UMKM Modern

**WarungPro POS** adalah aplikasi kasir (Point of Sale) dan pembukuan usaha retail berbasis web full-stack modern (Next.js 15, TypeScript, Tailwind CSS) yang dirancang khusus untuk memenuhi kebutuhan nyata pelaku usaha mikro, kecil, dan menengah (UMKM), seperti toko kelontong, warung sembako, kedai F&B, dan retail.

Mengusung antarmuka **Minimalis Glassmorphism** yang elegan, ramah layar sentuh HP/Tablet maupun Desktop komputer, serta mendukung instalasi mandiri (**PWA Install**).

---

## 🌟 Fitur Utama & Logika Sistem

1. **Pemindai Barcode Kamera & Hardware (Dual-Scanner Engine):**
   - Mendukung pemindaian barcode nyata via kamera HP/Webcam laptop secara realtime.
   - Kompatibel dengan barcode scanner tembak (USB / Bluetooth HID).
   - Instant SKU local indexing lookup (< 10ms).
   - Fitur **+ Item Bebas** untuk memasukkan menu atau barang manual dadakan tanpa barcode.

2. **Katalog 40+ Produk UMKM Nyata:**
   - Foto produk beresolusi tinggi (HD).
   - Kategori lengkap: *Sembako & Beras, Minuman Dingin, Snack & Makanan Ringan, Menu Warung/Siap Saji, Bumbu Dapur & Mie, serta Perawatan Diri*.
   - Manajemen harga jual, harga modal (HPP), dan peringatan stok minimum.

3. **Multi-Payment Khusus UMKM & Buku Kasbon:**
   - **Tunai / Cash:** Tombol pecahan uang cepat (*Uang Pas, 10k, 20k, 50k, 100k*) dan kalkulasi uang kembalian instan.
   - **QRIS Digital:** Mockup QRIS standar nasional untuk e-wallet & mobile banking.
   - **Transfer Bank:** Rekening bank toko.
   - **Buku Kasbon / Piutang Pelanggan:** Pencatatan hutang pelanggan dengan pelacakan jatuh tempo, riwayat cicilan, dan pengingat tagihan via WhatsApp.

4. **Manajemen Struk Digital & Thermal:**
   - **Kirim Struk WhatsApp:** 1-klik langsung membuka WhatsApp dengan format nota belanja rapi dan ramah pelanggan.
   - **Printer Bluetooth Thermal:** Format ESC/POS standar 58mm / 80mm siap cetak langsung.
   - **Salin Teks & Unduh File Struk (.txt).**

5. **Buku Kas Masuk & Kas Keluar (Arus Kas Warung):**
   - Mencatat pengeluaran operasional harian (beli es batu, token listrik warung, uang kebersihan, dsb.) dan modal kasir awal.

6. **Laporan Keuangan & Laba Bersih (Net Profit):**
   - Menghitung omzet kotor, modal HPP barang terjual, margin keuntungan bersih secara otomatis, dan rekapitulasi jurnal transaksi.

7. **Instalasi PWA Mobile & Offline-First:**
   - Tombol pasang aplikasi ke layar utama HP (Android/iOS) dan Desktop.
   - Berfungsi 100% saat offline berkat penyimpanan data lokal (*LocalStorage & IndexedDB*).

---

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/raihan748/project-logika-kompleks.git
   cd project-logika-kompleks
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.

4. **Build untuk Produksi:**
   ```bash
   npm run build
   npm start
   ```

---

## 🌐 Deploy ke Vercel (1-Klik)

Proyek ini telah dikonfigurasi penuh untuk Next.js 15 App Router. Cukup import repository di [Vercel Dashboard](https://vercel.com/new) dan klik **Deploy**.
