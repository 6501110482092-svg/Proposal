import React, { useState } from 'react';
import { MasterTest, PriceTier, ProposalItem } from '../types';
import { CheckSquare, Square, Search, X, Check, Filter } from 'lucide-react';

interface TestSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: MasterTest[];
  tiers: PriceTier[];
  headcount: number;
  existingItemTestIds: string[];
  onAddSelectedTests: (items: ProposalItem[]) => void;
}

export const TestSelectorModal: React.FC<TestSelectorModalProps> = ({
  isOpen,
  onClose,
  tests,
  tiers,
  headcount,
  existingItemTestIds,
  onAddSelectedTests,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
  const safeTiers = Array.isArray(tiers) && tiers.length > 0 ? tiers : [];

  const categories = Array.from(
    new Set(safeTests.map(t => (t && t.category ? t.category : 'ทั่วไป')))
  ).filter(Boolean);

  const filteredTests = safeTests.filter(t => {
    if (!t) return false;
    const nameStr = (t.name || '').toLowerCase();
    const codeStr = (t.code || '').toLowerCase();
    const query = (searchQuery || '').trim().toLowerCase();
    const matchSearch = query === '' || nameStr.includes(query) || codeStr.includes(query);
    const matchCat = selectedCategory === 'all' || (t.category || 'ทั่วไป') === selectedCategory;
    return matchSearch && matchCat;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredTests.forEach(t => next.add(t.id));
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    const newItems: ProposalItem[] = [];
    let order = 1;

    tests.forEach(test => {
      if (selectedIds.has(test.id)) {
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
            <h3 className="font-bold text-base">เลือกรายการตรวจสุขภาพเข้าตาราง</h3>
            <p className="text-xs text-slate-300">
              จำนวนคนคำนวณ: <span className="font-bold text-sky-400">{headcount || 0} คน</span> (ตรงกับช่วง: {activeTier?.name || '-'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารายการตรวจ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white outline-hidden"
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
              className="text-sky-700 hover:text-sky-900 font-medium px-2 py-1 bg-sky-50 rounded border border-sky-200"
            >
              เลือกทั้งหมดที่ค้นหา
            </button>
            <button
              onClick={clearSelection}
              className="text-slate-600 hover:text-slate-800 font-medium px-2 py-1 bg-white rounded border border-slate-200"
            >
              ล้างที่เลือก
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {filteredTests.map(test => {
            const isSelected = selectedIds.has(test.id);
            const isAlreadyIn = existingItemTestIds.includes(test.id);
            const unitPrice = getTestUnitPrice(test);

            return (
              <div
                key={test.id}
                onClick={() => toggleSelect(test.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'bg-sky-50 border-sky-400 text-sky-950 shadow-xs'
                    : isAlreadyIn
                    ? 'bg-amber-50/50 border-amber-200 text-slate-700'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-sky-600">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-sky-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span>{test.name}</span>
                      {isAlreadyIn && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-1.5 py-0.2 rounded">
                          มีในตารางแล้ว
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px]">{test.code}</span>
                      <span>•</span>
                      <span>{test.category}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {test.defaultPricingType === 'free' ? (
                    <span className="text-emerald-600 font-bold text-sm">ฟรี</span>
                  ) : test.defaultPricingType === 'fixed' && test.flatRateLabel ? (
                    <span className="text-amber-700 font-bold text-sm">{test.flatRateLabel}</span>
                  ) : test.defaultPricingType === 'unpriced' ? (
                    <span className="text-purple-700 font-bold text-sm">
                      {unitPrice > 0 ? `${unitPrice.toLocaleString()} ฿ / คน` : '-'}
                    </span>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        {unitPrice.toLocaleString()} ฿
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        ราคาช่วง {activeTier?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            เลือกไว้ <strong className="text-sky-700">{selectedIds.size}</strong> รายการ
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-xs transition ${
                selectedIds.size > 0
                  ? 'bg-sky-600 hover:bg-sky-700 text-white'
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
