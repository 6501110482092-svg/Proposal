import React, { useState, useEffect, useRef } from 'react';
import { ClinicProfile } from '../types';
import { DEFAULT_CLINICS } from '../data/defaultData';
import { ClinicLogo } from './ClinicLogo';
import {
  Building2,
  Plus,
  Trash2,
  Check,
  X,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ClinicProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: ClinicProfile[];
  onSaveClinics: (updated: ClinicProfile[]) => void;
  activeClinicId: string;
  onSelectActiveClinic: (clinicId: string) => void;
}

// Ensure every single field is non-null and safely initialized
export const ensureClinicDefaults = (c: Partial<ClinicProfile> | undefined | null): ClinicProfile => {
  const base = DEFAULT_CLINICS[0];
  if (!c) return { ...base };
  return {
    id: c.id || `clinic-${Date.now()}`,
    name: c.name || base.name,
    shortName: c.shortName || base.shortName,
    logoUrl: c.logoUrl || '',
    taxId: c.taxId || '',
    licenseNo: c.licenseNo || '',
    address: c.address || '',
    phone: c.phone || '',
    email: c.email || '',
    website: c.website || '',
    defaultSubject: c.defaultSubject || base.defaultSubject,
    defaultIntroText: c.defaultIntroText || base.defaultIntroText,
    defaultRemarks: Array.isArray(c.defaultRemarks) ? c.defaultRemarks : [...base.defaultRemarks],
    defaultTerms: Array.isArray(c.defaultTerms) ? c.defaultTerms : [...base.defaultTerms],
    defaultClosingText: c.defaultClosingText || base.defaultClosingText,
    defaultSigner: {
      name: c.defaultSigner?.name || (base.defaultSigner ? base.defaultSigner.name : 'นายแพทย์ ประจำศูนย์'),
      title: c.defaultSigner?.title || (base.defaultSigner ? base.defaultSigner.title : 'ผู้อำนวยการฝ่ายบริการองค์กร'),
    },
    defaultCoordinators: Array.isArray(c.defaultCoordinators)
      ? c.defaultCoordinators.map(coord => ({
          id: coord?.id || `coord-${Date.now()}-${Math.random()}`,
          name: coord?.name || '',
          phone: coord?.phone || '',
          email: coord?.email || '',
          note: coord?.note || '',
        }))
      : [...base.defaultCoordinators],
  };
};

export const ClinicProfilesModal: React.FC<ClinicProfilesModalProps> = ({
  isOpen,
  onClose,
  clinics,
  onSaveClinics,
  activeClinicId,
  onSelectActiveClinic,
}) => {
  // Safe clinics array
  const safeClinics =
    Array.isArray(clinics) && clinics.length > 0
      ? clinics.filter(Boolean).map(ensureClinicDefaults)
      : DEFAULT_CLINICS;

  // ALL HOOKS MUST BE AT THE VERY TOP OF COMPONENT BEFORE ANY CONDITIONAL RETURN
  const [selectedId, setSelectedId] = useState<string>(() => {
    return activeClinicId || safeClinics[0]?.id || '';
  });

  const [editingClinic, setEditingClinic] = useState<ClinicProfile>(() => {
    const found = safeClinics.find(c => c.id === activeClinicId) || safeClinics[0];
    return ensureClinicDefaults(found);
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDeleteClinicId, setConfirmDeleteClinicId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editing clinic whenever modal opens or activeClinicId changes
  useEffect(() => {
    if (isOpen) {
      const found = safeClinics.find(c => c.id === activeClinicId) || safeClinics[0];
      if (found) {
        setSelectedId(found.id);
        setEditingClinic(ensureClinicDefaults(found));
      }
      setHasChanges(false);
      setUploadError(null);
      setConfirmDeleteClinicId(null);
    }
  }, [isOpen, activeClinicId]);

  // NOW CONDITIONAL RETURN IS SAFE BECAUSE ALL HOOKS HAVE ALREADY BEEN CALLED
  if (!isOpen) return null;

  const handleSelectClinic = (c: ClinicProfile) => {
    setSelectedId(c.id);
    setEditingClinic(ensureClinicDefaults(c));
    setHasChanges(false);
    setUploadError(null);
    setConfirmDeleteClinicId(null);
  };

  const handleAddNewClinic = () => {
    const newId = `clinic-${Date.now()}`;
    const newClinic: ClinicProfile = {
      id: newId,
      name: 'คลินิกเวชกรรมและห้องปฏิบัติการใหม่',
      shortName: 'คลินิกใหม่',
      logoUrl: '',
      taxId: '0105560000000',
      licenseNo: '10107000999',
      address: 'เลขที่ 123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      phone: '02-123-4567 , 089-999-8888',
      email: 'info@newclinic.com',
      website: 'www.newclinic.com',
      defaultSubject: 'ขอเสนอโครงการตรวจสุขภาพเคลื่อนที่ ประจำปี 2569',
      defaultIntroText:
        '**คลินิกเวชกรรมและห้องปฏิบัติการ** มีความยินดีที่จะนำเสนอการให้บริการตรวจสุขภาพพนักงานเคลื่อนที่ประจำปี ด้วยทีมงานมืออาชีพและเครื่องมือทางการแพทย์มาตรฐาน\n\nบริษัทฯ ใคร่ขอเสนองานบริการตรวจสุขภาพดังนี้',
      defaultRemarks: [
        'การตรวจในบางรายการ จะต้องรอผลในการตรวจประมาณ 15-30 วันทำการ',
      ],
      defaultTerms: [
        'ส่งผลการตรวจภายใน 30 วันทำการ',
        'กำหนดการชำระเงินเครดิต 30 วัน (นับจากวันวางบิล)',
      ],
      defaultClosingText:
        'จึงเรียนมาเพื่อโปรดพิจารณาโดยทางบริษัทฯ หวังเป็นอย่างยิ่งว่าจะได้รับความไว้วางใจให้เป็นส่วนหนึ่งในการดูแลสุขภาพประจำปีแก่พนักงานบริษัทของท่าน',
      defaultSigner: {
        name: 'นายแพทย์ ผู้ตรวจการ',
        title: 'ผู้อำนวยการฝ่ายบริการองค์กร',
      },
      defaultCoordinators: [
        {
          id: `coord-${Date.now()}`,
          name: 'คุณเจ้าหน้าที่ ประสานงาน',
          phone: '089-999-8888',
          email: 'coordinator@newclinic.com',
          note: 'เพื่อยืนยันการใช้บริการ',
        },
      ],
    };

    const updated = [...safeClinics, newClinic];
    onSaveClinics(updated);
    setSelectedId(newId);
    setEditingClinic(newClinic);
    setHasChanges(false);
    setUploadError(null);
  };

  const executeDeleteClinic = (id: string) => {
    if (safeClinics.length <= 1) {
      return;
    }
    const updated = safeClinics.filter(c => c.id !== id);
    onSaveClinics(updated);
    const nextClinic = updated[0];
    if (nextClinic) {
      setSelectedId(nextClinic.id);
      setEditingClinic(ensureClinicDefaults(nextClinic));
      if (activeClinicId === id) {
        onSelectActiveClinic(nextClinic.id);
      }
    }
    setConfirmDeleteClinicId(null);
  };

  const handleSaveCurrent = () => {
    const safeCurrent = ensureClinicDefaults(editingClinic);
    const updated = safeClinics.map(c => (c.id === safeCurrent.id ? safeCurrent : c));
    onSaveClinics(updated);
    setHasChanges(false);
    setSaveSuccessBanner(true);
    setTimeout(() => setSaveSuccessBanner(false), 3000);
  };

  const handleUseThisClinic = () => {
    handleSaveCurrent();
    onSelectActiveClinic(editingClinic.id);
    onClose();
  };

  // Image upload handler with safety and no window.alert
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์รูปภาพไม่ควรเกิน 3 MB');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      if (base64) {
        setEditingClinic({
          ...editingClinic,
          logoUrl: base64,
        });
        setHasChanges(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetLogoToDefault = () => {
    setEditingClinic({
      ...editingClinic,
      logoUrl: '',
    });
    setHasChanges(true);
    setUploadError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">สมุดข้อมูลคลินิกและหัวกระดาษ (Clinic Profiles)</h2>
              <p className="text-xs text-slate-300">
                จัดการข้อมูลหัวกระดาษ อัปโหลดรูปโลโก้ เลขผู้เสียภาษี ใบอนุญาต ที่อยู่ และข้อความเริ่มต้น
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left Column: Clinic List */}
          <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                รายชื่อคลินิกในระบบ ({safeClinics.length})
              </span>
              <button
                onClick={handleAddNewClinic}
                className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-medium py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มคลินิก
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto flex-1">
              {safeClinics.map(c => {
                const isSelected = c.id === selectedId;
                const isActiveInProposal = c.id === activeClinicId;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClinic(c)}
                    className={`p-3 rounded-xl cursor-pointer border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 text-sky-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="font-bold text-sm truncate">{c.shortName || c.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{c.name}</div>
                      {isActiveInProposal && (
                        <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded">
                          หัวกระดาษที่ใช้อยู่ปัจจุบัน
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Save Success Banner */}
            {saveSuccessBanner && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                บันทึกข้อมูลคลินิกเรียบร้อยแล้ว!
              </div>
            )}

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                {uploadError}
              </div>
            )}

            {/* Header preview & quick apply */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                  <ClinicLogo logoUrl={editingClinic.logoUrl} clinicId={editingClinic.id} className="w-full h-full max-h-14" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{editingClinic.name || 'คลินิก'}</h3>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    เลขผู้เสียภาษี: {editingClinic.taxId || '-'} | ใบอนุญาต: {editingClinic.licenseNo || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUseThisClinic}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Check className="w-4 h-4" /> เลือกใช้หัวกระดาษนี้
                </button>
                {safeClinics.length > 1 && (
                  confirmDeleteClinicId === editingClinic.id ? (
                    <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-lg px-2 py-1 text-xs">
                      <span className="text-red-700 font-bold text-[11px]">ลบ?</span>
                      <button
                        onClick={() => executeDeleteClinic(editingClinic.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                      >
                        ใช่
                      </button>
                      <button
                        onClick={() => setConfirmDeleteClinicId(null)}
                        className="text-slate-600 hover:text-slate-900 px-1 text-[10px] cursor-pointer"
                      >
                        ไม่
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteClinicId(editingClinic.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="ลบคลินิกนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  รูปโลโก้ประจำสถานพยาบาล (Logo)
                </label>
                {editingClinic.logoUrl && (
                  <button
                    type="button"
                    onClick={handleResetLogoToDefault}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> ลบรูป / ใช้โลโก้เริ่มต้น BK Lab
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> อัปโหลดรูปโลโก้จากคอมพิวเตอร์ (PNG, JPG, SVG)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <span className="text-xs text-slate-500">หรือวาง URL:</span>
                <input
                  type="text"
                  placeholder="https://... หรือ Data URL"
                  value={editingClinic.logoUrl || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, logoUrl: e.target.value });
                    setHasChanges(true);
                  }}
                  className="flex-1 min-w-[200px] text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-hidden"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อเต็มสถานพยาบาล / คลินิก (แสดงบนหัวเอกสาร) *
                </label>
                <input
                  type="text"
                  value={editingClinic.name || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, name: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อย่อ (สำหรับเรียกในระบบ)
                </label>
                <input
                  type="text"
                  value={editingClinic.shortName || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, shortName: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลขประจำตัวผู้เสียภาษี
                </label>
                <input
                  type="text"
                  value={editingClinic.taxId || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, taxId: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ใบอนุญาตสถานพยาบาลประเภทที่ไม่รับผู้ป่วยไว้ค้างคืนเลขที่
                </label>
                <input
                  type="text"
                  value={editingClinic.licenseNo || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, licenseNo: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ที่อยู่สถานพยาบาล (เลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์)
                </label>
                <input
                  type="text"
                  value={editingClinic.address || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, address: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  value={editingClinic.phone || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, phone: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมล
                </label>
                <input
                  type="text"
                  value={editingClinic.email || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, email: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เว็บไซต์ (เช่น www.bklabhealth.com)
                </label>
                <input
                  type="text"
                  value={editingClinic.website || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, website: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อเรื่องเสนอขายค่าเริ่มต้น (เรื่อง)
                </label>
                <input
                  type="text"
                  value={editingClinic.defaultSubject || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, defaultSubject: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-hidden"
                />
              </div>

              {/* Default Signer & Position */}
              <div className="md:col-span-2 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  ผู้ลงนามเริ่มต้น (ขอแสดงความนับถือ)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={editingClinic.defaultSigner?.name || ''}
                      onChange={e => {
                        setEditingClinic({
                          ...editingClinic,
                          defaultSigner: {
                            name: e.target.value,
                            title: editingClinic.defaultSigner?.title || '',
                          },
                        });
                        setHasChanges(true);
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={editingClinic.defaultSigner?.title || ''}
                      onChange={e => {
                        setEditingClinic({
                          ...editingClinic,
                          defaultSigner: {
                            name: editingClinic.defaultSigner?.name || '',
                            title: e.target.value,
                          },
                        });
                        setHasChanges(true);
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Default Intro Paragraph */}
              <div className="md:col-span-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    ย่อหน้าบรรยายเริ่มต้นเกี่ยวกับคลินิก (ใช้ **คำที่ต้องการทำหนา**)
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={editingClinic.defaultIntroText || ''}
                  onChange={e => {
                    setEditingClinic({ ...editingClinic, defaultIntroText: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg p-3 outline-hidden"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
              >
                ปิด
              </button>
              <button
                onClick={handleSaveCurrent}
                disabled={!hasChanges}
                className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer ${
                  hasChanges
                    ? 'bg-sky-600 hover:bg-sky-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
