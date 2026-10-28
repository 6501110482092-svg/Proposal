/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ClinicProfile,
  MasterTest,
  PriceTier,
  ProposalDocument,
} from './types';
import {
  DEFAULT_CLINICS,
  DEFAULT_MASTER_TESTS,
  DEFAULT_PRICE_TIERS,
  INITIAL_PROPOSALS,
} from './data/defaultData';
import { HeaderNav } from './components/HeaderNav';
import { ProposalEditor } from './components/ProposalEditor';
import { PrintableDocument } from './components/PrintableDocument';
import { ClinicProfilesModal, ensureClinicDefaults } from './components/ClinicProfilesModal';
import { MasterCatalogModal } from './components/MasterCatalogModal';
import { CloneProposalModal } from './components/CloneProposalModal';
import { ProposalHistoryModal } from './components/ProposalHistoryModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getTodayThaiDate } from './utils/thaiDate';
import { Printer, Eye, Edit3, History, Copy, Plus } from 'lucide-react';

const STORAGE_KEY_PROPOSALS = 'clinic_studio_proposals_v1';
const STORAGE_KEY_CLINICS = 'clinic_studio_clinics_v1';
const STORAGE_KEY_TESTS = 'clinic_studio_tests_v1';
const STORAGE_KEY_TIERS = 'clinic_studio_tiers_v1';
const STORAGE_KEY_ACTIVE_ID = 'clinic_studio_active_id_v1';

export default function App() {
  // 1. State initialization with safe localStorage persistence and schema normalization
  const [proposals, setProposals] = useState<ProposalDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROPOSALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean);
        }
      }
    } catch (e) {
      console.error('Failed to load proposals from localStorage', e);
    }
    return INITIAL_PROPOSALS;
  });

  const [clinics, setClinics] = useState<ClinicProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLINICS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean).map(ensureClinicDefaults);
        }
      }
    } catch (e) {
      console.error('Failed to load clinics from localStorage', e);
    }
    return DEFAULT_CLINICS.map(ensureClinicDefaults);
  });

  const [masterTests, setMasterTests] = useState<MasterTest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean).map(t => ({
            id: t.id || `test-${Date.now()}-${Math.random()}`,
            code: t.code || '',
            name: t.name || 'รายการตรวจ',
            category: t.category || 'ตรวจทั่วไป',
            defaultPricingType: t.defaultPricingType || 'tier',
            tierPrices: t.tierPrices || {},
            fixedPrice: t.fixedPrice || 0,
            flatRateLabel: t.flatRateLabel || '',
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load tests from localStorage', e);
    }
    return DEFAULT_MASTER_TESTS;
  });

  const [tiers, setTiers] = useState<PriceTier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load tiers from localStorage', e);
    }
    return DEFAULT_PRICE_TIERS;
  });

  const [activeProposalId, setActiveProposalId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (saved) return saved;
    } catch (e) {}
    return INITIAL_PROPOSALS[0]?.id || '';
  });

  // View mode
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  // Modals state
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [cloneSourceProposal, setCloneSourceProposal] = useState<ProposalDocument | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(proposals));
    } catch (e) {}
  }, [proposals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLINICS, JSON.stringify(clinics));
    } catch (e) {}
  }, [clinics]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(masterTests));
    } catch (e) {}
  }, [masterTests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TIERS, JSON.stringify(tiers));
    } catch (e) {}
  }, [tiers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeProposalId);
    } catch (e) {}
  }, [activeProposalId]);

  // Active proposal object safely guarded
  const activeProposal: ProposalDocument =
    proposals.find(p => p.id === activeProposalId) || proposals[0] || INITIAL_PROPOSALS[0];

  // Active clinic for the proposal safely guarded
  const activeClinic: ClinicProfile =
    clinics.find(c => c.id === activeProposal?.clinicProfileId) || clinics[0] || DEFAULT_CLINICS[0];

  // Update proposal
  const handleUpdateProposal = (updated: ProposalDocument) => {
    setProposals(prev =>
      prev.map(p => (p.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : p))
    );
  };

  // Update proposal status
  const handleUpdateStatus = (id: string, status: 'draft' | 'sent' | 'approved' | 'completed') => {
    setProposals(prev =>
      prev.map(p => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
    );
  };

  // Delete proposal (confirmation is handled inline in the UI)
  const handleDeleteProposal = (id: string) => {
    if (proposals.length <= 1) {
      return;
    }
    const remaining = proposals.filter(p => p.id !== id);
    setProposals(remaining);
    if (activeProposalId === id) {
      setActiveProposalId(remaining[0].id);
    }
  };

  // Create new blank proposal
  const handleCreateNewProposal = () => {
    const defaultClinic = clinics[0] || DEFAULT_CLINICS[0];
    const newId = `prop-${Date.now()}`;
    const newDoc: ProposalDocument = {
      id: newId,
      documentNo: `BK-QT-${new Date().getFullYear() + 543}-${Math.floor(100 + Math.random() * 900)}`,
      title: 'ใบเสนอราคาใหม่ (ยังไม่ระบุชื่อบริษัท)',
      clinicProfileId: defaultClinic.id,
      dateText: getTodayThaiDate('standard'),
      subject: defaultClinic.defaultSubject || 'ขอเสนอโครงการตรวจสุขภาพเคลื่อนที่ ประจำปี 2569',
      attention: 'ท่านผู้บริหาร **บริษัท ลูกค้าใหม่ จำกัด**',
      introParagraph: defaultClinic.defaultIntroText,
      programs: [
        {
          id: `prog-${Date.now()}-1`,
          title: 'โปรแกรมสุขภาพ สำหรับพนักงานทั่วไป',
          defaultHeadcount: 20,
          colRankLabel: 'ลำดับ',
          colNameLabel: 'โปรแกรมรายการตรวจสุขภาพสำหรับพนักงานทั่วไป',
          colPriceLabel: 'ราคา (บาท)',
          colCountLabel: 'จำนวนคน',
          colTotalLabel: 'รวมราคา',
          items: [],
          showTotalRow: true,
          totalRowLabel: 'รวมราคาโปรแกรมรายการตรวจทั่วไปพนักงาน',
          pageBreakAfter: true,
        },
      ],
      remarks: [...defaultClinic.defaultRemarks],
      serviceConditions: [...defaultClinic.defaultTerms],
      closingParagraph: defaultClinic.defaultClosingText,
      signer: { ...defaultClinic.defaultSigner },
      clientConfirmation: {
        show: true,
        title: 'ยืนยันการใช้บริการ',
        signatureLabel: 'ลงชื่อ.................................................ผู้รับบริการ',
        namePlaceholder: '(.................................................)',
      },
      coordinators: defaultClinic.defaultCoordinators.map(c => ({ ...c })),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProposals(prev => [newDoc, ...prev]);
    setActiveProposalId(newId);
  };

  // Trigger clone modal for a specific proposal
  const handleTriggerClone = (targetProposal?: ProposalDocument) => {
    setCloneSourceProposal(targetProposal || activeProposal);
    setIsCloneModalOpen(true);
  };

  // Handle clone success
  const handleCloneSuccess = (cloned: ProposalDocument) => {
    setProposals(prev => [cloned, ...prev]);
    setActiveProposalId(cloned.id);
  };

  // Export JSON backup
  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      proposals,
      clinics,
      masterTests,
      tiers,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic_quotation_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.proposals && Array.isArray(data.proposals)) {
        setProposals(data.proposals);
        if (data.proposals[0]) {
          setActiveProposalId(data.proposals[0].id);
        }
      }
      if (data.clinics && Array.isArray(data.clinics)) {
        setClinics(data.clinics.map(ensureClinicDefaults));
      }
      if (data.masterTests && Array.isArray(data.masterTests)) {
        setMasterTests(data.masterTests);
      }
      if (data.tiers && Array.isArray(data.tiers)) {
        setTiers(data.tiers);
      }
    } catch (e) {
      console.error('Invalid JSON backup file', e);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="ระบบเสนอราคาพบปัญหาชั่วคราว">
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        {/* Top Navbar */}
        <HeaderNav
          proposals={proposals}
          activeProposalId={activeProposalId}
          onSelectProposal={setActiveProposalId}
          onCreateNewProposal={handleCreateNewProposal}
          onOpenCloneModal={() => handleTriggerClone(activeProposal)}
          onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
          onOpenClinicModal={() => setIsClinicModalOpen(true)}
          onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1920px] w-full mx-auto px-2 sm:px-4 py-4">
          {/* If in Split View: side-by-side on desktop */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left: Editor Panel */}
              <div className="lg:col-span-6 xl:col-span-6 no-print overflow-y-auto max-h-[calc(100vh-80px)] pr-1">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">
                      แผงแก้ไขใบเสนอราคา (Quotation Form)
                    </h2>
                    <p className="text-xs text-slate-500">
                      แก้ไขข้อมูล หัวกระดาษ วันที่ ตาราง และรายการตรวจ
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="text-xs bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" /> ประวัติเสนอขาย ({proposals.length})
                    </button>
                    <button
                      onClick={() => handleTriggerClone(activeProposal)}
                      className="text-xs bg-sky-50 text-sky-800 hover:bg-sky-100 font-semibold px-2.5 py-1.5 rounded-lg border border-sky-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> ทำสำเนา/ปีใหม่
                    </button>
                  </div>
                </div>

                {activeProposal && (
                  <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการโหลดแบบฟอร์มแก้ไข">
                    <ProposalEditor
                      proposal={activeProposal}
                      onChange={handleUpdateProposal}
                      clinics={clinics}
                      masterTests={masterTests}
                      tiers={tiers}
                      onOpenClinicProfiles={() => setIsClinicModalOpen(true)}
                      onOpenMasterCatalog={() => setIsCatalogModalOpen(true)}
                    />
                  </ErrorBoundary>
                )}
              </div>

              {/* Right: Realistic A4 Preview */}
              <div className="lg:col-span-6 xl:col-span-6 bg-slate-200/80 rounded-2xl p-4 overflow-y-auto max-h-[calc(100vh-80px)] border border-slate-300/80 shadow-inner flex flex-col items-center">
                <div className="w-full max-w-[210mm] mb-3 flex items-center justify-between text-xs text-slate-600 no-print">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-sky-700" />
                    ตัวอย่างเอกสาร A4 เสมือนจริง (เหมือนพิมพ์จริง 100%)
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> พิมพ์เอกสาร / บันทึก PDF
                  </button>
                </div>

                {activeProposal && activeClinic && (
                  <div className="w-full flex justify-center">
                    <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงเอกสาร A4">
                      <PrintableDocument
                        proposal={activeProposal}
                        clinic={activeClinic}
                      />
                    </ErrorBoundary>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* If in Edit-Only View */}
          {viewMode === 'edit' && (
            <div className="max-w-4xl mx-auto no-print">
              {activeProposal && (
                <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการโหลดแบบฟอร์มแก้ไข">
                  <ProposalEditor
                    proposal={activeProposal}
                    onChange={handleUpdateProposal}
                    clinics={clinics}
                    masterTests={masterTests}
                    tiers={tiers}
                    onOpenClinicProfiles={() => setIsClinicModalOpen(true)}
                    onOpenMasterCatalog={() => setIsCatalogModalOpen(true)}
                  />
                </ErrorBoundary>
              )}
            </div>
          )}

          {/* If in Preview-Only View */}
          {viewMode === 'preview' && (
            <div className="w-full flex flex-col items-center py-2">
              <div className="w-full max-w-[210mm] mb-4 flex items-center justify-between no-print">
                <span className="text-sm font-semibold text-slate-700">
                  มุมมองหน้าเอกสาร A4 เตรียมพิมพ์
                </span>
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> พิมพ์หรือบันทึกเป็น PDF
                </button>
              </div>

              {activeProposal && activeClinic && (
                <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงเอกสาร A4">
                  <PrintableDocument
                    proposal={activeProposal}
                    clinic={activeClinic}
                  />
                </ErrorBoundary>
              )}
            </div>
          )}
        </main>

        {/* Modals wrapped in ErrorBoundary so a modal issue can never crash the parent app */}
        {/* 1. Clinic Profiles Manager */}
        <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการเปิดสมุดบริษัทคลินิก">
          <ClinicProfilesModal
            isOpen={isClinicModalOpen}
            onClose={() => setIsClinicModalOpen(false)}
            clinics={clinics}
            onSaveClinics={setClinics}
            activeClinicId={activeProposal?.clinicProfileId || clinics[0]?.id}
            onSelectActiveClinic={clinicId => {
              if (activeProposal) {
                handleUpdateProposal({
                  ...activeProposal,
                  clinicProfileId: clinicId,
                });
              }
            }}
          />
        </ErrorBoundary>

        {/* 2. Master Catalog & 4 Tiers Manager */}
        <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการเปิดคลังรายการตรวจ">
          <MasterCatalogModal
            isOpen={isCatalogModalOpen}
            onClose={() => setIsCatalogModalOpen(false)}
            tiers={tiers}
            onSaveTiers={setTiers}
            tests={masterTests}
            onSaveTests={setMasterTests}
          />
        </ErrorBoundary>

        {/* 3. Fast Duplicate / Clone Proposal Modal */}
        {isCloneModalOpen && (cloneSourceProposal || activeProposal) && (
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการทำสำเนา">
            <CloneProposalModal
              isOpen={true}
              onClose={() => {
                setIsCloneModalOpen(false);
                setCloneSourceProposal(null);
              }}
              sourceProposal={cloneSourceProposal || activeProposal}
              tiers={tiers}
              masterTests={masterTests}
              onCloneSuccess={handleCloneSuccess}
            />
          </ErrorBoundary>
        )}

        {/* 4. Proposal History & Archive Modal */}
        <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการเปิดประวัติการเสนอขาย">
          <ProposalHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            proposals={proposals}
            clinics={clinics}
            activeProposalId={activeProposalId}
            onSelectProposal={setActiveProposalId}
            onCloneProposal={p => {
              setIsHistoryModalOpen(false);
              handleTriggerClone(p);
            }}
            onDeleteProposal={handleDeleteProposal}
            onUpdateStatus={handleUpdateStatus}
            onCreateNew={handleCreateNewProposal}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
