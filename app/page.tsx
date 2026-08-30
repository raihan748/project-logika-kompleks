"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/pos/Navbar";
import { BarcodeSearchBar } from "../components/pos/BarcodeSearchBar";
import { ProductGrid } from "../components/pos/ProductGrid";
import { CartDrawer } from "../components/pos/CartDrawer";
import { CameraScannerModal } from "../components/pos/CameraScannerModal";
import { ManualItemModal } from "../components/pos/ManualItemModal";
import { PaymentModal } from "../components/pos/PaymentModal";
import { ReceiptModal } from "../components/pos/ReceiptModal";
import { CashflowModal } from "../components/pos/CashflowModal";
import { InstallPwaBanner, usePwaInstall } from "../components/pos/InstallPwaBanner";
import { usePOS } from "../lib/store/pos-context";

export default function CashierPage() {
  const { lastTransaction, setLastTransaction, cart, grandTotal, processCheckout } = usePOS();
  const { isInstallable, triggerInstall } = usePwaInstall();

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualItemOpen, setIsManualItemOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCashflowOpen, setIsCashflowOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // When last transaction occurs, open receipt modal
  useEffect(() => {
    if (lastTransaction) {
      setIsReceiptOpen(true);
    }
  }, [lastTransaction]);

  // Global POS Keyboard Shortcuts (F1: Camera, F9: Uang Pas, F12: Bayar, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setIsCameraOpen(true);
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0) {
          processCheckout("TUNAI", grandTotal);
        }
      }
      if (e.key === "F12") {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        }
      }
      if (e.key === "Escape") {
        setIsCameraOpen(false);
        setIsManualItemOpen(false);
        setIsPaymentOpen(false);
        setIsCashflowOpen(false);
        setIsReceiptOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, grandTotal, processCheckout]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenCashflowModal={() => setIsCashflowOpen(true)}
        onTriggerInstallPwa={triggerInstall}
        canInstallPwa={isInstallable}
      />

      {/* Main Cashier POS Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Column: Barcode Search & Rich Product Grid (7 cols) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <BarcodeSearchBar
            onOpenCameraScanner={() => setIsCameraOpen(true)}
            onOpenManualItemModal={() => setIsManualItemOpen(true)}
          />

          <div className="flex-1">
            <ProductGrid />
          </div>
        </section>

        {/* Right Column: Glassmorphism Cart Drawer (5 cols) */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col sticky top-24 h-fit">
          <CartDrawer onOpenPaymentModal={() => setIsPaymentOpen(true)} />
        </section>
      </main>

      {/* Floating PWA Install Prompt for Mobile */}
      <InstallPwaBanner />

      {/* Modals */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      />

      <ManualItemModal
        isOpen={isManualItemOpen}
        onClose={() => setIsManualItemOpen(false)}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />

      <ReceiptModal
        transaction={lastTransaction}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setLastTransaction(null);
        }}
      />

      <CashflowModal
        isOpen={isCashflowOpen}
        onClose={() => setIsCashflowOpen(false)}
      />
    </div>
  );
}
