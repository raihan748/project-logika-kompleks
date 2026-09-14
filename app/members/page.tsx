"use client";

import React, { useState, useMemo } from "react";
import { Navbar } from "../../components/pos/Navbar";
import { usePOS } from "../../lib/store/pos-context";
import {
  Users,
  Search,
  Plus,
  Crown,
  Sparkles,
  QrCode,
  Edit2,
  Trash2,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Percent,
  Gift,
  Coins,
  History,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import { CustomerMember, MemberTier, MembershipType } from "../../lib/types/pos";
import { formatCurrency, exportToCSV } from "../../lib/engine/currency-formatter";

export default function MembersPage() {
  const {
    members,
    addMember,
    updateMember,
    deleteMember,
    adjustMemberPoints,
    settings,
    currency,
    language,
    t,
  } = usePOS();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CustomerMember | null>(null);

  const [isAdjustPointsOpen, setIsAdjustPointsOpen] = useState(false);
  const [targetMemberForPoints, setTargetMemberForPoints] = useState<CustomerMember | null>(null);
  const [pointDeltaInput, setPointDeltaInput] = useState("");
  const [pointAdjustType, setPointAdjustType] = useState<"ADD" | "DEDUCT">("ADD");
  const [pointAdjustReason, setPointAdjustReason] = useState("");

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardMember, setCardMember] = useState<CustomerMember | null>(null);

  // Form inputs for Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    memberCode: "",
    phone: "",
    email: "",
    tier: "REGULAR" as MemberTier,
    membershipType: "HYBRID" as MembershipType,
    discountPercent: 0,
    notes: "",
  });

  const fmt = (num: number) => formatCurrency(num, currency);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q));

      const matchesTier =
        selectedTierFilter === "ALL" || m.tier === selectedTierFilter;

      const matchesType =
        selectedTypeFilter === "ALL" || m.membershipType === selectedTypeFilter;

      return matchesSearch && matchesTier && matchesType;
    });
  }, [members, searchTerm, selectedTierFilter, selectedTypeFilter]);

  // Aggregate KPI metrics
  const totalMembers = members.length;
  const totalPointsInCirculation = members.reduce((sum, m) => sum + m.points, 0);
  const totalPointsValue = totalPointsInCirculation * (settings.memberPointRedeemValue || 100);
  const totalMemberSpending = members.reduce((sum, m) => sum + m.totalSpent, 0);
  const goldAndPlatinumCount = members.filter(
    (m) => m.tier === "GOLD" || m.tier === "PLATINUM"
  ).length;

  // Tier styling helper
  const getTierBadgeStyle = (tier: MemberTier) => {
    switch (tier) {
      case "PLATINUM":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "GOLD":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "SILVER":
        return "bg-slate-200 text-slate-800 border-slate-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      memberCode: `MBR-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: "",
      email: "",
      tier: "REGULAR",
      membershipType: "HYBRID",
      discountPercent: 0,
      notes: "",
    });
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (m: CustomerMember) => {
    setEditingMember(m);
    setFormData({
      name: m.name,
      memberCode: m.memberCode,
      phone: m.phone,
      email: m.email || "",
      tier: m.tier,
      membershipType: m.membershipType,
      discountPercent: m.discountPercent,
      notes: m.notes || "",
    });
    setIsAddEditOpen(true);
  };

  // Save Add/Edit Member
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingMember) {
      updateMember(editingMember.id, {
        name: formData.name.trim(),
        memberCode: formData.memberCode.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        tier: formData.tier,
        membershipType: formData.membershipType,
        discountPercent: Number(formData.discountPercent) || 0,
        notes: formData.notes.trim() || undefined,
      });
    } else {
      addMember({
        name: formData.name.trim(),
        memberCode: formData.memberCode.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        tier: formData.tier,
        membershipType: formData.membershipType,
        points: 0,
        totalSpent: 0,
        totalVisits: 0,
        discountPercent: Number(formData.discountPercent) || 0,
        createdAt: new Date().toISOString(),
        notes: formData.notes.trim() || undefined,
      });
    }

    setIsAddEditOpen(false);
  };

  // Open Points Adjustment Modal
  const handleOpenAdjustPoints = (m: CustomerMember) => {
    setTargetMemberForPoints(m);
    setPointDeltaInput("");
    setPointAdjustType("ADD");
    setPointAdjustReason("");
    setIsAdjustPointsOpen(true);
  };

  // Submit Point Adjustment
  const handleSaveAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemberForPoints) return;
    const amount = parseInt(pointDeltaInput) || 0;
    if (amount <= 0) return;

    const delta = pointAdjustType === "ADD" ? amount : -amount;
    adjustMemberPoints(targetMemberForPoints.id, delta, pointAdjustReason || undefined);
    setIsAdjustPointsOpen(false);
  };

  // Open Barcode Card Modal
  const handleOpenCardModal = (m: CustomerMember) => {
    setCardMember(m);
    setIsCardModalOpen(true);
  };

  // Export Member List to CSV
  const handleExportCSV = () => {
    const rows = members.map((m) => ({
      ID: m.id,
      Kode_Member: m.memberCode,
      Nama: m.name,
      No_Telepon: m.phone,
      Email: m.email || "-",
      Tier: m.tier,
      Tipe_Membership: m.membershipType,
      Saldo_Poin: m.points,
      Estimasi_Nilai_Poin: m.points * (settings.memberPointRedeemValue || 100),
      Total_Akumulasi_Belanja: m.totalSpent,
      Frekuensi_Kunjungan: m.totalVisits,
      Diskon_Persen: `${m.discountPercent}%`,
      Terdaftar_Sejak: m.createdAt,
      Catatan: m.notes || "-",
    }));
    exportToCSV(`WarungPro_Members_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Banner Header */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-slate-900">
                {language === "en" ? "Customer Membership & Loyalty Rewards" : "Program Membership & Loyalitas Pelanggan"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {language === "en"
                  ? "Manage reward points, tiered discounts (Silver, Gold, Platinum), barcode cards, and member spending analytics"
                  : "Kelola member poin, diskon bertingkat (Silver, Gold, Platinum), kartu barcode virtual, dan riwayat belanja"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-sm shadow-brand-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Tambah Member</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Total Member Terdaftar</span>
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {totalMembers}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {goldAndPlatinumCount} Member VIP (Gold/Platinum)
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Total Poin Beredar</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-600">
              {totalPointsInCirculation} <span className="text-sm font-bold text-slate-500">Poin</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium font-mono">
              Nilai Tukar: ~{fmt(totalPointsValue)}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Akumulasi Belanja Member</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600">
              {fmt(totalMemberSpending)}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Dari seluruh transaksi kasir terdata
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Rasio Nilai Tukar Poin</span>
              <Gift className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-base font-bold text-slate-800 font-mono">
              1 Poin = {fmt(settings.memberPointRedeemValue || 100)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Dapat 1 Poin per belanja {fmt(settings.memberPointsEarnRate || 1000)}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama member, nomor HP, atau kode barcode MBR-..."
              className="w-full bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 outline-none transition"
            />
          </div>

          {/* Tier & Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer"
            >
              <option value="ALL">Semua Tier</option>
              <option value="REGULAR">Tier Regular</option>
              <option value="SILVER">Tier Silver</option>
              <option value="GOLD">Tier Gold</option>
              <option value="PLATINUM">Tier Platinum</option>
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer"
            >
              <option value="ALL">Semua Tipe Program</option>
              <option value="POINT">Poin Reward</option>
              <option value="POTONGAN">Potongan Diskon</option>
              <option value="HYBRID">Hybrid (Poin + Diskon)</option>
            </select>
          </div>
        </div>

        {/* Member Table */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200/80 text-slate-600 font-bold">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-3">Tier</th>
                  <th className="py-3 px-3">Tipe Program</th>
                  <th className="py-3 px-3">Saldo Poin</th>
                  <th className="py-3 px-3">Diskon</th>
                  <th className="py-3 px-3">Total Belanja</th>
                  <th className="py-3 px-3 text-center">Kunjungan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 stroke-[1.5] mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada member yang cocok</p>
                      <p className="text-[11px]">Silakan ubah kata kunci pencarian atau tambah member baru.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                            {m.memberCode}
                          </span>
                          <span>•</span>
                          <span>{m.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${getTierBadgeStyle(
                            m.tier
                          )}`}
                        >
                          {m.tier}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">
                          {m.membershipType === "HYBRID"
                            ? "Hybrid (Poin+Diskon)"
                            : m.membershipType === "POTONGAN"
                            ? "Potongan Diskon"
                            : "Poin Reward"}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-extrabold text-amber-600 text-sm">
                          {m.points} Poin
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ~{fmt(m.points * (settings.memberPointRedeemValue || 100))}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {m.discountPercent > 0 ? (
                          <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            {m.discountPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0%</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {fmt(m.totalSpent)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {m.totalVisits}x
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Virtual Barcode Card */}
                          <button
                            onClick={() => handleOpenCardModal(m)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="Buka Kartu Barcode Virtual"
                          >
                            <QrCode className="w-4 h-4 text-brand-600" />
                          </button>

                          {/* Adjust Points */}
                          <button
                            onClick={() => handleOpenAdjustPoints(m)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"
                            title="Atur Saldo Poin"
                          >
                            <Coins className="w-4 h-4" />
                          </button>

                          {/* Edit Member */}
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="Edit Data Member"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Member */}
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus member ${m.name}?`)) {
                                deleteMember(m.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: ADD / EDIT MEMBER */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingMember ? "Edit Member" : "Tambah Member Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. HP (WhatsApp) *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08123456789"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Barcode / ID *</label>
                  <input
                    type="text"
                    value={formData.memberCode}
                    onChange={(e) => setFormData({ ...formData, memberCode: e.target.value })}
                    placeholder="MBR-1001"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="member@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tier Membership</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as MemberTier })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none"
                  >
                    <option value="REGULAR">Regular (0%)</option>
                    <option value="SILVER">Silver (5%)</option>
                    <option value="GOLD">Gold (10%)</option>
                    <option value="PLATINUM">Platinum (15%)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Benefit</label>
                  <select
                    value={formData.membershipType}
                    onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as MembershipType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none"
                  >
                    <option value="HYBRID">Hybrid (Poin + Diskon)</option>
                    <option value="POINT">Poin Reward</option>
                    <option value="POTONGAN">Potongan Diskon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Diskon Khusus Member (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan preferensi belanja..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition shadow-sm shadow-brand-600/30"
                >
                  Simpan Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST POINTS */}
      {isAdjustPointsOpen && targetMemberForPoints && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">Atur Saldo Poin</h3>
              </div>
              <button
                onClick={() => setIsAdjustPointsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs">
              <p className="font-bold text-amber-900">{targetMemberForPoints.name}</p>
              <p className="text-amber-700 font-mono">
                Saldo Saat Ini: <strong>{targetMemberForPoints.points} Poin</strong>
              </p>
            </div>

            <form onSubmit={handleSaveAdjustPoints} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPointAdjustType("ADD")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    pointAdjustType === "ADD"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  + Tambah Poin
                </button>
                <button
                  type="button"
                  onClick={() => setPointAdjustType("DEDUCT")}
                  className={`py-2 rounded-xl font-bold border transition ${
                    pointAdjustType === "DEDUCT"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  - Kurangi Poin
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jumlah Poin</label>
                <input
                  type="number"
                  min="1"
                  value={pointDeltaInput}
                  onChange={(e) => setPointDeltaInput(e.target.value)}
                  placeholder="Contoh: 50"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  value={pointAdjustReason}
                  onChange={(e) => setPointAdjustReason(e.target.value)}
                  placeholder="Contoh: Bonus ulang tahun, kompensasi layanan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustPointsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIRTUAL BARCODE / QR MEMBER CARD */}
      {isCardModalOpen && cardMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95">
            {/* The Digital Membership Card */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 shadow-2xl border border-white/20 overflow-hidden space-y-5">
              {/* Decorative Glow Elements */}
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide uppercase text-slate-200">
                    {settings.storeName}
                  </h4>
                  <p className="text-[10px] text-amber-400 font-semibold tracking-wider">
                    OFFICIAL MEMBER PASS
                  </p>
                </div>
                <div
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getTierBadgeStyle(
                    cardMember.tier
                  )}`}
                >
                  {cardMember.tier}
                </div>
              </div>

              {/* Member Name & Details */}
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">{cardMember.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{cardMember.phone}</p>
              </div>

              {/* Barcode Graphic Representation */}
              <div className="bg-white p-3.5 rounded-2xl text-center space-y-1.5 shadow-inner">
                {/* SVG Barcode Stripes */}
                <div className="h-14 flex items-center justify-center gap-[3px] overflow-hidden px-2">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full bg-slate-900 ${
                        (i % 5 === 0 || i % 7 === 0) ? "w-[3px]" : (i % 2 === 0) ? "w-[1.5px]" : "w-[2.5px]"
                      }`}
                    />
                  ))}
                </div>
                <div className="font-mono font-black text-slate-900 text-sm tracking-widest">
                  {cardMember.memberCode}
                </div>
              </div>

              {/* Member Stats Footer */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 block">Saldo Poin</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    {cardMember.points} Poin
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Diskon Member</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {cardMember.discountPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-2.5 rounded-xl shadow-xs transition"
              >
                Cetak / Download Kartu
              </button>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
