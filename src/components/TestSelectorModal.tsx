import React, { useState } from 'react';
import { MasterTest, PriceTier, ProposalItem } from '../types';
import { CheckSquare, Square, Search, X, Check, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface UsedTestUsageInfo {
  programId: string;
  programTitle: string;
  isCurrentProgram: boolean;
}

interface TestSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: MasterTest[];
  tiers: PriceTier[];
  headcount: number;
  currentProgramTitle?: string;
  usedTestsMap?: Record<string, UsedTestUsageInfo>;
  existingItemTestIds?: string[];
  onAddSelectedTests: (items: ProposalItem[]) => void;
}

export const TestSelectorModal: React.FC<TestSelectorModalProps> = ({
  isOpen,
  onClose,
  tests,
  tiers,
  headcount,
  currentProgramTitle,
  usedTestsMap = {},
  existingItemTestIds = [],
  onAddSelectedTests,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideAlreadyUsed, setHideAlreadyUsed] = useState(false);

  if (!isOpen) return null;

  // Determine active tier for the headcount
  const activeTier = tiers.find(t => {
    if (t.max === null) return headcount >= t.min;
    return headcount >= t.min && headcount <= t.max;
  }) || tiers[0];

  const getTestUnitPrice = (test: MasterTest): number => {
    if (test.defaultPricingType === 'free') return 0;
    if (test.defaultPricingType === 'fixed') return test.fixedPrice || 0;
    if (test.defaultPricingType === 'unpriced') return test.fixedPrice || test.tierPrices?.[tiers[0]?.id] || 0;
    if (activeTier && test.tierPrices?.[activeTier.id] !== undefined) {
      return test.tierPrices[activeTier.id];
    }
    return test.fixedPrice || 0;
  };

  const safeTests = Array.isArray(tests) ? tests : [];

  const categories = Array.from(
    new Set(safeTests.map(t => (t && t.category ? t.category : 'ทั่วไป')))
  ).filter(Boolean);

  // Helper to check usage across programs in this proposal
  const getTestUsage = (test: MasterTest): UsedTestUsageInfo | undefined => {
    if (usedTestsMap[test.id]) {
      return usedTestsMap[test.id];
    }
    const normalizedName = (test.name || '').trim().toLowerCase();
    if (usedTestsMap[normalizedName]) {
      return usedTestsMap[normalizedName];
    }
    if (existingItemTestIds.includes(test.id)) {
      return {
        programId: '',
        programTitle: currentProgramTitle || 'ตารางนี้',
        isCurrentProgram: true,
      };
    }
    return undefined;
  };

  // Filter tests based on search, category, and optional hide used filter
  const filteredTests = safeTests.filter(t => {
    if (!t) return false;
    const nameStr = (t.name || '').toLowerCase();
    const codeStr = (t.code || '').toLowerCase();
    const query = (searchQuery || '').trim().toLowerCase();
    const matchSearch = query === '' || nameStr.includes(query) || codeStr.includes(query);
    const matchCat = selectedCategory === 'all' || (t.category || 'ทั่วไป') === selectedCategory;
    if (!matchSearch || !matchCat) return false;

    if (hideAlreadyUsed) {
      const usage = getTestUsage(t);
      if (usage) return false;
    }

    return true;
  });

  // Count how many tests in safeTests are already used
  const totalUsedCount = safeTests.filter(t => Boolean(getTestUsage(t))).length;

  const toggleSelect = (test: MasterTest) => {
    const usage = getTestUsage(test);
    // Locked: cannot select if already in ANY table in this proposal
    if (usage) {
      return;
    }

    const next = new Set(selectedIds);
    if (next.has(test.id)) {
      next.delete(test.id);
    } else {
      next.add(test.id);
    }
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredTests.forEach(t => {
      // Only select tests that are NOT already used anywhere
      if (!getTestUsage(t)) {
        next.add(t.id);
      }
    });
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    const newItems: ProposalItem[] = [];
    let order = 1;

    tests.forEach(test => {
      // Extra safety: only add if selected AND not already in usage
      if (selectedIds.has(test.id) && !getTestUsage(test)) {
        const unitPrice = getTestUnitPrice(test);
        const isFree = test.defaultPricingType === 'free';
        const isFixed = test.defaultPricingType === 'fixed';
        const isUnpriced = test.defaultPricingType === 'unpriced';

        let totalPrice = 0;
        if (isFixed && test.fixedPrice) {
          totalPrice = test.fixedPrice;
        } else if (!isFree && !isUnpriced && unitPrice > 0) {
          totalPrice = unitPrice * (headcount || 0);
        }

        newItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          testId: test.id,
          orderNumber: order++,
          name: test.name,
          pricingType: test.defaultPricingType,
          unitPrice: unitPrice,
          flatRateLabel: test.flatRateLabel || (isFree ? 'ฟรี' : undefined),
          headcount: isUnpriced ? 0 : headcount,
          isCustomHeadcount: isUnpriced,
          totalPrice: totalPrice,
          tierCustomPrices: test.tierPrices ? { ...test.tierPrices } : undefined,
          tierPricingTypes: test.tierPricingTypes ? { ...test.tierPricingTypes } : undefined,
          tierFlatRateLabels: test.tierFlatRateLabels ? { ...test.tierFlatRateLabels } : undefined,
        });
      }
    });

    onAddSelectedTests(newItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>เลือกรายการตรวจสุขภาพเข้าตาราง</span>
              {currentProgramTitle && (
                <span className="text-xs bg-slate-800 text-sky-300 px-2 py-0.5 rounded-full font-normal border border-slate-700">
                  {currentProgramTitle}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              จำนวนคนคำนวณ: <span className="font-bold text-sky-400">{headcount || 0} คน</span> (ตรงกับช่วง: {activeTier?.name || '-'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner when there are tests used in other tables */}
        {totalUsedCount > 0 && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200/80 text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>ระบบป้องกันการเลือกซ้ำ:</strong> มี {totalUsedCount} รายการที่ถูกใส่ในตารางของรายงานนี้แล้ว (ล็อกไม่ให้เลือกซ้ำ เพื่อป้องกันการเสนอราคารายการตรวจซ้ำซ้อน)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHideAlreadyUsed(prev => !prev)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                hideAlreadyUsed
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100/60'
              }`}
            >
              {hideAlreadyUsed ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>แสดงรายการที่ล็อก</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>ซ่อนรายการที่ล็อก ({totalUsedCount})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารายการตรวจ (ชื่อรายการ, รหัส)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-hidden"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={selectAllFiltered}
              className="text-sky-700 hover:text-sky-900 font-medium px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition cursor-pointer"
              title="เลือกทุกรายการที่ค้นหาและยังว่างอยู่"
            >
              เลือกทั้งหมดที่ว่าง
            </button>
            <button
              onClick={clearSelection}
              className="text-slate-600 hover:text-slate-800 font-medium px-2.5 py-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              ล้างที่เลือก
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium">ไม่พบรายการตรวจที่ตรงกับเงื่อนไข</p>
              {hideAlreadyUsed && (
                <button
                  type="button"
                  onClick={() => setHideAlreadyUsed(false)}
                  className="mt-2 text-xs text-sky-600 underline font-medium hover:text-sky-800"
                >
                  คลิกเพื่อแสดงรายการทั้งหมด (รวมรายการที่ถูกเลือกแล้ว)
                </button>
              )}
            </div>
          ) : (
            filteredTests.map(test => {
              const isSelected = selectedIds.has(test.id);
              const usage = getTestUsage(test);
              const isAlreadyUsed = Boolean(usage);
              const unitPrice = getTestUnitPrice(test);

              return (
                <div
                  key={test.id}
                  onClick={() => toggleSelect(test)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isAlreadyUsed
                      ? 'bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed opacity-80 select-none'
                      : isSelected
                      ? 'bg-sky-50 border-sky-400 text-sky-950 shadow-xs cursor-pointer'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {isAlreadyUsed ? (
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center bg-slate-200/90 text-slate-500"
                          title={
                            usage?.isCurrentProgram
                              ? 'รายการนี้มีอยู่ในตารางนี้แล้ว'
                              : `รายการนี้ถูกเลือกแล้วใน ${usage?.programTitle}`
                          }
                        >
                          <Lock className="w-3 h-3 text-slate-500" />
                        </div>
                      ) : isSelected ? (
                        <CheckSquare className="w-5 h-5 text-sky-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
                        <span className={`whitespace-pre-line ${isAlreadyUsed ? 'text-slate-600 line-through/40' : ''}`}>
                          {test.name}
                        </span>
                        {isAlreadyUsed && usage && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              usage.isCurrentProgram
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                            }`}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            {usage.isCurrentProgram
                              ? 'มีในตารางนี้แล้ว'
                              : `เลือกแล้วใน: ${usage.programTitle}`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px]">{test.code}</span>
                        <span>•</span>
                        <span>{test.category}</span>
                        {isAlreadyUsed && !usage?.isCurrentProgram && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-medium text-[11px]">
                              ล็อกไม่ให้เลือกซ้ำข้ามตาราง
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    {test.defaultPricingType === 'free' ? (
                      <span className={`font-bold text-sm ${isAlreadyUsed ? 'text-slate-400' : 'text-emerald-600'}`}>
                        ฟรี
                      </span>
                    ) : test.defaultPricingType === 'fixed' && test.flatRateLabel ? (
                      <span className={`font-bold text-sm ${isAlreadyUsed ? 'text-slate-400' : 'text-amber-700'}`}>
                        {test.flatRateLabel}
                      </span>
                    ) : test.defaultPricingType === 'unpriced' ? (
                      <span className={`font-bold text-sm ${isAlreadyUsed ? 'text-slate-400' : 'text-purple-700'}`}>
                        {unitPrice > 0 ? `${unitPrice.toLocaleString()} ฿ / คน` : '-'}
                      </span>
                    ) : (
                      <div>
                        <span className={`font-bold text-sm ${isAlreadyUsed ? 'text-slate-500' : 'text-slate-900'}`}>
                          {unitPrice.toLocaleString()} ฿
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          ราคาช่วง {activeTier?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              เลือกไว้ <strong className="text-sky-700">{selectedIds.size}</strong> รายการ
            </span>
            {totalUsedCount > 0 && (
              <span className="text-xs text-slate-400 border-l border-slate-200 pl-3">
                (มีในรายงานแล้ว {totalUsedCount} รายการ)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-xs transition ${
                selectedIds.size > 0
                  ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" /> เพิ่มรายการที่เลือก ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
