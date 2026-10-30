import React, { useState } from 'react';
import { ProposalDocument, ClinicProfile } from '../types';
import {
  FileText,
  Search,
  Edit3,
  Eye,
  Plus,
  Building2,
  Calendar,
  X,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatThaiDateTime } from '../utils/thaiDate';

interface DocumentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: ProposalDocument[];
  clinics: ClinicProfile[];
  activeProposalId: string;
  onSelectAndEdit: (id: string) => void;
  onSelectAndPreview: (id: string) => void;
  onCreateNew: () => void;
  onCreateAmendment?: (proposal: ProposalDocument) => void;
}

export const DocumentPickerModal: React.FC<DocumentPickerModalProps> = ({
  isOpen,
  onClose,
  proposals,
  clinics,
  activeProposalId,
  onSelectAndEdit,
  onSelectAndPreview,
  onCreateNew,
  onCreateAmendment,
}) => {
  const [search, setSearch] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = proposals.filter(p => {
    if (selectedClinicId !== 'all' && p.clinicProfileId !== selectedClinicId) {
      return false;
    }
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const docNo = (p.documentNo || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const attention = (p.attention || '').toLowerCase();
    const subject = (p.subject || '').toLowerCase();
    return (
      docNo.includes(term) ||
      title.includes(term) ||
      attention.includes(term) ||
      subject.includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in no-print">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>เลือกเอกสารที่ต้องการแก้ไข</span>
                <span className="text-xs bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30 font-semibold">
                  ทั้งหมด {proposals.length} ฉบับ
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                เลือกใบเสนอราคาหรือใบปรับปรุงสัญญาที่ต้องการเปิดเข้าสู่หน้าจอแก้ไข & พิมพ์ A4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อบริษัท, เลขที่เอกสาร, ชื่องาน..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-hidden font-medium"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedClinicId}
              onChange={e => setSelectedClinicId(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 outline-hidden"
            >
              <option value="all">ทุกบริษัท/คลินิก ({proposals.length})</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>
                  {c.shortName || c.name} ({proposals.filter(p => p.clinicProfileId === c.id).length})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                onClose();
                onCreateNew();
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างใหม่</span>
            </button>
          </div>
        </div>

        {/* Document List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">ไม่พบเอกสารตามเงื่อนไขที่ค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองล้างคำค้นหา หรือกดสร้างเอกสารใหม่</p>
            </div>
          ) : (
            filtered.map(p => {
              const clinic = clinics.find(c => c.id === p.clinicProfileId) || clinics[0];
              const isSelected = p.id === activeProposalId;
              const isAmendment = p.docType === 'amendment';

              return (
                <div
                  key={p.id}
                  className={`pt-2.5 first:pt-0 p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-300 shadow-2xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {p.documentNo || '-'}
                      </span>
                      {isAmendment && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-purple-700" /> ใบปรับปรุงสัญญา
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-sky-600" />
                        {clinic?.shortName || clinic?.name}
                      </span>
                      {p.dateText && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {p.dateText}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full">
                          ● ฉบับที่เปิดอยู่ล่าสุด
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {p.title || p.attention || 'ใบเสนอราคา'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {p.subject || '-'}
                    </p>
                  </div>

                  {/* Actions for this document */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectAndEdit(p.id);
                      }}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>เปิดแก้ไข</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectAndPreview(p.id);
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1 border border-emerald-200 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>พิมพ์</span>
                    </button>

                    {onCreateAmendment && !isAmendment && (
                      <button
                        onClick={() => {
                          onClose();
                          onCreateAmendment(p);
                        }}
                        className="px-2.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl flex items-center gap-1 border border-purple-200 transition cursor-pointer"
                        title="สร้างใบปรับปรุงสัญญาจากฉบับนี้"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span className="hidden sm:inline text-[11px]">ปรับปรุงสัญญา</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
          <span>คลิก <strong>"เปิดแก้ไข"</strong> เพื่อเข้าสู่หน้าแก้ไขเอกสารที่ต้องการ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
