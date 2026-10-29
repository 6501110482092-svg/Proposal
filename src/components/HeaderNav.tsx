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
  LayoutDashboard,
  ArrowLeft,
  CheckCircle2,
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
  viewMode: 'dashboard' | 'split' | 'edit' | 'preview';
  onChangeViewMode: (mode: 'dashboard' | 'split' | 'edit' | 'preview') => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
  saveStatus?: 'saved' | 'saving';
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
  saveStatus = 'saved',
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
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Main Tabs */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onChangeViewMode('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-sm group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>Clinic Quotation Studio</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {saveStatus === 'saving' ? 'กำลังบันทึก...' : 'บันทึกในเครื่องอัตโนมัติแล้ว'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                ตรวจสุขภาพเคลื่อนที่ประจำปี
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1 hidden md:block"></div>

          {/* Primary View Switcher: Dashboard vs Editor */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => onChangeViewMode('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ดภาพรวม</span>
            </button>

            <button
              onClick={() => onChangeViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode !== 'dashboard'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>แก้ไขเอกสาร & A4</span>
            </button>
          </div>

          {/* If inside document editor, show proposal switcher */}
          {viewMode !== 'dashboard' && (
            <div className="flex items-center gap-1.5">
              <select
                value={activeProposalId}
                onChange={e => onSelectProposal(e.target.value)}
                className="bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded-xl px-3 py-1.5 border border-slate-700 outline-hidden max-w-[160px] sm:max-w-[220px] truncate cursor-pointer"
              >
                {proposals.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.documentNo || 'ใบเสนอราคา'}
                  </option>
                ))}
              </select>

              <button
                onClick={onCreateNewProposal}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                title="สร้างใบเสนอราคาใหม่"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenCloneModal}
                className="px-2.5 py-1.5 bg-sky-600/90 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                title="ทำสำเนาใบเสนอราคานี้"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ทำสำเนา</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Navigation & Tools */}
        <div className="flex items-center gap-2">
          {/* Master Data Menus */}
          <button
            onClick={onOpenClinicModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">สมุดบริษัทคลินิก</span>
          </button>

          <button
            onClick={onOpenCatalogModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">คลัง Test & 4 ช่วงราคา</span>
          </button>

          {/* Sub View Mode Toggle (Only when in Editor view) */}
          {viewMode !== 'dashboard' && (
            <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
              <button
                onClick={() => onChangeViewMode('split')}
                className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer ${
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
                className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer ${
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
                className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer ${
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
          )}

          {/* Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / PDF</span>
          </button>

          {/* Backup / Restore */}
          <div className="flex items-center gap-1">
            <button
              onClick={onExportData}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="สำรองข้อมูลเป็นไฟล์ JSON (Export)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
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
