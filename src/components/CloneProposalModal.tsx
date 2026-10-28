import React, { useState } from 'react';
import { MasterTest, PriceTier, ProposalDocument, ProposalItem, ProposalProgram } from '../types';
import { getTodayThaiDate } from '../utils/thaiDate';
import { Copy, X, ArrowRight, RefreshCw, Calendar, Building, Sparkles } from 'lucide-react';

interface CloneProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProposal: ProposalDocument;
  tiers: PriceTier[];
  masterTests: MasterTest[];
  onCloneSuccess: (clonedProposal: ProposalDocument) => void;
}

export const CloneProposalModal: React.FC<CloneProposalModalProps> = ({
  isOpen,
  onClose,
  sourceProposal,
  tiers,
  masterTests,
  onCloneSuccess,
}) => {
  // Extract client clean name safely
  const existingClient = (sourceProposal?.attention || '')
    .replace(/ท่านผู้บริหาร|บริษัท|จำกัด|\*\*|เรียน/g, '')
    .trim();

  const [cloneMode, setCloneMode] = useState<'renewal' | 'new-company'>('renewal');
  const [newTitle, setNewTitle] = useState(`${sourceProposal?.title || 'ใบเสนอราคา'} (ปีใหม่/ราคาใหม่)`);
  const [clientCompanyName, setClientCompanyName] = useState(existingClient);
  const [newDate, setNewDate] = useState(getTodayThaiDate('standard'));
  const [newHeadcount, setNewHeadcount] = useState<number>(
    sourceProposal?.programs?.[0]?.defaultHeadcount || 30
  );
  const [newSubject, setNewSubject] = useState(sourceProposal?.subject || '');
  const [autoRecalculatePrices, setAutoRecalculatePrices] = useState(true);

  if (!isOpen) return null;

  // Active tier for new headcount
  const activeTier =
    tiers.find(t => {
      if (t.max === null) return newHeadcount >= t.min;
      return newHeadcount >= t.min && newHeadcount <= t.max;
    }) || tiers[0];

  const handleDuplicate = () => {
    const cloneId = `prop-${Date.now()}`;
    const nextDocNum = `BK-QT-${new Date().getFullYear() + 543}-${Math.floor(100 + Math.random() * 900)}`;

    // Build new attention line
    let newAttention = sourceProposal.attention;
    if (clientCompanyName.trim()) {
      newAttention = `ท่านผู้บริหาร **บริษัท ${clientCompanyName.trim()} จำกัด**`;
    }

    // Process programs and update tiered prices
    const clonedPrograms: ProposalProgram[] = sourceProposal.programs.map(prog => {
      const isAddonProgram = prog.title.includes('เพิ่มรายการตรวจได้') || prog.defaultHeadcount === 0;
      const targetHeadcount = isAddonProgram ? 0 : newHeadcount;

      const clonedItems: ProposalItem[] = prog.items.map(item => {
        const itemHeadcount = isAddonProgram ? 0 : item.isCustomHeadcount ? item.headcount : targetHeadcount;
        let unitPrice = item.unitPrice;
        let totalPrice = item.totalPrice;

        if (autoRecalculatePrices && item.testId) {
          const master = masterTests.find(m => m.id === item.testId);
          if (master) {
            if (master.defaultPricingType === 'tier' && activeTier) {
              unitPrice = master.tierPrices?.[activeTier.id] ?? item.unitPrice;
              totalPrice = unitPrice * itemHeadcount;
            } else if (master.defaultPricingType === 'fixed') {
              totalPrice = master.fixedPrice || item.totalPrice;
            } else if (master.defaultPricingType === 'free') {
              unitPrice = 0;
              totalPrice = 0;
            }
          }
        } else if (!isAddonProgram && item.pricingType !== 'free' && item.pricingType !== 'unpriced') {
          totalPrice = unitPrice * itemHeadcount;
        }

        return {
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          headcount: itemHeadcount,
          unitPrice,
          totalPrice,
        };
      });

      return {
        ...prog,
        id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        defaultHeadcount: targetHeadcount,
        items: clonedItems,
        totalPriceOverride: undefined,
        thaiBahtTextOverride: undefined,
      };
    });

    const clonedDoc: ProposalDocument = {
      ...sourceProposal,
      id: cloneId,
      documentNo: nextDocNum,
      title: newTitle || `ใบเสนอราคาใหม่ (${clientCompanyName || 'บริษัทใหม่'})`,
      dateText: newDate,
      subject: newSubject,
      attention: newAttention,
      programs: clonedPrograms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };

    onCloneSuccess(clonedDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                ทำสำเนาใบเสนอราคา (เก็บต้นฉบับเดิมไว้)
              </h3>
              <p className="text-xs text-slate-500">
                จากต้นฉบับ: <strong className="text-slate-800">{sourceProposal.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clone Mode Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setCloneMode('renewal');
              setClientCompanyName(existingClient);
              setNewTitle(`${existingClient} (เสนอปีใหม่/ราคาใหม่)`);
            }}
            className={`py-2 px-3 rounded-lg transition text-center ${
              cloneMode === 'renewal'
                ? 'bg-white text-sky-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เสนอบริษัทเดิมแต่ปรับปีใหม่/ราคาใหม่
          </button>
          <button
            type="button"
            onClick={() => {
              setCloneMode('new-company');
              setClientCompanyName('');
              setNewTitle('ใบเสนอราคาสำหรับบริษัทใหม่');
            }}
            className={`py-2 px-3 rounded-lg transition text-center ${
              cloneMode === 'new-company'
                ? 'bg-white text-sky-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทำสำเนาให้บริษัทอื่น
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อบริษัทลูกค้า *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">บริษัท</span>
              <input
                type="text"
                placeholder="ระบุชื่อบริษัทลูกค้า..."
                value={clientCompanyName}
                onChange={e => {
                  setClientCompanyName(e.target.value);
                  setNewTitle(`${e.target.value || 'บริษัท'} (${newHeadcount} คน)`);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">จำกัด</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนคนเข้าตรวจ (คน) *
              </label>
              <input
                type="number"
                min="1"
                value={newHeadcount}
                onChange={e => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setNewHeadcount(val);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-sky-900 outline-hidden"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                ช่วงราคา: <strong className="text-slate-800">{activeTier?.name}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันที่ในเอกสาร
              </label>
              <input
                type="text"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อเรื่องในเอกสาร
            </label>
            <input
              type="text"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อเรียกใบเสนอราคานี้ในระบบ (Title)
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-hidden font-medium"
            />
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="recalc"
              checked={autoRecalculatePrices}
              onChange={e => setAutoRecalculatePrices(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="recalc" className="text-xs text-sky-950 cursor-pointer">
              <strong>ดึงราคาใหม่ตามช่วงจำนวนคนอัตโนมัติ</strong>
              <span className="block text-sky-700 text-[11px] mt-0.5">
                ระบบจะตรวจสอบช่วงราคา {activeTier?.name} และอัปเดตราคาต่อหน่วยพร้อมคำนวณยอดรวมของแต่ละ test ให้ทันที
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleDuplicate}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Copy className="w-4 h-4" /> สร้างสำเนาและเปิดแก้ไขทันที
          </button>
        </div>
      </div>
    </div>
  );
};
