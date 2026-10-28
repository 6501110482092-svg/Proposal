import React, { useState } from 'react';
import { ClinicProfile, ProposalDocument } from '../types';
import {
  History,
  Search,
  Copy,
  Edit3,
  Trash2,
  X,
  Plus,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ProposalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: ProposalDocument[];
  clinics: ClinicProfile[];
  activeProposalId: string;
  onSelectProposal: (id: string) => void;
  onCloneProposal: (proposal: ProposalDocument) => void;
  onDeleteProposal: (id: string) => void;
  onUpdateStatus: (id: string, status: 'draft' | 'sent' | 'approved' | 'completed') => void;
  onCreateNew: () => void;
}

export const ProposalHistoryModal: React.FC<ProposalHistoryModalProps> = ({
  isOpen,
  onClose,
  proposals,
  clinics,
  activeProposalId,
  onSelectProposal,
  onCloneProposal,
  onDeleteProposal,
  onUpdateStatus,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clinicFilter, setClinicFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [confirmDeleteProposalId, setConfirmDeleteProposalId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Extract years from dateText or createdAt
  const years = Array.from(
    new Set(
      proposals.map(p => {
        const match = p.dateText?.match(/25\d{2}|20\d{2}/);
        return match ? match[0] : '';
      })
    )
  ).filter(Boolean);

  // Helper to extract clean client company name from attention string
  const getCleanClientName = (attention: string): string => {
    return attention
      .replace(/ท่านผู้บริหาร|บริษัท|จำกัด|\*\*|เรียน/g, '')
      .trim();
  };

  // Helper to calculate total value of a proposal
  const getProposalGrandTotal = (p: ProposalDocument): number => {
    return p.programs.reduce((total, prog) => {
      const progTotal =
        prog.totalPriceOverride !== undefined
          ? prog.totalPriceOverride
          : prog.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
      return total + progTotal;
    }, 0);
  };

  // Filter proposals
  const filtered = proposals.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      (p.title || '').toLowerCase().includes(searchLower) ||
      (p.attention || '').toLowerCase().includes(searchLower) ||
      (p.documentNo || '').toLowerCase().includes(searchLower) ||
      (p.dateText || '').toLowerCase().includes(searchLower);

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchClinic = clinicFilter === 'all' || p.clinicProfileId === clinicFilter;
    const matchYear =
      yearFilter === 'all' || (p.dateText && p.dateText.includes(yearFilter));

    return matchSearch && matchStatus && matchClinic && matchYear;
  });

  const totalQuotedValue = proposals.reduce(
    (sum, p) => sum + getProposalGrandTotal(p),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ประวัติการเสนอขายทั้งหมด (Quotation Archive)</h2>
              <p className="text-xs text-slate-300">
                รวมประวัติใบเสนอราคาทุกบริษัท สามารถทำสำเนาเพื่อเสนอราคาปีใหม่ หรือปรับราคาใหม่ได้โดยที่ข้อมูลเดิมไม่สูญหาย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">จำนวนใบเสนอราคา</span>
            <span className="text-lg font-bold text-slate-900">{proposals.length} ใบ</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">สถานะส่งแล้ว / อนุมัติ</span>
            <span className="text-lg font-bold text-emerald-700">
              {proposals.filter(p => p.status === 'sent' || p.status === 'approved').length} ใบ
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">มูลค่าเสนอราคารวมทั้งหมด</span>
            <span className="text-lg font-bold text-sky-800">
              {totalQuotedValue.toLocaleString()} บาท
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-center">
            <button
              onClick={() => {
                onCreateNew();
                onClose();
              }}
              className="w-full h-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 text-xs shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> สร้างใบใหม่
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อบริษัทลูกค้า, เลขที่เอกสาร, หรือเรื่อง..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Year Filter */}
            {years.length > 0 && (
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-white outline-hidden font-medium"
              >
                <option value="all">ทุกปี พ.ศ.</option>
                {years.map(y => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-white outline-hidden font-medium"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="draft">ร่าง (Draft)</option>
              <option value="sent">เสนอแล้ว (Sent)</option>
              <option value="approved">อนุมัติแล้ว (Approved)</option>
            </select>

            {/* Clinic Filter */}
            <select
              value={clinicFilter}
              onChange={e => setClinicFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-white outline-hidden font-medium max-w-[150px] truncate"
            >
              <option value="all">ทุกคลินิกผู้เสนอ</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>
                  {c.shortName || c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Proposals List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่พบใบเสนอราคาตามคำค้นหา</p>
            </div>
          ) : (
            filtered.map(p => {
              const isActive = p.id === activeProposalId;
              const grandTotal = getProposalGrandTotal(p);
              const clinic = clinics.find(c => c.id === p.clinicProfileId) || clinics[0];
              const totalPax = p.programs[0]?.defaultHeadcount || 0;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-sky-50/70 border-sky-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Left details */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {p.documentNo}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {p.dateText}
                      </span>
                      <span className="text-xs text-sky-800 bg-sky-100/60 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {clinic?.shortName || clinic?.name}
                      </span>
                      {isActive && (
                        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          กำลังเปิดแก้ไขอยู่
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {p.title}
                    </h3>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        <strong>ผู้รับ:</strong> {p.attention.replace(/\*\*/g, '')}
                      </span>
                      <span>
                        <strong>จำนวนคน:</strong> {totalPax > 0 ? `${totalPax} คน` : '-'}
                      </span>
                      <span>
                        <strong>ตารางตรวจ:</strong> {p.programs.length} ตาราง
                      </span>
                    </div>
                  </div>

                  {/* Middle / Right: Total amount & Actions */}
                  <div className="flex flex-col md:items-end justify-between gap-2.5">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-500 block">มูลค่าเสนอราคารวม</span>
                      <span className="text-lg font-bold text-emerald-700">
                        {grandTotal.toLocaleString()} ฿
                      </span>
                    </div>

                    {/* Status dropdown & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={p.status}
                        onChange={e =>
                          onUpdateStatus(p.id, e.target.value as any)
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-hidden ${
                          p.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : p.status === 'sent'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="draft">ร่าง (Draft)</option>
                        <option value="sent">เสนอราคาแล้ว (Sent)</option>
                        <option value="approved">ลูกค้ายืนยันแล้ว (Approved)</option>
                      </select>

                      {/* Open / Edit */}
                      <button
                        onClick={() => {
                          onSelectProposal(p.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> เปิดดู/แก้ไข
                      </button>

                      {/* Clone / Renew */}
                      <button
                        onClick={() => {
                          onCloneProposal(p);
                        }}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                        title="ทำสำเนาใบนี้เพื่อเสนอปีใหม่ หรือเสนอบริษัทอื่น"
                      >
                        <Copy className="w-3.5 h-3.5" /> ทำสำเนา/ปีใหม่
                      </button>

                      {/* Delete with inline confirmation */}
                      {proposals.length > 1 && (
                        confirmDeleteProposalId === p.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-lg px-2 py-1 text-xs">
                            <span className="text-red-700 font-bold text-[11px]">ลบใบนี้?</span>
                            <button
                              onClick={() => {
                                onDeleteProposal(p.id);
                                setConfirmDeleteProposalId(null);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                            >
                              ใช่ ลบ
                            </button>
                            <button
                              onClick={() => setConfirmDeleteProposalId(null)}
                              className="text-slate-600 hover:text-slate-900 px-1 text-[10px]"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteProposalId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="ลบใบเสนอราคานี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            แสดงทั้งหมด <strong>{filtered.length}</strong> จาก {proposals.length} รายการ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
