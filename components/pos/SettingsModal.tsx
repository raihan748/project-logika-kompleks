"use client";

import React, { useState } from "react";
import {
  Settings,
  Globe,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  Download,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";
import { SupportedCurrency, SupportedLanguage, CURRENCY_CONFIGS } from "../../lib/i18n/translations";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateStoreSettings, exportBackupJSON, exportProductsCSV, t } = usePOS();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [currency, setCurrency] = useState<SupportedCurrency>(settings.currency);
  const [language, setLanguage] = useState<SupportedLanguage>(settings.language);
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [taxName, setTaxName] = useState(settings.taxName);
  const [enableSound, setEnableSound] = useState(settings.enableSound);
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      storeName: storeName.trim() || "My Global Store",
      address: address.trim(),
      phone: phone.trim(),
      currency,
      language,
      taxEnabled,
      taxRate: parseFloat(taxRate) || 0,
      taxName: taxName.trim() || "VAT",
      enableSound,
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-xl w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {t("settings.title")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("settings.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* 1. Global Localization (Language & Currency) */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <Globe className="w-4 h-4 text-brand-600" />
              <span>International Localization & Currency</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t("settings.language")}:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none shadow-2xs"
                >
                  <option value="en">🇺🇸 English (Global Standard)</option>
                  <option value="id">🇮🇩 Bahasa Indonesia</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t("settings.currency")}:
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                  className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none shadow-2xs"
                >
                  {Object.values(CURRENCY_CONFIGS).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Business Profile */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="font-bold text-slate-900 text-xs sm:text-sm">
              {t("settings.storeName")} & Profile
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">{t("settings.storeName")}:</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">{t("settings.address")}:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">{t("settings.phone")}:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Tax / VAT / GST Engine */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <Percent className="w-4 h-4 text-brand-600" />
                <span>{t("settings.enableTax")}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {taxEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">{t("settings.taxName")}:</label>
                  <input
                    type="text"
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    placeholder="VAT / GST / PPN"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">{t("settings.taxRate")}:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="10"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Thermal Receipt & Sound Notes */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">Audio & Receipt Notes</span>
              <button
                type="button"
                onClick={() => setEnableSound(!enableSound)}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                  enableSound
                    ? "bg-brand-50 text-brand-700 border-brand-300"
                    : "bg-slate-200 text-slate-600 border-slate-300"
                }`}
              >
                {enableSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{enableSound ? "Sound ON" : "Sound Muted"}</span>
              </button>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">{t("settings.receiptHeader")}:</label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">{t("settings.receiptFooter")}:</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* 5. Enterprise Data Export */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
            <span className="font-bold text-slate-900 text-xs sm:text-sm">Enterprise Backup & Accounting</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportProductsCSV}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("settings.exportCSV")}</span>
              </button>

              <button
                type="button"
                onClick={exportBackupJSON}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-brand-600" />
                <span>{t("settings.exportData")}</span>
              </button>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              {t("pos.cancel")}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold transition active:scale-95 shadow-md shadow-brand-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("settings.saveChanges")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
