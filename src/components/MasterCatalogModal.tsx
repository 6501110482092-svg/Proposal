import React, { useState, useEffect } from 'react';
import { MasterTest, PriceTier } from '../types';
import { DEFAULT_PRICE_TIERS } from '../data/defaultData';
import {
  Layers,
  Plus,
  Trash2,
  Search,
  Edit2,
  Check,
  X,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface MasterCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiers: PriceTier[];
  onSaveTiers: (tiers: PriceTier[]) => void;
  tests: MasterTest[];
  onSaveTests: (tests: MasterTest[]) => void;
}

export const MasterCatalogModal: React.FC<MasterCatalogModalProps> = ({
  isOpen,
  onClose,
  tiers,
  onSaveTiers,
  tests,
  onSaveTests,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'tiers'>('tests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tiersSavedSuccess, setTiersSavedSuccess] = useState(false);

  // Safe fallbacks to prevent any white-screen crash
  const safeTiers = Array.isArray(tiers) && tiers.length > 0 ? tiers : DEFAULT_PRICE_TIERS;
  const safeTests = Array.isArray(tests) ? tests : [];

  // Tiers state
  const [currentTiers, setCurrentTiers] = useState<PriceTier[]>(safeTiers);

  // Synchronize tiers when prop updates
  useEffect(() => {
    if (Array.isArray(tiers) && tiers.length > 0) {
      setCurrentTiers(tiers);
    }
  }, [tiers]);

  // Editing single test modal/form
  const [editingTest, setEditingTest] = useState<MasterTest | null>(null);

  // State for inline delete confirmation to prevent accidental deletion and avoid window.confirm blockers
  const [testToDeleteId, setTestToDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Extract unique categories safely
  const categories = Array.from(
    new Set(safeTests.map(t => (t && t.category ? t.category : 'ทั่วไป')))
  ).filter(Boolean);

  // Safe search and filter
  const filteredTests = safeTests.filter(t => {
    if (!t) return false;
    const nameStr = (t.name || '').toLowerCase();
    const codeStr = (t.code || '').toLowerCase();
    const query = (searchQuery || '').trim().toLowerCase();
    const matchSearch = query === '' || nameStr.includes(query) || codeStr.includes(query);
    const cat = t.category || 'ทั่วไป';
    const matchCat = selectedCategory === 'all' || cat === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleCreateNewTest = () => {
    const tier1Id = safeTiers[0]?.id || 'tier-1';
    const tier2Id = safeTiers[1]?.id || 'tier-2';
    const tier3Id = safeTiers[2]?.id || 'tier-3';
    const tier4Id = safeTiers[3]?.id || 'tier-4';

    const newTest: MasterTest = {
      id: `test-${Date.now()}`,
      code: `TEST-${safeTests.length + 1}`,
      name: 'รายการตรวจสุขภาพใหม่',
      category: selectedCategory !== 'all' ? selectedCategory : 'ตรวจทั่วไป',
      defaultPricingType: 'tier',
      tierPrices: {
        [tier1Id]: 100,
        [tier2Id]: 90,
        [tier3Id]: 80,
        [tier4Id]: 70,
      },
    };
    setEditingTest(newTest);
  };

  const handleSaveTestForm = (testToSave: MasterTest) => {
    const exists = safeTests.some(t => t.id === testToSave.id);
    let updated: MasterTest[];
    if (exists) {
      updated = safeTests.map(t => (t.id === testToSave.id ? testToSave : t));
    } else {
      updated = [...safeTests, testToSave];
    }
    onSaveTests(updated);
    setEditingTest(null);
  };

  const executeDeleteTest = (id: string) => {
    const updated = safeTests.filter(t => t.id !== id);
    onSaveTests(updated);
    setTestToDeleteId(null);
  };

  const handleSaveTiersChanges = () => {
    onSaveTiers(currentTiers);
    setTiersSavedSuccess(true);
    setTimeout(() => setTiersSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">คลังรายการตรวจและช่วงราคา (Test Catalog & Tiers)</h2>
              <p className="text-xs text-slate-300">
                กำหนดรายการตรวจ บันทึกราคา 4 ช่วงตามจำนวนคนตรวจ (จำนวนคนมากขึ้น ราคาลดลง) หรือแบบเหมาจ่าย/ฟรี
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> รายการตรวจทั้งหมด ({safeTests.length})
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'tiers'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" /> กำหนด 4 ช่วงจำนวนคน (Tier Configuration)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'tiers' ? (
            /* Tiers Configuration Tab */
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 leading-relaxed">
                <span className="font-bold">คำแนะนำ:</span> ระบบรองรับ 4 ช่วงจำนวนคนสำหรับการเสนอขาย
                เมื่อคุณใส่จำนวนคนในใบเสนอราคา เช่น 41 คน ระบบจะตรวจสอบว่าตรงกับช่วงไหน (เช่น ช่วงที่ 2: 21-50 คน)
                และดึงราคาของช่วงนั้นมาคำนวณให้อัตโนมัติ!
              </div>

              {tiersSavedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  บันทึกการปรับช่วงจำนวนคนสำเร็จเรียบร้อย!
                </div>
              )}

              <div className="space-y-4">
                {currentTiers.map((tier, idx) => (
                  <div
                    key={tier.id || idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-1 text-center font-bold text-slate-500 text-sm">
                      #{idx + 1}
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        ชื่อช่วงที่แสดง
                      </label>
                      <input
                        type="text"
                        value={tier.name || ''}
                        onChange={e => {
                          const updated = currentTiers.map(t =>
                            t.id === tier.id ? { ...t, name: e.target.value } : t
                          );
                          setCurrentTiers(updated);
                        }}
                        className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        จำนวนคนเริ่มต้น
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.min}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10) || 1;
                          const updated = currentTiers.map(t =>
                            t.id === tier.id ? { ...t, min: val } : t
                          );
                          setCurrentTiers(updated);
                        }}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        จำนวนคนสิ้นสุด (เว้นว่างหากไม่จำกัด)
                      </label>
                      <input
                        type="number"
                        placeholder="ไม่จำกัด (ขึ้นไป)"
                        value={tier.max === null || tier.max === undefined ? '' : tier.max}
                        onChange={e => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          const updated = currentTiers.map(t =>
                            t.id === tier.id ? { ...t, max: val } : t
                          );
                          setCurrentTiers(updated);
                        }}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveTiersChanges}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  บันทึกช่วงจำนวนคน
                </button>
              </div>
            </div>
          ) : (
            /* Tests List Tab */
            <div className="space-y-4">
              {/* Search, Filter & Add bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหารายการตรวจ (ชื่อ หรือ รหัส)..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white outline-hidden cursor-pointer"
                  >
                    <option value="all">ทุกหมวดหมู่ ({safeTests.length})</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleCreateNewTest}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> เพิ่มรายการตรวจใหม่
                </button>
              </div>

              {/* Tests Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-[55vh]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-16">รหัส</th>
                        <th className="py-2.5 px-3">ชื่อรายการตรวจ</th>
                        <th className="py-2.5 px-3 w-32">หมวดหมู่</th>
                        <th className="py-2.5 px-3 w-28 text-center">ประเภทราคา</th>
                        {safeTiers.map(t => (
                          <th key={t.id} className="py-2.5 px-2 text-center text-[11px] w-20">
                            {t.name}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 w-20 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTests.map(test => (
                        <tr key={test.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-mono text-xs text-slate-500">
                            {test.code || '-'}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {test.name || 'ไม่ระบุชื่อ'}
                            {test.flatRateLabel && test.defaultPricingType === 'fixed' && (
                              <span className="block text-xs text-amber-700 font-semibold">
                                {test.flatRateLabel}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-500">{test.category || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            {test.defaultPricingType === 'tier' && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                                ตาม 4 ช่วง
                              </span>
                            )}
                            {test.defaultPricingType === 'fixed' && (
                              <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                                เหมาจ่าย
                              </span>
                            )}
                            {test.defaultPricingType === 'free' && (
                              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                                บริการฟรี
                              </span>
                            )}
                            {test.defaultPricingType === 'unpriced' && (
                              <span className="inline-block bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                                เพิ่มตามต้องการ
                              </span>
                            )}
                          </td>
                          {safeTiers.map(t => {
                            const p = test.tierPrices?.[t.id];
                            return (
                              <td key={t.id} className="py-2 px-2 text-center text-xs font-medium">
                                {test.defaultPricingType === 'free'
                                  ? 'ฟรี'
                                  : p !== undefined && p !== null && p > 0
                                  ? `${Number(p).toLocaleString()} ฿`
                                  : test.fixedPrice
                                  ? `${Number(test.fixedPrice).toLocaleString()} ฿`
                                  : '-'}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditingTest({ ...test, tierPrices: test.tierPrices || {} })}
                                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                title="แก้ไขรายการ"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {testToDeleteId === test.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-md px-1.5 py-0.5 shadow-2xs">
                                  <span className="text-[10px] text-red-700 font-bold whitespace-nowrap">ลบ?</span>
                                  <button
                                    onClick={() => executeDeleteTest(test.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-1.5 py-0.2 rounded cursor-pointer"
                                    title="ยืนยันการลบ"
                                  >
                                    ใช่
                                  </button>
                                  <button
                                    onClick={() => setTestToDeleteId(null)}
                                    className="text-slate-600 hover:text-slate-900 text-[10px] px-1 cursor-pointer"
                                    title="ยกเลิก"
                                  >
                                    ไม่
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setTestToDeleteId(test.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                  title="ลบรายการ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Single Test Sub-Modal */}
        {editingTest && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTest.id && editingTest.id.startsWith('test-') ? 'แก้ไขรายการตรวจ' : 'เพิ่มรายการตรวจ'}
                </h3>
                <button
                  onClick={() => setEditingTest(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อรายการตรวจ *</label>
                <input
                  type="text"
                  value={editingTest.name || ''}
                  onChange={e => setEditingTest({ ...editingTest, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสการตรวจ</label>
                  <input
                    type="text"
                    value={editingTest.code || ''}
                    onChange={e => setEditingTest({ ...editingTest, code: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
                  <input
                    type="text"
                    value={editingTest.category || ''}
                    onChange={e => setEditingTest({ ...editingTest, category: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทราคา</label>
                <select
                  value={editingTest.defaultPricingType}
                  onChange={e =>
                    setEditingTest({
                      ...editingTest,
                      defaultPricingType: e.target.value as any,
                    })
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-hidden cursor-pointer"
                >
                  <option value="tier">คิดตามช่วงจำนวนคน 4 ช่วง (จำนวนคนเยอะราคาลดลง)</option>
                  <option value="fixed">เหมาจ่าย (Flat rate เช่น เหมาจ่าย 12,000 บาท)</option>
                  <option value="free">ตรวจฟรี / รวมในแพ็กเกจแล้ว</option>
                  <option value="unpriced">รายการตรวจเพิ่มตามความต้องการ (ตรวจรายบุคคล)</option>
                </select>
              </div>

              {editingTest.defaultPricingType === 'fixed' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ข้อความกำกับเหมาจ่าย (เช่น "เหมาจ่าย 12,000 บาท")
                  </label>
                  <input
                    type="text"
                    value={editingTest.flatRateLabel || ''}
                    onChange={e =>
                      setEditingTest({
                        ...editingTest,
                        flatRateLabel: e.target.value,
                      })
                    }
                    placeholder="เหมาจ่าย 12,000 บาท"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                  />
                </div>
              )}

              {/* 4 Tiers pricing input */}
              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ราคาต่อหน่วย (บาท) สำหรับ 4 ช่วงจำนวนคน:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {safeTiers.map(t => (
                    <div key={t.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
                        {t.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingTest.tierPrices?.[t.id] ?? ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditingTest({
                              ...editingTest,
                              tierPrices: {
                                ...(editingTest.tierPrices || {}),
                                [t.id]: val,
                              },
                            });
                          }}
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1 bg-white font-medium"
                        />
                        <span className="text-xs text-slate-500">฿</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleSaveTestForm(editingTest)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกรายการ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
