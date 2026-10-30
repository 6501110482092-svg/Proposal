import React, { useState } from 'react';
import { ClinicProfile, ProposalDocument } from '../types';
import { formatThaiDateTime } from '../utils/thaiDate';
import {
  FileText,
  Plus,
  Search,
  Copy,
  Edit3,
  Eye,
  Trash2,
  Building2,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  Send,
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
  Printer,
  ShieldCheck,
  FileCheck,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface DashboardViewProps {
  proposals: ProposalDocument[];
  clinics: ClinicProfile[];
  activeProposalId: string;
  onSelectProposal: (id: string) => void;
  onOpenEditor: (proposalId: string) => void;
  onOpenPreview: (proposalId: string) => void;
  onCreateNewProposal: (clinicId?: string) => void;
  onOpenCloneModal: (proposal: ProposalDocument) => void;
  onDeleteProposal: (id: string) => void;
  onUpdateStatus: (id: string, status: 'draft' | 'sent' | 'confirmed' | 'rejected') => void;
  onOpenClinicProfiles: () => void;
  onOpenMasterCatalog: () => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
  onCreateAmendment?: (proposal: ProposalDocument) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  proposals,
  clinics,
  activeProposalId,
  onSelectProposal,
  onOpenEditor,
  onOpenPreview,
  onCreateNewProposal,
  onOpenCloneModal,
  onDeleteProposal,
  onUpdateStatus,
  onOpenClinicProfiles,
  onOpenMasterCatalog,
  onExportData,
  onImportData,
  onCreateAmendment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Company / Clinic separation: User can select a specific clinic or view all
  const [selectedClinicTab, setSelectedClinicTab] = useState<string>(() => {
    return clinics[0]?.id || 'all';
  });
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper to extract clean client company name from attention string
  const getCleanClientName = (attention: string): string => {
    return (attention || '')
      .replace(/ท่านผู้บริหาร|บริษัท|จำกัด|\*\*|เรียน/g, '')
      .trim();
  };

  // Helper to calculate grand total of a proposal
  const getProposalGrandTotal = (p: ProposalDocument): number => {
    return (p.programs || []).reduce((total, prog) => {
      const progTotal =
        prog.totalPriceOverride !== undefined
          ? prog.totalPriceOverride
          : (prog.items || []).reduce((s, it) => s + (it.totalPrice || 0), 0);
      return total + progTotal;
    }, 0);
  };

  // Extract total participants
  const getProposalTotalHeadcount = (p: ProposalDocument): number => {
    if (!p.programs || p.programs.length === 0) return 0;
    return p.programs[0]?.defaultHeadcount || 0;
  };

  // Scoped proposals for the selected company/clinic
  const scopedProposals =
    selectedClinicTab === 'all'
      ? proposals
      : proposals.filter(p => p.clinicProfileId === selectedClinicTab);

  const activeClinicInfo = clinics.find(c => c.id === selectedClinicTab);

  // Metrics calculated strictly for the current company/clinic scope
  const totalProposalsCount = scopedProposals.length;

  // New metric requested by user: มูลค่าการยืนยันใช้บริการ (Confirmed value)
  const totalConfirmedValue = scopedProposals
    .filter(p => p.status === 'confirmed' || p.status === 'approved')
    .reduce((sum, p) => sum + getProposalGrandTotal(p), 0);

  const uniqueClients = new Set(
    scopedProposals.map(p => getCleanClientName(p.attention)).filter(Boolean)
  ).size;

  const countDraft = scopedProposals.filter(p => p.status === 'draft').length;
  const countSent = scopedProposals.filter(p => p.status === 'sent').length;
  const countConfirmed = scopedProposals.filter(
    p => p.status === 'confirmed' || p.status === 'approved'
  ).length;
  const countRejected = scopedProposals.filter(p => p.status === 'rejected').length;

  // Extract years from dateText or createdAt
  const years = Array.from(
    new Set(
      scopedProposals.map(p => {
        const match = p.dateText?.match(/25\d{2}|20\d{2}/);
        return match ? match[0] : '';
      })
    )
  ).filter(Boolean);

  // Safe search & filter
  const filteredProposals = scopedProposals.filter(p => {
    const searchLower = (searchQuery || '').toLowerCase().trim();
    const matchSearch =
      searchLower === '' ||
      (p.title || '').toLowerCase().includes(searchLower) ||
      (p.attention || '').toLowerCase().includes(searchLower) ||
      (p.documentNo || '').toLowerCase().includes(searchLower) ||
      (p.dateText || '').toLowerCase().includes(searchLower);

    const matchStatus =
      statusFilter === 'all' ||
      p.status === statusFilter ||
      (statusFilter === 'confirmed' && p.status === 'approved');

    const matchYear =
      yearFilter === 'all' || (p.dateText && p.dateText.includes(yearFilter));

    return matchSearch && matchStatus && matchYear;
  });

  const activeDoc = proposals.find(p => p.id === activeProposalId) || proposals[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> ระบบเสนอขายและออกใบเสนอราคาคลินิก
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              แดชบอร์ดภาพรวมและประวัติการเสนอขาย
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeClinicInfo
                ? `กำลังดูข้อมูลของ: ${activeClinicInfo.name} (รหัสรันเอกสาร: ${activeClinicInfo.docPrefix || 'BK'}-QT-...)`
                : 'ติดตามประวัติโครงการตรวจสุขภาพเคลื่อนที่ประจำปี สรุปมูลค่าการยืนยันใช้บริการ แยกบริษัทชัดเจน'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onCreateNewProposal(selectedClinicTab !== 'all' ? selectedClinicTab : undefined)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-5 h-5" /> สร้างใบเสนอราคาใหม่ {activeClinicInfo ? `(${activeClinicInfo.shortName})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Company / Clinic Separation Tabs (User requirement: แยกบริษัทกัน ไม่แสดงรวมทุกบริษัท) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 px-1">
          <Building2 className="w-4 h-4 text-sky-600" />
          <span>เลือกบริษัท / คลินิกเพื่อดูข้อมูล:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {clinics.map(c => {
            const isSelected = selectedClinicTab === c.id;
            const cCount = proposals.filter(p => p.clinicProfileId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClinicTab(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{c.shortName || c.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {cCount} ฉบับ
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setSelectedClinicTab('all')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              selectedClinicTab === 'all'
                ? 'bg-slate-800 text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            ดูภาพรวมทุกบริษัท ({proposals.length})
          </button>
        </div>
      </div>

      {/* 3. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ใบเสนอราคาทั้งหมด
            </span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalProposalsCount}</span>
            <span className="text-xs text-slate-500 font-medium">ฉบับ</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {activeClinicInfo ? `ของ ${activeClinicInfo.shortName}` : 'บันทึกในระบบทั้งหมด'}
          </p>
        </div>

        {/* Metric 2: Changed from "มูลค่าเสนอขายรวม" to "มูลค่าการยืนยันใช้บริการ" */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              มูลค่าการยืนยันใช้บริการ
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              {totalConfirmedValue.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">บาท</span>
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> ยอดรวมจากโครงการที่ยืนยันใช้บริการ
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              บริษัทลูกค้า / สถานประกอบการ
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{uniqueClients}</span>
            <span className="text-xs text-slate-500 font-medium">แห่ง</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" /> ที่ได้รับข้อเสนอราคา
          </p>
        </div>

        {/* Metric 4: Updated with ยืนยันการใช้บริการ and ไม่รับบริการ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              สถานะความคืบหน้า
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg">
              <span className="text-slate-500">ร่าง:</span>
              <span className="font-bold text-slate-800">{countDraft}</span>
            </div>
            <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded-lg">
              <span className="text-blue-600">ส่งแล้ว:</span>
              <span className="font-bold text-blue-900">{countSent}</span>
            </div>
            <div className="flex items-center justify-between bg-emerald-50 px-2 py-1 rounded-lg">
              <span className="text-emerald-700">ยืนยันบริการ:</span>
              <span className="font-bold text-emerald-900">{countConfirmed}</span>
            </div>
            <div className="flex items-center justify-between bg-rose-50 px-2 py-1 rounded-lg">
              <span className="text-rose-600">ไม่รับบริการ:</span>
              <span className="font-bold text-rose-900">{countRejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Master Data & Backup Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shortcut 1: Clinic profiles */}
        <div
          onClick={onOpenClinicProfiles}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition">
                สมุดบริษัทคลินิก ({clinics.length} แห่ง)
              </h3>
              <p className="text-xs text-slate-500">
                จัดการหัวกระดาษ คำย่อรันเลขที่ อัปโหลดโลโก้
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition" />
        </div>

        {/* Shortcut 2: Master catalog & tiers */}
        <div
          onClick={onOpenMasterCatalog}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition">
                คลังรายการตรวจและ 4 ช่วงราคา
              </h3>
              <p className="text-xs text-slate-500">
                รายการตรวจสุขภาพ คำนวณตามจำนวนคน
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
        </div>

        {/* Shortcut 3: Backup & Restore */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">สำรองและกู้คืนข้อมูล</h3>
              <p className="text-xs text-slate-500">เก็บข้อมูลลงไฟล์ JSON ไว้ในเครื่อง</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExportData}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="ดาวน์โหลดไฟล์สำรองข้อมูล (Export JSON)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="นำเข้าไฟล์สำรองข้อมูล (Import JSON)"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* 5. Proposal History Table & Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                ประวัติรายการเสนอขาย {activeClinicInfo ? `(${activeClinicInfo.name})` : ''}
              </h2>
              <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {filteredProposals.length} จาก {scopedProposals.length} ฉบับ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ดูวันเวลาที่ทำเอกสาร เลขที่เอกสาร บริษัทลูกค้า และเลือกเปิดแก้ไขหรือทำสำเนาได้ทันที
            </p>
          </div>

          {/* Status quick tabs: draft, sent, confirmed, rejected */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({scopedProposals.length})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'draft'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ร่าง ({countDraft})
            </button>
            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'sent'
                  ? 'bg-white text-blue-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ส่งแล้ว ({countSent})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'confirmed'
                  ? 'bg-white text-emerald-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ยืนยันการใช้บริการ ({countConfirmed})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-white text-rose-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ไม่รับบริการ ({countRejected})
            </button>
          </div>
        </div>

        {/* Search & Select Filters */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, ชื่องาน, เลขที่เอกสาร, หรือวันที่..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Year Filter */}
            {years.length > 0 && (
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-hidden cursor-pointer font-medium"
              >
                <option value="all">ทุกปี</option>
                {years.map(y => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || statusFilter !== 'all' || yearFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setYearFilter('all');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-2 whitespace-nowrap cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Proposals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-44">วันเวลาที่ทำเอกสาร</th>
                <th className="py-3 px-4 w-36">เลขที่เอกสาร</th>
                <th className="py-3 px-4">บริษัทลูกค้า / ชื่องาน</th>
                <th className="py-3 px-3 w-36">หัวกระดาษคลินิก</th>
                <th className="py-3 px-3 text-center w-24">จำนวนคน</th>
                <th className="py-3 px-4 text-right w-32">มูลค่ารวม</th>
                <th className="py-3 px-3 text-center w-36">สถานะ</th>
                <th className="py-3 px-4 text-center w-48">จัดการเอกสาร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">ไม่พบประวัติใบเสนอราคาที่ค้นหา</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดสร้างใบเสนอราคาใหม่</p>
                  </td>
                </tr>
              ) : (
                filteredProposals.map(p => {
                  const grandTotal = getProposalGrandTotal(p);
                  const headcount = getProposalTotalHeadcount(p);
                  const clinic = clinics.find(c => c.id === p.clinicProfileId) || clinics[0];
                  const isCurrentActive = p.id === activeProposalId;
                  const clientName = getCleanClientName(p.attention);

                  // Normalize status value
                  const normalizedStatus =
                    p.status === 'approved'
                      ? 'confirmed'
                      : p.status === 'completed'
                      ? 'confirmed'
                      : p.status || 'draft';

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCurrentActive ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {p.dateText || '-'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatThaiDateTime(p.updatedAt || p.createdAt)}</span>
                        </div>
                      </td>

                      {/* Document No */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.documentNo || '-'}
                        </span>
                        {isCurrentActive && (
                          <span className="block mt-1 text-[10px] text-sky-700 font-semibold">
                            ● กำลังแก้ไขอยู่นี้
                          </span>
                        )}
                      </td>

                      {/* Client / Title */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm whitespace-pre-line flex items-center gap-1.5">
                          <span>{clientName ? `บริษัท ${clientName} จำกัด` : p.attention || 'ยังไม่ระบุบริษัท'}</span>
                          {p.docType === 'amendment' && (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.2 rounded-md">
                              ใบปรับปรุงสัญญา
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                          {p.title || p.subject}
                        </div>
                      </td>

                      {/* Issuing Clinic */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          <Building2 className="w-3 h-3 text-sky-600" />
                          <span className="truncate max-w-[100px]">{clinic?.shortName || clinic?.name || 'คลินิก'}</span>
                        </span>
                      </td>

                      {/* Headcount */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-xs text-slate-800">
                          {headcount > 0 ? `${headcount} คน` : '-'}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-sm text-slate-900">
                          {grandTotal.toLocaleString()} ฿
                        </div>
                        <div className="text-[10px] text-slate-400">รวมทั้งสิ้น</div>
                      </td>

                      {/* Status Dropdown: draft, sent, confirmed, rejected */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={normalizedStatus}
                          onChange={e => onUpdateStatus(p.id, e.target.value as any)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-hidden cursor-pointer transition ${
                            normalizedStatus === 'draft'
                              ? 'bg-slate-100 border-slate-300 text-slate-700'
                              : normalizedStatus === 'sent'
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : normalizedStatus === 'confirmed'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-rose-50 border-rose-300 text-rose-800'
                          }`}
                        >
                          <option value="draft">ร่างเอกสาร</option>
                          <option value="sent">ส่งลูกค้าแล้ว</option>
                          <option value="confirmed">ยืนยันการใช้บริการ</option>
                          <option value="rejected">ไม่รับบริการ</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => onOpenEditor(p.id)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            title="เปิดแก้ไขใบเสนอราคานี้"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>

                          {/* Preview A4 Button */}
                          <button
                            onClick={() => onOpenPreview(p.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            title="ดูตัวอย่างเอกสาร A4 / พิมพ์"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>พิมพ์</span>
                          </button>

                          {/* Create Contract Amendment Button */}
                          {onCreateAmendment && (
                            <button
                              onClick={() => onCreateAmendment(p)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              title="สร้างใบปรับปรุงสัญญา / ปรับรายการและราคา"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span className="hidden xl:inline">ปรับปรุงสัญญา</span>
                            </button>
                          )}

                          {/* Clone Button */}
                          <button
                            onClick={() => onOpenCloneModal(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="ทำสำเนาใบเสนอราคานี้ (สำหรับปีใหม่หรือบริษัทอื่น)"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete with inline confirmation */}
                          {proposals.length > 1 && (
                            confirmDeleteId === p.id ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-lg px-1.5 py-0.5">
                                <span className="text-[10px] text-red-700 font-bold">ลบ?</span>
                                <button
                                  onClick={() => {
                                    onDeleteProposal(p.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-1.5 py-0.5 rounded cursor-pointer"
                                >
                                  ใช่
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-slate-600 hover:text-slate-900 text-[10px] px-1 cursor-pointer"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="ลบใบเสนอราคานี้"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
