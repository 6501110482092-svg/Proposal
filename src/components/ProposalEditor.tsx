import React, { useState, useRef } from 'react';
import {
  ClinicProfile,
  MasterTest,
  PriceTier,
  ProposalDocument,
  ProposalItem,
  ProposalProgram,
} from '../types';
import { TestSelectorModal } from './TestSelectorModal';
import { ClinicLogo } from './ClinicLogo';
import { compressLogoImage } from '../utils/persistentStorage';
import {
  TextFormatToolbar,
  insertBoldMarkdown,
  insertNewline,
  insertTabIndent,
} from '../utils/richText';
import { generateCompanyDocNumber } from '../utils/docNumber';
import { getTodayThaiDate, THAI_MONTHS } from '../utils/thaiDate';
import { bahttext } from '../utils/bahttext';
import {
  Building2,
  Calendar,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bold,
  Calculator,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Info,
  DollarSign,
  Users,
  Settings,
  HelpCircle,
  Upload,
  Save,
  CornerDownLeft,
  ArrowRightToLine,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface ProposalEditorProps {
  proposal: ProposalDocument;
  onChange: (updated: ProposalDocument) => void;
  clinics: ClinicProfile[];
  masterTests: MasterTest[];
  tiers: PriceTier[];
  onOpenClinicProfiles: () => void;
  onOpenMasterCatalog: () => void;
  onUpdateClinicLogo?: (clinicId: string, logoUrl: string) => void;
  allProposals?: ProposalDocument[];
  onSave?: () => void;
}

export const ProposalEditor: React.FC<ProposalEditorProps> = ({
  proposal,
  onChange,
  clinics,
  masterTests,
  tiers,
  onOpenClinicProfiles,
  onOpenMasterCatalog,
  onUpdateClinicLogo,
  allProposals = [],
  onSave,
}) => {
  // Save feedback state
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    setSaveSuccessMessage(`บันทึกข้อมูลเรียบร้อยแล้ว (${timeStr})`);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Test Selector Modal state
  const [selectorModalProgId, setSelectorModalProgId] = useState<string | null>(null);
  const quickLogoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Active section collapses
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    header: false,
    intro: false,
    programs: false,
    terms: false,
    signoff: false,
  });

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Currently selected clinic profile
  const currentClinic =
    clinics.find(c => c.id === proposal.clinicProfileId) || clinics[0] || null;

  // Handle auto-generating document number for the clinic
  const handleGenerateDocNo = () => {
    if (!currentClinic) return;
    const newDocNo = generateCompanyDocNumber(currentClinic, allProposals);
    onChange({ ...proposal, documentNo: newDocNo });
  };

  // Handle changing issuing clinic
  const handleClinicChange = (clinicId: string) => {
    const selected = clinics.find(c => c.id === clinicId);
    if (!selected) return;

    onChange({
      ...proposal,
      clinicProfileId: clinicId,
    });
  };

  // Inline confirmation state to avoid window.confirm iframe blockers
  const [programToDeleteId, setProgramToDeleteId] = useState<string | null>(null);
  const [showConfirmPullDefaults, setShowConfirmPullDefaults] = useState(false);

  // Quick logo upload directly from Section 1
  const handleQuickLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentClinic || !onUpdateClinicLogo) return;

    setLogoUploading(true);
    try {
      const compressed = await compressLogoImage(file, 380, 380, 0.88);
      onUpdateClinicLogo(currentClinic.id, compressed);
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  // Pull defaults from the selected clinic
  const handlePullClinicDefaults = () => {
    if (!currentClinic) return;
    onChange({
      ...proposal,
      subject: currentClinic.defaultSubject || proposal.subject,
      introParagraph: currentClinic.defaultIntroText || proposal.introParagraph,
      remarks: [...currentClinic.defaultRemarks],
      serviceConditions: [...currentClinic.defaultTerms],
      closingParagraph: currentClinic.defaultClosingText || proposal.closingParagraph,
      signer: { ...currentClinic.defaultSigner },
      coordinators: currentClinic.defaultCoordinators.map(c => ({ ...c })),
    });
    setShowConfirmPullDefaults(false);
  };

  // Textarea references for bold insertion and format toolbars
  const subjectRef = useRef<HTMLTextAreaElement>(null);
  const attentionRef = useRef<HTMLTextAreaElement>(null);
  const introRef = useRef<HTMLTextAreaElement>(null);
  const closingRef = useRef<HTMLTextAreaElement>(null);

  // Helper to find active tier for a headcount
  const getTierForHeadcount = (count: number): PriceTier => {
    const match = tiers.find(t => {
      if (t.max === null) return count >= t.min;
      return count >= t.min && count <= t.max;
    });
    return match || tiers[0];
  };

  // Helper to recalculate a single program's tiered items when headcount changes
  const recalculateProgramTiers = (prog: ProposalProgram, newHeadcount: number): ProposalProgram => {
    const activeTier = getTierForHeadcount(newHeadcount);
    const updatedItems = prog.items.map(item => {
      if (item.testId && item.pricingType === 'tier') {
        const test = masterTests.find(m => m.id === item.testId);
        if (test && test.tierPrices?.[activeTier.id] !== undefined) {
          const newUnitPrice = test.tierPrices[activeTier.id];
          const count = item.isCustomHeadcount ? item.headcount : newHeadcount;
          return {
            ...item,
            unitPrice: newUnitPrice,
            headcount: count,
            totalPrice: newUnitPrice * count,
          };
        }
      } else if (!item.isCustomHeadcount && item.pricingType !== 'unpriced') {
        return {
          ...item,
          headcount: newHeadcount,
          totalPrice: item.pricingType === 'fixed' ? item.totalPrice : item.unitPrice * newHeadcount,
        };
      }
      return item;
    });

    return {
      ...prog,
      defaultHeadcount: newHeadcount,
      items: updatedItems,
    };
  };

  // Add new program table
  const handleAddNewProgram = () => {
    const newProg: ProposalProgram = {
      id: `prog-${Date.now()}`,
      title: `โปรแกรม ที่ ${proposal.programs.length + 1} รายการตรวจสุขภาพ`,
      defaultHeadcount: proposal.programs[0]?.defaultHeadcount || 20,
      colRankLabel: 'ลำดับ',
      colNameLabel: 'โปรแกรมรายการตรวจสุขภาพสำหรับพนักงาน',
      colPriceLabel: 'ราคา (บาท)',
      colCountLabel: 'จำนวนคน',
      colTotalLabel: 'รวมราคา(บาท)',
      items: [],
      showTotalRow: true,
      totalRowLabel: 'รวมราคารายการตรวจทั้งหมด',
      pageBreakAfter: false,
    };

    onChange({
      ...proposal,
      programs: [...proposal.programs, newProg],
    });
  };

  // Remove a program table directly without blocked window.confirm
  const handleExecuteRemoveProgram = (progId: string) => {
    if (proposal.programs.length <= 1) {
      return;
    }
    onChange({
      ...proposal,
      programs: proposal.programs.filter(p => p.id !== progId),
    });
    setProgramToDeleteId(null);
  };

  // Add custom manual test row to program
  const handleAddCustomItem = (progId: string) => {
    const prog = proposal.programs.find(p => p.id === progId);
    if (!prog) return;

    const newItem: ProposalItem = {
      id: `item-${Date.now()}`,
      orderNumber: prog.items.length + 1,
      name: 'รายการตรวจสุขภาพใหม่ (พิมพ์ระบุเอง)',
      pricingType: 'tier',
      unitPrice: 100,
      headcount: prog.defaultHeadcount,
      isCustomHeadcount: false,
      totalPrice: 100 * (prog.defaultHeadcount || 1),
    };

    const updatedPrograms = proposal.programs.map(p =>
      p.id === progId ? { ...p, items: [...p.items, newItem] } : p
    );

    onChange({ ...proposal, programs: updatedPrograms });
  };

  // Update item in a program
  const handleUpdateItem = (
    progId: string,
    itemId: string,
    updates: Partial<ProposalItem>
  ) => {
    const updatedPrograms = proposal.programs.map(p => {
      if (p.id !== progId) return p;

      const updatedItems = p.items.map(item => {
        if (item.id !== itemId) return item;

        const merged: ProposalItem = { ...item, ...updates };

        // Recalculate totalPrice
        if (proposal.docType === 'amendment' && merged.amendmentStatus === 'excluded') {
          merged.totalPrice = 0;
        } else if (
          proposal.docType === 'amendment' &&
          merged.amendmentPriceType === 'custom' &&
          merged.amendmentCustomPrice !== undefined
        ) {
          if (merged.pricingType === 'fixed') {
            merged.totalPrice = merged.amendmentCustomPrice;
          } else if (merged.pricingType === 'free') {
            merged.totalPrice = 0;
          } else {
            merged.totalPrice = merged.amendmentCustomPrice * (merged.headcount || 0);
          }
        } else if (merged.pricingType === 'fixed') {
          // If flat rate, price is fixed
          merged.totalPrice = merged.unitPrice;
        } else if (merged.pricingType === 'free' || merged.pricingType === 'unpriced') {
          merged.totalPrice = 0;
        } else {
          merged.totalPrice = (merged.unitPrice || 0) * (merged.headcount || 0);
        }

        return merged;
      });

      return { ...p, items: updatedItems };
    });

    onChange({ ...proposal, programs: updatedPrograms });
  };

  // Delete item from program
  const handleDeleteItem = (progId: string, itemId: string) => {
    const updatedPrograms = proposal.programs.map(p => {
      if (p.id !== progId) return p;
      const filtered = p.items.filter(item => item.id !== itemId);
      // Re-number orderNumbers
      const renumbered = filtered.map((it, idx) => ({ ...it, orderNumber: idx + 1 }));
      return { ...p, items: renumbered };
    });

    onChange({ ...proposal, programs: updatedPrograms });
  };

  // Move item up/down
  const handleMoveItem = (progId: string, index: number, direction: 'up' | 'down') => {
    const prog = proposal.programs.find(p => p.id === progId);
    if (!prog) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= prog.items.length) return;

    const newItems = [...prog.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, moved);

    const renumbered = newItems.map((it, idx) => ({ ...it, orderNumber: idx + 1 }));

    const updatedPrograms = proposal.programs.map(p =>
      p.id === progId ? { ...p, items: renumbered } : p
    );

    onChange({ ...proposal, programs: updatedPrograms });
  };

  return (
    <div className="w-full space-y-5 text-sm">
      {/* Explicit Save Action Bar (Addresses user request for a manual save button with feedback) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition hover:scale-[1.02] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกข้อมูล (Save)</span>
          </button>
          {saveSuccessMessage && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl animate-fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          เอกสาร: <strong className="font-mono text-slate-800">{proposal.documentNo}</strong> ({currentClinic?.shortName})
        </div>
      </div>

      {/* 1. Header & Clinic Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => toggleSection('header')}
          className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                1. หัวกระดาษคลินิกและวันที่ (Letterhead & Date)
              </h3>
              <p className="text-xs text-slate-500">
                เลือกบริษัทผู้เสนอขาย เลขผู้เสียภาษี ใบอนุญาต ที่อยู่ และตั้งค่าวันที่ไทย
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-800 rounded-lg border border-sky-200">
              {currentClinic?.shortName || currentClinic?.name}
            </span>
            {collapsedSections.header ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {!collapsedSections.header && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Issuing Clinic Select */}
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกบริษัท/คลินิกที่เสนอขาย (สามารถสลับหัวกระดาษได้ทันที)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={proposal.clinicProfileId}
                    onChange={e => handleClinicChange(e.target.value)}
                    className="w-full text-sm font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {clinics.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.taxId ? `(เลขผู้เสียภาษี: ${c.taxId})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onOpenClinicProfiles}
                    className="whitespace-nowrap px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    title="เปิดสมุดจัดการคลินิก"
                  >
                    จัดการสมุดบริษัท
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-slate-500">
                    ใบอนุญาต: {currentClinic?.licenseNo || '-'} | โทร: {currentClinic?.phone || '-'}
                  </span>
                  <button
                    type="button"
                    onClick={handlePullClinicDefaults}
                    className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> ดึงข้อความเริ่มต้นของบริษัทนี้
                  </button>
                </div>

                {/* Quick Logo Uploader for Current Clinic */}
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-11 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      <ClinicLogo
                        logoUrl={currentClinic?.logoUrl}
                        clinicId={currentClinic?.id}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>รูปภาพโลโก้หัวกระดาษ</span>
                        {currentClinic?.logoUrl ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                            ใช้รูปที่อัปโหลด
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 font-normal">
                            ใช้โลโก้เริ่มต้น
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {logoUploading ? 'กำลังบันทึกรูปภาพ...' : 'แสดงที่มุมซ้ายบนของหัวกระดาษทุกหน้า'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={quickLogoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleQuickLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={logoUploading}
                      onClick={() => quickLogoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-sky-700 hover:text-sky-800 border border-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{currentClinic?.logoUrl ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดรูปโลโก้'}</span>
                    </button>
                    {currentClinic?.logoUrl && onUpdateClinicLogo && (
                      <button
                        type="button"
                        onClick={() => onUpdateClinicLogo(currentClinic.id, '')}
                        className="px-2 py-1.5 text-slate-500 hover:text-red-600 text-xs font-medium rounded-xl hover:bg-red-50 transition cursor-pointer"
                        title="รีเซ็ตกลับเป็นโลโก้เริ่มต้น"
                      >
                        รีเซ็ต
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Input */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันที่ในเอกสาร (ไทย) *
                </label>
                <input
                  type="text"
                  value={proposal.dateText}
                  onChange={e => onChange({ ...proposal, dateText: e.target.value })}
                  placeholder="เช่น 20 ตุลาคม 2569"
                  className="w-full text-sm font-medium border border-slate-300 rounded-xl px-3 py-2 outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                />
                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...proposal, dateText: getTodayThaiDate('standard') })
                    }
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                  >
                    วันนี้ ({getTodayThaiDate('standard')})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...proposal, dateText: getTodayThaiDate('with-prefix') })
                    }
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                  >
                    ใส่คำว่า "วันที่"
                  </button>
                </div>
              </div>
            </div>

            {/* Document Title / Internal Memo */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ชื่อเรียกใบเสนอราคาในระบบ
                </label>
                <input
                  type="text"
                  value={proposal.title}
                  onChange={e => onChange({ ...proposal, title: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    เลขที่เอกสาร
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDocNo}
                    className="text-[11px] text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                    title="สร้างเลขที่เอกสารอัตโนมัติ เช่น BK-QT-2569-001"
                  >
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>รันเลขที่อัตโนมัติ ({currentClinic?.docPrefix || 'BK'}-QT-...)</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={proposal.documentNo}
                  onChange={e => onChange({ ...proposal, documentNo: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Header Style Selector (User requirement: minimal vs official) */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>รูปแบบหัวกระดาษ (Header Layout Style):</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  เลือกสไตล์การวางเลขที่เอกสารและวันที่
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, headerStyle: 'minimal' })}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    (!proposal.headerStyle || proposal.headerStyle === 'minimal')
                      ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-1 ring-sky-500'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-sky-100 text-sky-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>แบบมินิมอล (มีกล่องด้านขวา)</span>
                      {(!proposal.headerStyle || proposal.headerStyle === 'minimal') && (
                        <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-1.5 py-0.2 rounded">เลือกอยู่</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      หัวกระดาษมีกล่องใส่ "เลขที่:" และ "วันที่:" อยู่ด้านขวาบน ขนาดกะทัดรัด
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, headerStyle: 'official' })}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    proposal.headerStyle === 'official'
                      ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-1 ring-sky-500'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-indigo-100 text-indigo-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>แบบทางการ (เลขที่ & วันที่เหนือชื่อเรื่อง)</span>
                      {proposal.headerStyle === 'official' && (
                        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-1.5 py-0.2 rounded">เลือกอยู่</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      หัวกระดาษสะอาดตา และแสดงเลขที่กับวันที่อยู่บรรทัดเดียวกันเหนือช่อง "เรื่อง"
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Document Mode Selector: Normal Quotation vs Contract Amendment (User requirement) */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>ประเภทเอกสาร & โหมดการทำงาน (Document Mode):</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ใบเสนอราคาปกติ หรือ ใบปรับปรุงสัญญา/รายการและราคา
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, docType: 'quotation' })}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    (!proposal.docType || proposal.docType === 'quotation')
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>📄 ใบเสนอราคาปกติ (Quotation)</span>
                      {(!proposal.docType || proposal.docType === 'quotation') && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">เลือกอยู่</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      หัวเรื่อง "ใบเสนอราคา" แสดงตารางราคาปกติ (ลำดับ, รายการ, ราคา, จำนวนคน, รวมราคา)
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Initialize amendment fields if needed
                    const updatedPrograms = proposal.programs.map(prog => ({
                      ...prog,
                      colOriginalPriceLabel: prog.colOriginalPriceLabel || 'ใบเสนอราคาเดิม',
                      colAmendmentLabel: prog.colAmendmentLabel || 'เอกสารปรับปรุง',
                      items: prog.items.map(it => ({
                        ...it,
                        originalUnitPrice: it.originalUnitPrice !== undefined ? it.originalUnitPrice : it.unitPrice,
                        originalFlatRateLabel: it.originalFlatRateLabel !== undefined ? it.originalFlatRateLabel : it.flatRateLabel,
                        originalPricingType: it.originalPricingType !== undefined ? it.originalPricingType : it.pricingType,
                        amendmentStatus: it.amendmentStatus || 'included',
                        amendmentPriceType: it.amendmentPriceType || 'original',
                        amendmentCustomPrice: it.amendmentCustomPrice !== undefined ? it.amendmentCustomPrice : it.unitPrice,
                      })),
                    }));
                    onChange({
                      ...proposal,
                      docType: 'amendment',
                      amendmentDocTitle: proposal.amendmentDocTitle || 'ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ',
                      programs: updatedPrograms,
                    });
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                    proposal.docType === 'amendment'
                      ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-500'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-purple-100 text-purple-700">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>📝 ใบปรับปรุงสัญญา (Contract Amendment)</span>
                      {proposal.docType === 'amendment' && (
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded">เลือกอยู่</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เปรียบเทียบ "ใบเสนอราคาเดิม" vs "เอกสารปรับปรุง (มี/ไม่มี/ราคาใหม่)" และสรุปยอดราคาใหม่
                    </p>
                  </div>
                </button>
              </div>

              {/* Amendment Options Sub-panel */}
              {proposal.docType === 'amendment' && (
                <div className="mt-2.5 p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-purple-900">
                      หัวเรื่องเอกสารปรับปรุงสัญญา:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...proposal,
                          subject: 'ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ ประจำปี 2569',
                          amendmentDocTitle: 'ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ',
                        })
                      }
                      className="text-[11px] text-purple-700 hover:text-purple-900 bg-white border border-purple-300 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>ตั้งชื่อเรื่องมาตรฐานสำหรับปรับปรุงสัญญา</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={proposal.amendmentDocTitle || 'ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ'}
                    onChange={e => onChange({ ...proposal, amendmentDocTitle: e.target.value })}
                    className="w-full text-xs border border-purple-300 rounded-lg px-2.5 py-1.5 font-bold text-purple-950 bg-white"
                    placeholder="ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ"
                  />
                </div>
              )}
            </div>

            {/* Document Body Text Color Selector (Doesn't affect header) */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สีตัวหนังสือเนื้อหาเอกสาร (ไม่เกี่ยวกับหัวกระดาษ)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Standard Black */}
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, bodyTextColor: 'black' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                    (!proposal.bodyTextColor || proposal.bodyTextColor === 'black')
                      ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-black border border-white/40"></span>
                  <span>สีดำมาตรฐาน</span>
                </button>

                {/* Charcoal Gray */}
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, bodyTextColor: 'gray' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                    proposal.bodyTextColor === 'gray'
                      ? 'border-slate-700 bg-slate-700 text-white shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#4b5563]"></span>
                  <span>สีเทาเข้มทางการ</span>
                </button>

                {/* Copy Blue (Carbon copy blue / mimeograph blue) */}
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, bodyTextColor: 'copy-blue' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                    proposal.bodyTextColor === 'copy-blue'
                      ? 'border-blue-700 bg-blue-700 text-white shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1e40af]"></span>
                  <span>สีน้ำเงินกระดาษ Copy</span>
                </button>

                {/* Custom Color Picker */}
                <div className="flex items-center gap-1.5 ml-2 border border-slate-300 rounded-xl px-2.5 py-1 bg-white">
                  <span className="text-[11px] text-slate-600 font-medium">สีอื่น:</span>
                  <input
                    type="color"
                    value={
                      proposal.bodyTextColor?.startsWith('#')
                        ? proposal.bodyTextColor
                        : '#1e40af'
                    }
                    onChange={e => onChange({ ...proposal, bodyTextColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    title="เลือกสีกำหนดเอง"
                  />
                  {proposal.bodyTextColor?.startsWith('#') && (
                    <span className="font-mono text-[10px] text-slate-500">
                      {proposal.bodyTextColor}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bold Text Color Selector */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สีตัวหนังสือสำหรับข้อความตัวหนา [B] (Bold Text Color)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, boldTextColor: 'inherit' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                    (!proposal.boldTextColor || proposal.boldTextColor === 'inherit')
                      ? 'border-sky-700 bg-sky-50 text-sky-900 font-bold shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>สีเดียวกับตัวหนังสือทั่วไป (เหมือนกัน)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, boldTextColor: 'black' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                    proposal.boldTextColor === 'black'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-black"></span>
                  <span>สีดำเข้ม</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...proposal, boldTextColor: 'copy-blue' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                    proposal.boldTextColor === 'copy-blue'
                      ? 'border-blue-900 bg-blue-900 text-white shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#172554]"></span>
                  <span>สีน้ำเงินเข้มเน้นข้อความ</span>
                </button>
                <div className="flex items-center gap-1.5 ml-2 border border-slate-300 rounded-xl px-2.5 py-1 bg-white">
                  <span className="text-[11px] text-slate-600 font-medium">สีอื่น:</span>
                  <input
                    type="color"
                    value={
                      proposal.boldTextColor?.startsWith('#')
                        ? proposal.boldTextColor
                        : '#000000'
                    }
                    onChange={e => onChange({ ...proposal, boldTextColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    title="เลือกสีตัวหนาเอง"
                  />
                  {proposal.boldTextColor?.startsWith('#') && (
                    <span className="font-mono text-[10px] text-slate-500">
                      {proposal.boldTextColor}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Table Border Color Sync Option */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={!!proposal.syncTableBorderColor}
                  onChange={e =>
                    onChange({
                      ...proposal,
                      syncTableBorderColor: e.target.checked,
                    })
                  }
                  className="rounded text-sky-600 w-4 h-4 cursor-pointer"
                />
                <span>เปลี่ยนสีเส้นขอบตารางตามสีตัวหนังสือ (Sync Border with Text Color)</span>
              </label>

              {!proposal.syncTableBorderColor && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">สีเส้นขอบตาราง:</span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...proposal, tableBorderColor: '#0f172a' })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      !proposal.tableBorderColor || proposal.tableBorderColor === '#0f172a'
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    สีดำมาตรฐาน
                  </button>
                  <input
                    type="color"
                    value={proposal.tableBorderColor || '#0f172a'}
                    onChange={e =>
                      onChange({
                        ...proposal,
                        tableBorderColor: e.target.value,
                      })
                    }
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    title="เลือกสีขอบตารางเอง"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Subject, Attention & Intro */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => toggleSection('intro')}
          className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                2. เรื่อง, เรียน และคำนำแนะนำบริษัท (Subject, Attention & Intro)
              </h3>
              <p className="text-xs text-slate-500">
                กำหนดชื่อโครงการ ผู้รับเอกสาร และสามารถไฮไลต์ทำเป็นตัวหนา [B] เฉพาะบางคำได้
              </p>
            </div>
          </div>
          {collapsedSections.intro ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          )}
        </div>

        {!collapsedSections.intro && (
          <div className="p-5 space-y-4">
            {/* Subject (เรื่อง) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  เรื่อง (หัวข้อการเสนอราคา) *
                </label>
                <TextFormatToolbar
                  inputRef={subjectRef}
                  value={proposal.subject}
                  onChange={val => onChange({ ...proposal, subject: val })}
                />
              </div>
              <textarea
                ref={subjectRef}
                rows={2}
                value={proposal.subject}
                onChange={e => onChange({ ...proposal, subject: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (subjectRef.current) {
                      insertTabIndent(subjectRef.current, proposal.subject, val =>
                        onChange({ ...proposal, subject: val })
                      );
                    }
                  }
                }}
                className="w-full text-sm font-medium border border-slate-300 rounded-xl px-3 py-2 outline-hidden focus:ring-2 focus:ring-sky-500 leading-snug"
              />
            </div>

            {/* Attention (เรียน) with multiline and toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  เรียน (ผู้บริหาร / ชื่อบริษัทลูกค้า) *
                </label>
                <TextFormatToolbar
                  inputRef={attentionRef}
                  value={proposal.attention}
                  onChange={val => onChange({ ...proposal, attention: val })}
                />
              </div>
              <textarea
                ref={attentionRef}
                rows={2}
                value={proposal.attention}
                onChange={e => onChange({ ...proposal, attention: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (attentionRef.current) {
                      insertTabIndent(attentionRef.current, proposal.attention, val =>
                        onChange({ ...proposal, attention: val })
                      );
                    }
                  }
                }}
                placeholder="ท่านผู้บริหาร **บริษัท เจริญสุข ฟาร์มา ซัพพลาย จำกัด**"
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 outline-hidden focus:ring-2 focus:ring-sky-500 leading-snug"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                เคล็ดลับ: สามารถกดปุ่ม <strong className="text-sky-700 font-semibold">[↵ ขึ้นบรรทัดใหม่]</strong> หรือ <strong className="text-indigo-700 font-semibold">[⇥ ย่อหน้า]</strong> เพื่อจัดข้อความชื่อบริษัทหรือคำขึ้นต้นได้ตามต้องการ
              </span>
            </div>

            {/* Introduction Paragraph */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  ย่อหน้ารายละเอียดบรรยายเกี่ยวกับบริษัท (ดึงอัตโนมัติจากสมุดบริษัท)
                </label>
                <TextFormatToolbar
                  inputRef={introRef}
                  value={proposal.introParagraph}
                  onChange={val => onChange({ ...proposal, introParagraph: val })}
                />
              </div>
              <textarea
                ref={introRef}
                rows={4}
                value={proposal.introParagraph}
                onChange={e => onChange({ ...proposal, introParagraph: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (introRef.current) {
                      insertTabIndent(introRef.current, proposal.introParagraph, val =>
                        onChange({ ...proposal, introParagraph: val })
                      );
                    }
                  }
                }}
                className="w-full text-sm border border-slate-300 rounded-xl p-3 outline-hidden focus:ring-2 focus:ring-sky-500 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Program Tables & Test Items Builder */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => toggleSection('programs')}
          className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                3. รายละเอียดการขายงานและตารางตรวจ (Programs & Test Tables)
              </h3>
              <p className="text-xs text-slate-500">
                เพิ่มตารางโปรแกรม 1, 2, 3... ดึงราคาตามช่วงจำนวนคน หรือใส่เหมาจ่าย/ฟรี แก้ไขหัวตารางได้
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
              {proposal.programs.length} ตาราง
            </span>
            {collapsedSections.programs ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {!collapsedSections.programs && (
          <div className="p-5 space-y-6">
            {proposal.programs.map((prog, progIdx) => {
              const activeTier = getTierForHeadcount(prog.defaultHeadcount);
              const programTotal = prog.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
              const thaiBaht = prog.thaiBahtTextOverride || bahttext(programTotal);

              return (
                <div
                  key={prog.id}
                  className="border-2 border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4"
                >
                  {/* Program Title & Controls Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded">
                          ตารางที่ {progIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={prog.title}
                          onChange={e => {
                            const updated = proposal.programs.map(p =>
                              p.id === prog.id ? { ...p, title: e.target.value } : p
                            );
                            onChange({ ...proposal, programs: updated });
                          }}
                          className="font-bold text-base text-slate-900 border-b border-dashed border-slate-400 bg-transparent px-1 py-0.5 focus:border-emerald-600 outline-hidden flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Headcount Input for this program */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 shadow-2xs">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                          จำนวนคน:
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={prog.defaultHeadcount}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const recalculated = recalculateProgramTiers(prog, val);
                            const updated = proposal.programs.map(p =>
                              p.id === prog.id ? recalculated : p
                            );
                            onChange({ ...proposal, programs: updated });
                          }}
                          className="w-16 font-bold text-sm text-sky-900 border-none outline-hidden text-center"
                        />
                        <span className="text-xs text-slate-500">คน</span>
                      </div>

                      {/* Recalculate button */}
                      <button
                        type="button"
                        onClick={() => {
                          const recalculated = recalculateProgramTiers(prog, prog.defaultHeadcount);
                          const updated = proposal.programs.map(p =>
                            p.id === prog.id ? recalculated : p
                          );
                          onChange({ ...proposal, programs: updated });
                        }}
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition"
                        title="คำนวณราคาตามช่วงจำนวนคนใหม่ทันที"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {/* Remove Program with safe inline confirmation */}
                      {proposal.programs.length > 1 && (
                        programToDeleteId === prog.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-xl px-2 py-1 text-xs shadow-xs animate-in fade-in">
                            <span className="text-red-700 font-bold text-[11px]">ลบตารางนี้?</span>
                            <button
                              type="button"
                              onClick={() => handleExecuteRemoveProgram(prog.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[11px] shadow-2xs"
                            >
                              ใช่ ลบ
                            </button>
                            <button
                              type="button"
                              onClick={() => setProgramToDeleteId(null)}
                              className="text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded text-[11px] font-medium"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setProgramToDeleteId(prog.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="ลบตารางนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Tier status indicator */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-1.5 gap-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ช่วงราคาที่ตรงกับ {prog.defaultHeadcount} คน:{' '}
                      <strong className="text-emerald-950 font-bold">{activeTier.name}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const testMap = new Map<string, MasterTest>();
                          masterTests.forEach(t => testMap.set(t.id, t));
                          const updatedItems = prog.items.map(item => {
                            let matched = item.testId ? testMap.get(item.testId) : undefined;
                            if (!matched) {
                              const norm = (item.name || '').replace(/[\r\n\s]+/g, ' ').trim();
                              matched = masterTests.find(
                                t => (t.name || '').replace(/[\r\n\s]+/g, ' ').trim() === norm
                              );
                            }
                            if (matched && matched.name) {
                              return {
                                ...item,
                                testId: matched.id,
                                name: matched.name,
                                flatRateLabel: matched.flatRateLabel || item.flatRateLabel,
                              };
                            }
                            return item;
                          });
                          const updated = proposal.programs.map(p =>
                            p.id === prog.id ? { ...p, items: updatedItems } : p
                          );
                          onChange({ ...proposal, programs: updated });
                        }}
                        className="text-sky-700 hover:text-sky-900 text-xs font-semibold bg-white hover:bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-300 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="อัปเดตชื่อรายการตรวจและการจัดบรรทัดตามที่แก้ไขไว้ในคลัง"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                        ซิงค์ชื่อรายการตรวจจากคลัง
                      </button>
                      <button
                        type="button"
                        onClick={onOpenMasterCatalog}
                        className="text-emerald-700 hover:text-emerald-900 underline font-medium"
                      >
                        ดู/แก้ไข 4 ช่วงราคา
                      </button>
                    </div>
                  </div>

                  {/* Customizable Column Headers Row */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      ปรับแต่งข้อความหัวตาราง (สามารถพิมพ์แก้ไขคำได้ตามต้องการ):
                    </span>
                    {proposal.docType === 'amendment' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500">คอลัมน์ 1 (ลำดับ)</label>
                          <input
                            type="text"
                            value={prog.colRankLabel || 'ลำดับ'}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colRankLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 font-semibold"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500">คอลัมน์ 2 (ชื่อรายการ)</label>
                          <input
                            type="text"
                            value={prog.colNameLabel || 'โปรแกรมรายการตรวจสุขภาพ'}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colNameLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-purple-700 font-bold">คอลัมน์ 3 (ราคาเดิม)</label>
                          <input
                            type="text"
                            value={prog.colOriginalPriceLabel || 'ใบเสนอราคาเดิม'}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colOriginalPriceLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-purple-300 rounded px-2 py-1 font-semibold bg-purple-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-purple-700 font-bold">คอลัมน์ 4 (ปรับปรุง)</label>
                          <input
                            type="text"
                            value={prog.colAmendmentLabel || 'เอกสารปรับปรุง'}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colAmendmentLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-purple-300 rounded px-2 py-1 font-semibold bg-purple-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">คอลัมน์ 5 (จำนวนคน)</label>
                          <input
                            type="text"
                            value={prog.colCountLabel || 'จำนวนคน'}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colCountLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 font-semibold"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500">คอลัมน์ 1</label>
                          <input
                            type="text"
                            value={prog.colRankLabel}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colRankLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 font-semibold"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500">คอลัมน์ 2 (ชื่อรายการ)</label>
                          <input
                            type="text"
                            value={prog.colNameLabel}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colNameLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">คอลัมน์ 3 (ราคา)</label>
                          <input
                            type="text"
                            value={prog.colPriceLabel}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colPriceLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">คอลัมน์ 4 (จำนวนคน)</label>
                          <input
                            type="text"
                            value={prog.colCountLabel}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, colCountLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {prog.items.map((item, itemIdx) => {
                      const isExcluded = proposal.docType === 'amendment' && item.amendmentStatus === 'excluded';
                      return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-3 transition ${
                          isExcluded
                            ? 'bg-slate-50 border border-slate-200 opacity-60'
                            : 'bg-white border border-slate-200 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {/* Order and Name (Multi-line with Enter, Tab and Bold buttons) */}
                          <div className="flex items-start gap-2 flex-1 min-w-[260px]">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                              {item.orderNumber || itemIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-400">
                                  ชื่อรายการตรวจ (ขึ้นบรรทัดใหม่/ย่อหน้าได้):
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = item.name || '';
                                      let newName: string;
                                      if (!current.includes('\n') && current.includes(' (')) {
                                        newName = current.replace(' (', '\n(');
                                      } else {
                                        newName = current + '\n';
                                      }
                                      handleUpdateItem(prog.id, item.id, { name: newName });
                                    }}
                                    className="text-[10px] text-sky-700 hover:text-sky-900 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 font-bold transition cursor-pointer"
                                    title="ขึ้นบรรทัดใหม่ [↵]"
                                  >
                                    ↵ บรรทัดใหม่
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newName = (item.name || '') + '    ';
                                      handleUpdateItem(prog.id, item.id, { name: newName });
                                    }}
                                    className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 font-bold transition cursor-pointer"
                                    title="ย่อหน้า [Tab]"
                                  >
                                    ⇥ ย่อหน้า
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newName = item.name?.startsWith('**') && item.name?.endsWith('**')
                                        ? item.name.slice(2, -2)
                                        : `**${item.name || ''}**`;
                                      handleUpdateItem(prog.id, item.id, { name: newName });
                                    }}
                                    className="text-[10px] text-slate-700 hover:text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-bold transition cursor-pointer"
                                    title="ทำตัวหนา [B]"
                                  >
                                    B
                                  </button>
                                </div>
                              </div>
                              <textarea
                                rows={item.name && item.name.includes('\n') ? 2 : 1}
                                value={item.name}
                                onChange={e =>
                                  handleUpdateItem(prog.id, item.id, { name: e.target.value })
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Tab') {
                                    e.preventDefault();
                                    const target = e.currentTarget;
                                    const start = target.selectionStart;
                                    const end = target.selectionEnd;
                                    const val = target.value;
                                    const updated = val.substring(0, start) + '    ' + val.substring(end);
                                    handleUpdateItem(prog.id, item.id, { name: updated });
                                  }
                                }}
                                placeholder="ชื่อรายการตรวจ..."
                                className="w-full font-medium text-sm text-slate-900 border border-slate-200 hover:border-slate-300 focus:border-sky-500 outline-hidden focus:ring-1 focus:ring-sky-500 rounded-lg px-2 py-1 leading-snug resize-y"
                              />
                            </div>
                          </div>

                          {/* Pricing Type & Headcount Controls */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Pricing Type selector */}
                            <select
                              value={item.pricingType}
                              onChange={e => {
                                const newType = e.target.value as any;
                                let newUnit = item.unitPrice;
                                let flatLabel = item.flatRateLabel;

                                if (newType === 'free') {
                                  newUnit = 0;
                                  flatLabel = 'ฟรี';
                                } else if (newType === 'fixed') {
                                  flatLabel = flatLabel || 'เหมาจ่าย';
                                }

                                handleUpdateItem(prog.id, item.id, {
                                  pricingType: newType,
                                  unitPrice: newUnit,
                                  flatRateLabel: flatLabel,
                                });
                              }}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 font-semibold"
                            >
                              <option value="tier">ตามช่วงราคา ({activeTier.name})</option>
                              <option value="fixed">เหมาจ่าย (Flat rate)</option>
                              <option value="free">ตรวจฟรี / รวมในแพ็กเกจ</option>
                              <option value="unpriced">ตรวจเพิ่ม (ไม่คูณคน)</option>
                            </select>

                            {/* Flat rate label if fixed */}
                            {item.pricingType === 'fixed' && (
                              <input
                                type="text"
                                placeholder="เหมาจ่าย 12,000 บาท"
                                value={item.flatRateLabel || ''}
                                onChange={e =>
                                  handleUpdateItem(prog.id, item.id, {
                                    flatRateLabel: e.target.value,
                                  })
                                }
                                className="w-36 text-xs border border-amber-300 rounded-lg px-2 py-1 bg-amber-50 text-amber-900 font-semibold"
                              />
                            )}

                            {/* Unit Price Input */}
                            {item.pricingType !== 'free' && (
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-slate-500">ราคา:</span>
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={e =>
                                    handleUpdateItem(prog.id, item.id, {
                                      unitPrice: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1 text-right font-medium"
                                />
                                <span className="text-[11px] text-slate-500">฿</span>
                              </div>
                            )}

                            {/* Custom Headcount Toggle */}
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-xs">
                              <label className="text-[11px] text-slate-600 flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.isCustomHeadcount}
                                  onChange={e =>
                                    handleUpdateItem(prog.id, item.id, {
                                      isCustomHeadcount: e.target.checked,
                                      headcount: e.target.checked ? item.headcount : prog.defaultHeadcount,
                                    })
                                  }
                                  className="rounded text-sky-600 w-3.5 h-3.5"
                                />
                                <span>คนแยก:</span>
                              </label>
                              <input
                                type="number"
                                disabled={!item.isCustomHeadcount}
                                value={item.headcount}
                                onChange={e =>
                                  handleUpdateItem(prog.id, item.id, {
                                    headcount: parseInt(e.target.value, 10) || 0,
                                  })
                                }
                                className={`w-14 text-xs rounded px-1.5 py-0.5 text-center font-bold ${
                                  item.isCustomHeadcount
                                    ? 'bg-white border border-sky-300 text-sky-900'
                                    : 'bg-transparent border-none text-slate-500'
                                }`}
                              />
                            </div>

                            {/* Subtotal */}
                            <div className="min-w-[80px] text-right font-bold text-slate-900 text-xs">
                              {item.pricingType === 'free'
                                ? 'ฟรี'
                                : item.pricingType === 'unpriced'
                                ? '-'
                                : `${(item.totalPrice || 0).toLocaleString()} ฿`}
                            </div>

                            {/* Reorder & Delete */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveItem(prog.id, itemIdx, 'up')}
                                disabled={itemIdx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(prog.id, itemIdx, 'down')}
                                disabled={itemIdx === prog.items.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(prog.id, item.id)}
                                className="p-1 text-red-400 hover:text-red-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Amendment Mode Controls (โหมดปรับปรุงสัญญา: มี/ไม่มี, ราคาเดิม vs ราคาใหม่) */}
                        {proposal.docType === 'amendment' && (
                          <div className="mt-2.5 pt-2 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2 bg-purple-50/70 p-2.5 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-purple-900">
                                ข้อตกลงปรับปรุง:
                              </span>
                              <div className="inline-flex rounded-lg border border-purple-200 bg-white p-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateItem(prog.id, item.id, {
                                      amendmentStatus: 'included',
                                    })
                                  }
                                  className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition cursor-pointer ${
                                    item.amendmentStatus !== 'excluded'
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>มี (รับบริการ)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateItem(prog.id, item.id, {
                                      amendmentStatus: 'excluded',
                                    })
                                  }
                                  className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition cursor-pointer ${
                                    item.amendmentStatus === 'excluded'
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-rose-700'
                                  }`}
                                >
                                  <X className="w-3 h-3" />
                                  <span>ไม่มี (ไม่รับบริการ)</span>
                                </button>
                              </div>
                            </div>

                            {/* Original vs Revised Price */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-md border border-purple-200 font-medium">
                                ใบเสนอราคาเดิม:{' '}
                                <strong className="text-slate-900 font-bold">
                                  {item.originalPricingType === 'fixed'
                                    ? item.originalFlatRateLabel || `${item.originalUnitPrice || item.unitPrice} ฿`
                                    : item.originalPricingType === 'free'
                                    ? 'ฟรี'
                                    : `${item.originalUnitPrice !== undefined ? item.originalUnitPrice : item.unitPrice} ฿`}
                                </strong>
                              </span>

                              {item.amendmentStatus !== 'excluded' && (
                                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`priceType-${item.id}`}
                                      checked={item.amendmentPriceType !== 'custom'}
                                      onChange={() =>
                                        handleUpdateItem(prog.id, item.id, {
                                          amendmentPriceType: 'original',
                                        })
                                      }
                                      className="text-purple-600 w-3 h-3"
                                    />
                                    <span className="text-[11px] font-semibold text-slate-700">ใช้ราคาเดิม</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer ml-1">
                                    <input
                                      type="radio"
                                      name={`priceType-${item.id}`}
                                      checked={item.amendmentPriceType === 'custom'}
                                      onChange={() =>
                                        handleUpdateItem(prog.id, item.id, {
                                          amendmentPriceType: 'custom',
                                          amendmentCustomPrice:
                                            item.amendmentCustomPrice !== undefined
                                              ? item.amendmentCustomPrice
                                              : item.unitPrice,
                                        })
                                      }
                                      className="text-purple-600 w-3 h-3"
                                    />
                                    <span className="text-[11px] font-semibold text-emerald-800">ใส่ราคาใหม่:</span>
                                  </label>
                                  {item.amendmentPriceType === 'custom' && (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={
                                          item.amendmentCustomPrice !== undefined
                                            ? item.amendmentCustomPrice
                                            : item.unitPrice
                                        }
                                        onChange={e =>
                                          handleUpdateItem(prog.id, item.id, {
                                            amendmentCustomPrice: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-18 px-1.5 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded text-right"
                                      />
                                      <span className="text-[10px] text-slate-500">฿</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {/* Add Test Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectorModalProgId(prog.id)}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <Plus className="w-4 h-4" /> เลือกรายการจากคลัง (Master Catalog)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCustomItem(prog.id)}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" /> เพิ่มแถวพิมพ์เอง
                    </button>
                  </div>

                  {/* Table Total Summary Row Settings */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={prog.showTotalRow}
                          onChange={e => {
                            const updated = proposal.programs.map(p =>
                              p.id === prog.id ? { ...p, showTotalRow: e.target.checked } : p
                            );
                            onChange({ ...proposal, programs: updated });
                          }}
                          className="rounded text-emerald-600 w-4 h-4"
                        />
                        <span>แสดงแถวรวมราคา (Total Summary Row)</span>
                      </label>

                      {prog.showTotalRow && (
                        <div className="text-right">
                          <span className="text-xs text-slate-500 mr-2">ยอดรวม:</span>
                          <span className="text-base font-bold text-emerald-700">
                            {programTotal.toLocaleString()} บาท
                          </span>
                        </div>
                      )}
                    </div>

                    {prog.showTotalRow && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            ข้อความแถวสรุปยอด (เช่น รวมราคาโปรแกรมรายการตรวจทั่วไปพนักงาน)
                          </label>
                          <input
                            type="text"
                            value={prog.totalRowLabel}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, totalRowLabel: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            จำนวนเงินรวมเป็นภาษาไทย (แก้ไขเองได้)
                          </label>
                          <input
                            type="text"
                            value={prog.thaiBahtTextOverride !== undefined ? prog.thaiBahtTextOverride : thaiBaht}
                            onChange={e => {
                              const updated = proposal.programs.map(p =>
                                p.id === prog.id ? { ...p, thaiBahtTextOverride: e.target.value } : p
                              );
                              onChange({ ...proposal, programs: updated });
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white font-medium text-slate-700"
                          />
                        </div>
                      </div>
                    )}

                    {/* Table Note */}
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        หมายเหตุใต้ตารางนี้ (เช่น **และราคาตรวจเพิ่มเติมเป็นราคาผู้ตรวจรายบุคคล...)
                      </label>
                      <input
                        type="text"
                        value={prog.tableNote || ''}
                        onChange={e => {
                          const updated = proposal.programs.map(p =>
                            p.id === prog.id ? { ...p, tableNote: e.target.value } : p
                          );
                          onChange({ ...proposal, programs: updated });
                        }}
                        placeholder="ระบุหมายเหตุเฉพาะตารางนี้..."
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Program Button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleAddNewProgram}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" /> เพิ่มตารางโปรแกรมใหม่ (เช่น ตารางที่ 2 หรือ รายการตรวจเพิ่มเติม)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Remarks & Service Conditions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => toggleSection('terms')}
          className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                4. หมายเหตุ, เงื่อนไขการให้บริการ และคำลงท้าย
              </h3>
              <p className="text-xs text-slate-500">
                กำหนดระยะเวลารายงานผล เครดิตเทอม การยกเว้น Vat 7% และคำว่า จึงเรียนมาเพื่อโปรดพิจารณา
              </p>
            </div>
          </div>
          {collapsedSections.terms ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          )}
        </div>

        {!collapsedSections.terms && (
          <div className="p-5 space-y-4">
            {/* Remarks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  หมายเหตุ (Remarks)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...proposal,
                      remarks: [...proposal.remarks, 'หมายเหตุข้อใหม่'],
                    })
                  }
                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มหมายเหตุ
                </button>
              </div>
              <div className="space-y-2">
                {proposal.remarks.map((rem, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">หมายเหตุข้อที่ {idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...proposal.remarks];
                            updated[idx] = (updated[idx] || '') + '\n';
                            onChange({ ...proposal, remarks: updated });
                          }}
                          className="text-[10px] text-sky-700 bg-white border border-sky-200 px-1.5 py-0.5 rounded font-bold hover:bg-sky-50 transition cursor-pointer"
                          title="ขึ้นบรรทัดใหม่"
                        >
                          ↵ บรรทัดใหม่
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...proposal.remarks];
                            updated[idx] = (updated[idx] || '') + '    ';
                            onChange({ ...proposal, remarks: updated });
                          }}
                          className="text-[10px] text-indigo-700 bg-white border border-indigo-200 px-1.5 py-0.5 rounded font-bold hover:bg-indigo-50 transition cursor-pointer"
                          title="ย่อหน้า (4 เคาะ)"
                        >
                          ⇥ ย่อหน้า
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...proposal.remarks];
                            const current = updated[idx] || '';
                            updated[idx] = current.startsWith('**') && current.endsWith('**')
                              ? current.slice(2, -2)
                              : `**${current}**`;
                            onChange({ ...proposal, remarks: updated });
                          }}
                          className="text-[10px] text-slate-700 bg-white border border-slate-300 px-1.5 py-0.5 rounded font-bold hover:bg-slate-100 transition cursor-pointer"
                          title="ทำตัวหนา"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = proposal.remarks.filter((_, i) => i !== idx);
                            onChange({ ...proposal, remarks: updated });
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer ml-1"
                          title="ลบข้อนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={rem.includes('\n') ? 3 : 2}
                      value={rem}
                      onChange={e => {
                        const updated = [...proposal.remarks];
                        updated[idx] = e.target.value;
                        onChange({ ...proposal, remarks: updated });
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const target = e.currentTarget;
                          const start = target.selectionStart;
                          const end = target.selectionEnd;
                          const val = target.value;
                          const updated = [...proposal.remarks];
                          updated[idx] = val.substring(0, start) + '    ' + val.substring(end);
                          onChange({ ...proposal, remarks: updated });
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white outline-hidden focus:ring-1 focus:ring-sky-500 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Service Conditions */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  เงื่อนไขการให้บริการ (Service Conditions)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...proposal,
                      serviceConditions: [
                        ...(proposal.serviceConditions || []),
                        'เงื่อนไขการให้บริการข้อใหม่',
                      ],
                    })
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มเงื่อนไข
                </button>
              </div>
              <div className="space-y-2">
                {proposal.serviceConditions.map((cond, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">เงื่อนไขข้อที่ {idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...proposal.serviceConditions];
                            updated[idx] = (updated[idx] || '') + '\n';
                            onChange({ ...proposal, serviceConditions: updated });
                          }}
                          className="text-[10px] text-sky-700 bg-white border border-sky-200 px-1.5 py-0.5 rounded font-bold hover:bg-sky-50 transition cursor-pointer"
                          title="ขึ้นบรรทัดใหม่"
                        >
                          ↵ บรรทัดใหม่
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...proposal.serviceConditions];
                            updated[idx] = (updated[idx] || '') + '    ';
                            onChange({ ...proposal, serviceConditions: updated });
                          }}
                          className="text-[10px] text-indigo-700 bg-white border border-indigo-200 px-1.5 py-0.5 rounded font-bold hover:bg-indigo-50 transition cursor-pointer"
                          title="ย่อหน้า (4 เคาะ)"
                        >
                          ⇥ ย่อหน้า
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...proposal.serviceConditions];
                            const current = updated[idx] || '';
                            updated[idx] = current.startsWith('**') && current.endsWith('**')
                              ? current.slice(2, -2)
                              : `**${current}**`;
                            onChange({ ...proposal, serviceConditions: updated });
                          }}
                          className="text-[10px] text-slate-700 bg-white border border-slate-300 px-1.5 py-0.5 rounded font-bold hover:bg-slate-100 transition cursor-pointer"
                          title="ทำตัวหนา"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = proposal.serviceConditions.filter((_, i) => i !== idx);
                            onChange({ ...proposal, serviceConditions: updated });
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer ml-1"
                          title="ลบข้อนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={cond.includes('\n') ? 3 : 2}
                      value={cond}
                      onChange={e => {
                        const updated = [...proposal.serviceConditions];
                        updated[idx] = e.target.value;
                        onChange({ ...proposal, serviceConditions: updated });
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const target = e.currentTarget;
                          const start = target.selectionStart;
                          const end = target.selectionEnd;
                          const val = target.value;
                          const updated = [...proposal.serviceConditions];
                          updated[idx] = val.substring(0, start) + '    ' + val.substring(end);
                          onChange({ ...proposal, serviceConditions: updated });
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white outline-hidden focus:ring-1 focus:ring-sky-500 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Closing Paragraph */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  ย่อหน้าสุดท้าย (จึงเรียนมาเพื่อโปรดพิจารณา...)
                </label>
                <TextFormatToolbar
                  inputRef={closingRef}
                  value={proposal.closingParagraph}
                  onChange={val => onChange({ ...proposal, closingParagraph: val })}
                />
              </div>
              <textarea
                ref={closingRef}
                rows={3}
                value={proposal.closingParagraph}
                onChange={e => onChange({ ...proposal, closingParagraph: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    if (closingRef.current) {
                      insertTabIndent(closingRef.current, proposal.closingParagraph, val =>
                        onChange({ ...proposal, closingParagraph: val })
                      );
                    }
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-hidden focus:ring-1 focus:ring-sky-500 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Sign-off, Client Acceptance & Coordinators */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => toggleSection('signoff')}
          className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                5. ผู้ลงนาม, ช่องยืนยันการใช้บริการ และผู้ประสานงาน
              </h3>
              <p className="text-xs text-slate-500">
                ขอแสดงความนับถือ เว้นที่ไว้เซ็น ผู้ประสานงานติดต่อ เบอร์โทร อีเมล
              </p>
            </div>
          </div>
          {collapsedSections.signoff ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          )}
        </div>

        {!collapsedSections.signoff && (
          <div className="p-5 space-y-5">
            {/* Signer */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                ผู้เสนอราคา (ขอแสดงความนับถือ)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    ชื่อ-นามสกุล ในวงเล็บ
                  </label>
                  <input
                    type="text"
                    value={proposal.signer.name}
                    onChange={e =>
                      onChange({
                        ...proposal,
                        signer: { ...proposal.signer, name: e.target.value },
                      })
                    }
                    placeholder="เช่น นายสรายุทธ ห่อทอง"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    ตำแหน่ง (เช่น เจ้าหน้าที่ฝ่ายขาย / ผู้ประสานงานขาย)
                  </label>
                  <input
                    type="text"
                    value={proposal.signer.title}
                    onChange={e =>
                      onChange({
                        ...proposal,
                        signer: { ...proposal.signer, title: e.target.value },
                      })
                    }
                    placeholder="เช่น ประสานงานขาย"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Client Acceptance Box */}
            <div className="pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={proposal.clientConfirmation.show}
                  onChange={e =>
                    onChange({
                      ...proposal,
                      clientConfirmation: {
                        ...proposal.clientConfirmation,
                        show: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-purple-600 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  แสดงช่อง "ยืนยันการใช้บริการ" (พร้อมจุดไข่ปลาให้ลูกค้าเซ็นชื่อ)
                </span>
              </label>

              {proposal.clientConfirmation.show && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      หัวข้อกล่องยืนยัน
                    </label>
                    <input
                      type="text"
                      value={proposal.clientConfirmation.title}
                      onChange={e =>
                        onChange({
                          ...proposal,
                          clientConfirmation: {
                            ...proposal.clientConfirmation,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      ข้อความบรรทัดเซ็นชื่อ
                    </label>
                    <input
                      type="text"
                      value={proposal.clientConfirmation.signatureLabel}
                      onChange={e =>
                        onChange({
                          ...proposal,
                          clientConfirmation: {
                            ...proposal.clientConfirmation,
                            signatureLabel: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Coordinators List */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  กล่องข้อมูลผู้ประสานงาน (Coordinators Box)
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...proposal,
                      coordinators: [
                        ...(proposal.coordinators || []),
                        {
                          id: `coord-${Date.now()}`,
                          name: 'คุณผู้ประสานงานใหม่',
                          phone: '08X-XXX-XXXX',
                          email: '',
                          note: 'เพื่อยืนยันการใช้บริการ',
                        },
                      ],
                    })
                  }
                  className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มผู้ประสานงาน
                </button>
              </div>

              <div className="space-y-3">
                {proposal.coordinators.map((coord, idx) => (
                  <div
                    key={coord.id || idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          ชื่อผู้ประสานงาน
                        </label>
                        <input
                          type="text"
                          value={coord.name}
                          onChange={e => {
                            const updated = [...proposal.coordinators];
                            updated[idx] = { ...coord, name: e.target.value };
                            onChange({ ...proposal, coordinators: updated });
                          }}
                          placeholder="คุณสรายุทธ ห่อทอง"
                          className="w-full text-xs font-medium border border-slate-300 rounded px-2.5 py-1 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          เบอร์โทร / มือถือ
                        </label>
                        <input
                          type="text"
                          value={coord.phone}
                          onChange={e => {
                            const updated = [...proposal.coordinators];
                            updated[idx] = { ...coord, phone: e.target.value };
                            onChange({ ...proposal, coordinators: updated });
                          }}
                          placeholder="0943318899"
                          className="w-full text-xs border border-slate-300 rounded px-2.5 py-1 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-500 mb-0.5">อีเมล</label>
                        <input
                          type="text"
                          value={coord.email || ''}
                          onChange={e => {
                            const updated = [...proposal.coordinators];
                            updated[idx] = { ...coord, email: e.target.value };
                            onChange({ ...proposal, coordinators: updated });
                          }}
                          placeholder="example@gmail.com"
                          className="w-full text-xs border border-slate-300 rounded px-2.5 py-1 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = proposal.coordinators.filter((_, i) => i !== idx);
                            onChange({ ...proposal, coordinators: updated });
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">
                        ข้อความกำกับ (เช่น "เพื่อยืนยันการใช้บริการ")
                      </label>
                      <input
                        type="text"
                        value={coord.note || ''}
                        onChange={e => {
                          const updated = [...proposal.coordinators];
                          updated[idx] = { ...coord, note: e.target.value };
                          onChange({ ...proposal, coordinators: updated });
                        }}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Selector Modal */}
      {selectorModalProgId && (
        <TestSelectorModal
          isOpen={true}
          onClose={() => setSelectorModalProgId(null)}
          tests={masterTests}
          tiers={tiers}
          headcount={
            proposal.programs.find(p => p.id === selectorModalProgId)?.defaultHeadcount || 20
          }
          existingItemTestIds={
            proposal.programs
              .find(p => p.id === selectorModalProgId)
              ?.items.map(it => it.testId)
              .filter(Boolean) as string[]
          }
          onAddSelectedTests={newItems => {
            const prog = proposal.programs.find(p => p.id === selectorModalProgId);
            if (!prog) return;

            const baseOrder = prog.items.length;
            const adjustedItems = newItems.map((item, idx) => ({
              ...item,
              orderNumber: baseOrder + idx + 1,
            }));

            const updatedPrograms = proposal.programs.map(p =>
              p.id === selectorModalProgId
                ? { ...p, items: [...p.items, ...adjustedItems] }
                : p
            );

            onChange({ ...proposal, programs: updatedPrograms });
          }}
        />
      )}
    </div>
  );
};
