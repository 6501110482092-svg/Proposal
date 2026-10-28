import React, { useRef } from 'react';
import { ProposalDocument } from '../types';
import {
  FileText,
  Plus,
  Copy,
  Printer,
  Building2,
  Layers,
  Download,
  Upload,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  History,
} from 'lucide-react';

interface HeaderNavProps {
  proposals: ProposalDocument[];
  activeProposalId: string;
  onSelectProposal: (id: string) => void;
  onCreateNewProposal: () => void;
  onOpenCloneModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenClinicModal: () => void;
  onOpenCatalogModal: () => void;
  viewMode: 'split' | 'edit' | 'preview';
  onChangeViewMode: (mode: 'split' | 'edit' | 'preview') => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  proposals,
  activeProposalId,
  onSelectProposal,
  onCreateNewProposal,
  onOpenCloneModal,
  onOpenHistoryModal,
  onOpenClinicModal,
  onOpenCatalogModal,
  viewMode,
  onChangeViewMode,
  onExportData,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProposal = proposals.find(p => p.id === activeProposalId) || proposals[0];

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md no-print select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Proposal Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>Clinic Quotation Studio</span>
                <span className="text-[10px] bg-sky-500/30 text-sky-300 font-medium px-1.5 py-0.2 rounded border border-sky-400/30">
                  ระบบเสนอขายงานคลินิก
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                สร้างใบเสนอราคาโครงการตรวจสุขภาพเคลื่อนที่
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          {/* Proposal Select Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={activeProposalId}
              onChange={e => onSelectProposal(e.target.value)}
              className="bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded-xl px-3 py-1.5 border border-slate-700 outline-hidden max-w-[190px] sm:max-w-[240px] truncate"
            >
              {proposals.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title || p.documentNo || 'ใบเสนอราคา'}
                </option>
              ))}
            </select>

            <button
              onClick={onCreateNewProposal}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition"
              title="สร้างใบเสนอราคาใหม่"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenHistoryModal}
              className="px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              title="ดูประวัติการเสนอขายทั้งหมด"
            >
              <History className="w-3.5 h-3.5" />
              <span>ประวัติการเสนอขาย</span>
              <span className="bg-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {proposals.length}
              </span>
            </button>

            <button
              onClick={onOpenCloneModal}
              className="px-2.5 py-1.5 bg-sky-600/90 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              title="ทำสำเนาใบเสนอราคานี้สำหรับบริษัทอื่น"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ทำสำเนา</span>
            </button>
          </div>
        </div>

        {/* Right Navigation & Tools */}
        <div className="flex items-center gap-2">
          {/* Master Data Menus */}
          <button
            onClick={onOpenClinicModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">สมุดบริษัทคลินิก</span>
          </button>

          <button
            onClick={onOpenCatalogModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">คลัง Test & 4 ช่วงราคา</span>
          </button>

          {/* View Mode Toggle */}
          <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
            <button
              onClick={() => onChangeViewMode('split')}
              className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="แก้ไขและดูตัวอย่างคู่กัน"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">หน้าจอคู่</span>
            </button>
            <button
              onClick={() => onChangeViewMode('edit')}
              className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                viewMode === 'edit'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="โหมดฟอร์มแก้ไขเต็มจอ"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">แก้ไข</span>
            </button>
            <button
              onClick={() => onChangeViewMode('preview')}
              className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="โหมดตัวอย่างก่อนพิมพ์ A4"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">เอกสาร A4</span>
            </button>
          </div>

          {/* Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / PDF</span>
          </button>

          {/* Backup / Restore dropdown / buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onExportData}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              title="สำรองข้อมูลเป็นไฟล์ JSON (Export)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              title="นำเข้าไฟล์สำรองข้อมูล JSON (Import)"
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
    </header>
  );
};
