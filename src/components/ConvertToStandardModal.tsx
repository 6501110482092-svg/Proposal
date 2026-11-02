import React, { useState, useEffect } from 'react';
import { ProposalDocument, PriceTier, MasterTest } from '../types';
import { DEFAULT_PRICE_TIERS, DEFAULT_MASTER_TESTS } from '../data/defaultData';
import { Users, CheckCircle2, ArrowRight, X, Sparkles, Calculator, Layers } from 'lucide-react';

interface ConvertToStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProposal: ProposalDocument | null;
  tiers?: PriceTier[];
  masterTests?: MasterTest[];
  onConvert: (
    sourceProposal: ProposalDocument,
    actualHeadcount: number,
    selectedTierId: string
  ) => void;
}

export const ConvertToStandardModal: React.FC<ConvertToStandardModalProps> = ({
  isOpen,
  onClose,
  sourceProposal,
  tiers = DEFAULT_PRICE_TIERS,
  masterTests = DEFAULT_MASTER_TESTS,
  onConvert,
}) => {
  const [headcount, setHeadcount] = useState<number>(50);
  const [selectedTierId, setSelectedTierId] = useState<string>('tier-2');

  // Determine available tiers from first program or default
  const firstProg = sourceProposal?.programs[0];
  const activeTierIds = firstProg?.selectedTierIds && firstProg.selectedTierIds.length > 0
    ? firstProg.selectedTierIds
    : tiers.map(t => t.id);

  // Auto-select tier when headcount changes
  useEffect(() => {
    if (headcount > 0) {
      const matched = tiers.find(t => {
        if (t.max === null) return headcount >= t.min;
        return headcount >= t.min && headcount <= t.max;
      });
      if (matched && activeTierIds.includes(matched.id)) {
        setSelectedTierId(matched.id);
      }
    }
  }, [headcount, tiers, activeTierIds]);

  if (!isOpen || !sourceProposal) return null;

  // Helper to calculate total per person for a specific tier
  const calculateTierPerPersonSum = (tierId: string): number => {
    if (!firstProg) return 0;
    return firstProg.items.reduce((sum, item) => {
      const mTest = masterTests.find(m => m.id === item.testId);
      const tierType =
        item.tierPricingTypes?.[tierId] ||
        mTest?.tierPricingTypes?.[tierId] ||
        (item.pricingType === 'fixed' ? 'fixed' : item.pricingType === 'free' ? 'free' : 'per-person');

      if (tierType === 'free' || tierType === 'fixed' || item.pricingType === 'free' || item.pricingType === 'fixed') {
        return sum;
      }
      let price = item.tierCustomPrices?.[tierId];
      if (price === undefined) {
        price = mTest?.tierPrices?.[tierId] ?? item.unitPrice ?? 0;
      }
      return sum + (price || 0);
    }, 0);
  };

  // Helper to calculate flat rate items sum for a specific tier
  const calculateTierFixedSum = (tierId: string): number => {
    if (!firstProg) return 0;
    return firstProg.items.reduce((sum, item) => {
      const mTest = masterTests.find(m => m.id === item.testId);
      const tierType =
        item.tierPricingTypes?.[tierId] ||
        mTest?.tierPricingTypes?.[tierId] ||
        (item.pricingType === 'fixed' ? 'fixed' : item.pricingType === 'free' ? 'free' : 'per-person');

      if (tierType === 'fixed' || item.pricingType === 'fixed') {
        let price = item.tierCustomPrices?.[tierId];
        if (price === undefined) {
          price = mTest?.tierPrices?.[tierId] ?? mTest?.fixedPrice ?? item.unitPrice ?? 0;
        }
        return sum + (price || 0);
      }
      return sum;
    }, 0);
  };

  const currentTierPerPerson = calculateTierPerPersonSum(selectedTierId);
  const currentTierFixed = calculateTierFixedSum(selectedTierId);
  const estimatedTotal = (headcount > 0 ? currentTierPerPerson * headcount : 0) + currentTierFixed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headcount <= 0) return;
    onConvert(sourceProposal, headcount, selectedTierId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 border border-purple-400/30 rounded-2xl text-purple-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" /> แปลงเป็นใบเสนอราคาจริง
              </div>
              <h3 className="text-base font-bold text-white">
                ระบุจำนวนคนเพื่อสร้างใบเสนอราคาจริง
              </h3>
              <p className="text-xs text-purple-200/80">
                ดึงข้อมูลบริษัทและรายการตรวจจากใบช่วงราคา พร้อมคำนวณราคาตามจำนวนคน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company & Source Document preview card */}
          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">ต้นฉบับช่วงราคา:</span>
              <span className="font-mono font-bold text-purple-900">{sourceProposal.documentNo}</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {sourceProposal.attention || sourceProposal.title}
            </div>
            <div className="text-[11px] text-slate-500">
              เรื่อง: {sourceProposal.subject}
            </div>
          </div>

          {/* Actual Headcount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>จำนวนคนที่ต้องการตรวจจริง (Actual Headcount):</span>
              </span>
              <span className="text-[11px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
                จำเป็นต้องระบุ
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={10000}
                required
                value={headcount || ''}
                onChange={e => setHeadcount(parseInt(e.target.value) || 0)}
                placeholder="ระบุจำนวนคน เช่น 41, 60, 120..."
                className="w-full text-lg font-bold px-4 py-3 rounded-2xl border-2 border-purple-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-hidden transition bg-white text-slate-900"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                คน
              </span>
            </div>
          </div>

          {/* Tier Selection Radio Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              ช่วงราคาที่ตรงกับจำนวนคน (เลือกช่วงราคาที่ต้องการคิดเงิน):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map(t => {
                const isSelected = selectedTierId === t.id;
                const perPersonSum = calculateTierPerPersonSum(t.id);
                const isMatching = t.max === null
                  ? headcount >= t.min
                  : headcount >= t.min && headcount <= t.max;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTierId(t.id)}
                    className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isMatching && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <span>{t.name}</span>
                    </div>
                    <div className="text-sm font-extrabold text-purple-700 mt-1">
                      {perPersonSum > 0 ? `${perPersonSum.toLocaleString()} ฿/ราย` : '-'}
                    </div>
                    {isMatching && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        ✓ ตรงกับ {headcount} คน
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculation summary bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">
                ราคาต่อคน ({tiers.find(t => t.id === selectedTierId)?.name || 'Tier'}):
              </div>
              <div className="text-xl font-extrabold text-sky-400">
                {currentTierPerPerson.toLocaleString()} ฿/ราย
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">
                ยอดรวมโดยประมาณ ({headcount} คน):
              </div>
              <div className="text-xl font-extrabold text-emerald-400">
                {estimatedTotal.toLocaleString()} ฿
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={headcount <= 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>สร้างใบเสนอราคาจริงทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
