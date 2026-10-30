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
import { DashboardView } from './components/DashboardView';
import { ProposalEditor } from './components/ProposalEditor';
import { PrintableDocument } from './components/PrintableDocument';
import { ClinicProfilesModal, ensureClinicDefaults } from './components/ClinicProfilesModal';
import { MasterCatalogModal } from './components/MasterCatalogModal';
import { CloneProposalModal } from './components/CloneProposalModal';
import { ProposalHistoryModal } from './components/ProposalHistoryModal';
import { DocumentPickerModal } from './components/DocumentPickerModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getTodayThaiDate } from './utils/thaiDate';
import { generateCompanyDocNumber } from './utils/docNumber';
import { savePersistentItem, loadPersistentItem } from './utils/persistentStorage';
import {
  Printer,
  Eye,
  Edit3,
  History,
  Copy,
  Plus,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

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

  // View mode defaults to 'dashboard' so users immediately see their sales overview and proposal history!
  const [viewMode, setViewMode] = useState<'dashboard' | 'split' | 'edit' | 'preview'>('dashboard');

  // Modals state
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDocPickerModalOpen, setIsDocPickerModalOpen] = useState(false);
  const [cloneSourceProposal, setCloneSourceProposal] = useState<ProposalDocument | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Hydrate from IndexedDB on initial mount if available
  useEffect(() => {
    let mounted = true;
    async function hydrateStorage() {
      try {
        const savedProps = await loadPersistentItem<ProposalDocument[] | null>(STORAGE_KEY_PROPOSALS, null);
        if (mounted && Array.isArray(savedProps) && savedProps.length > 0) {
          setProposals(savedProps.filter(Boolean));
        }
        const savedClinics = await loadPersistentItem<ClinicProfile[] | null>(STORAGE_KEY_CLINICS, null);
        if (mounted && Array.isArray(savedClinics) && savedClinics.length > 0) {
          setClinics(savedClinics.filter(Boolean).map(ensureClinicDefaults));
        }
        const savedTests = await loadPersistentItem<MasterTest[] | null>(STORAGE_KEY_TESTS, null);
        if (mounted && Array.isArray(savedTests) && savedTests.length > 0) {
          setMasterTests(savedTests);
        }
      } catch (e) {
        console.warn('IndexedDB initial load note:', e);
      }
    }
    hydrateStorage();
    return () => {
      mounted = false;
    };
  }, []);

  // Dual sync to IndexedDB and LocalStorage
  useEffect(() => {
    savePersistentItem(STORAGE_KEY_PROPOSALS, proposals);
  }, [proposals]);

  useEffect(() => {
    savePersistentItem(STORAGE_KEY_CLINICS, clinics);
  }, [clinics]);

  useEffect(() => {
    savePersistentItem(STORAGE_KEY_TESTS, masterTests);
  }, [masterTests]);

  useEffect(() => {
    savePersistentItem(STORAGE_KEY_TIERS, tiers);
  }, [tiers]);

  useEffect(() => {
    savePersistentItem(STORAGE_KEY_ACTIVE_ID, activeProposalId);
  }, [activeProposalId]);

  // Reactive auto-sync: Whenever masterTests changes or loads, propagate updated test names & newlines into proposals
  useEffect(() => {
    if (!Array.isArray(masterTests) || masterTests.length === 0) return;
    if (!Array.isArray(proposals) || proposals.length === 0) return;

    const testMap = new Map<string, MasterTest>();
    masterTests.forEach(t => testMap.set(t.id, t));

    let anyProposalChanged = false;
    const syncedProposals = proposals.map(prop => {
      let proposalChanged = false;
      const newPrograms = prop.programs.map(prog => {
        const newItems = prog.items.map(item => {
          let matchedTest: MasterTest | undefined;
          if (item.testId && testMap.has(item.testId)) {
            matchedTest = testMap.get(item.testId);
          } else {
            const normItem = (item.name || '').replace(/[\r\n\s]+/g, ' ').trim();
            matchedTest = masterTests.find(
              t => (t.name || '').replace(/[\r\n\s]+/g, ' ').trim() === normItem
            );
          }

          if (matchedTest && matchedTest.name && matchedTest.name !== item.name) {
            proposalChanged = true;
            return {
              ...item,
              testId: matchedTest.id,
              name: matchedTest.name,
              flatRateLabel: matchedTest.flatRateLabel || item.flatRateLabel,
            };
          }
          return item;
        });
        return { ...prog, items: newItems };
      });

      if (proposalChanged) {
        anyProposalChanged = true;
        return { ...prop, programs: newPrograms };
      }
      return prop;
    });

    if (anyProposalChanged) {
      setProposals(syncedProposals);
    }
  }, [masterTests]);

  // Explicit manual save handler
  const handleManualSave = async () => {
    setSaveStatus('saving');
    try {
      await Promise.all([
        savePersistentItem(STORAGE_KEY_PROPOSALS, proposals),
        savePersistentItem(STORAGE_KEY_CLINICS, clinics),
        savePersistentItem(STORAGE_KEY_TESTS, masterTests),
        savePersistentItem(STORAGE_KEY_TIERS, tiers),
        savePersistentItem(STORAGE_KEY_ACTIVE_ID, activeProposalId),
      ]);
    } catch (e) {
      console.error('Error during manual save', e);
    } finally {
      setTimeout(() => setSaveStatus('saved'), 600);
    }
  };

  // Quick logo update for a clinic
  const handleUpdateClinicLogo = (clinicId: string, logoUrl: string) => {
    setClinics(prev =>
      prev.map(c => (c.id === clinicId ? { ...c, logoUrl } : c))
    );
  };

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

  // Save master tests and sync formatted names & newlines into proposals
  const handleSaveMasterTests = (updatedTests: MasterTest[]) => {
    setMasterTests(updatedTests);

    setProposals(prevProposals => {
      const testMap = new Map<string, MasterTest>();
      updatedTests.forEach(t => testMap.set(t.id, t));

      return prevProposals.map(prop => {
        let proposalChanged = false;
        const newPrograms = prop.programs.map(prog => {
          const newItems = prog.items.map(item => {
            let matchedTest: MasterTest | undefined;
            if (item.testId && testMap.has(item.testId)) {
              matchedTest = testMap.get(item.testId);
            } else {
              const normItem = (item.name || '').replace(/[\r\n\s]+/g, ' ').trim();
              matchedTest = updatedTests.find(
                t => (t.name || '').replace(/[\r\n\s]+/g, ' ').trim() === normItem
              );
            }

            if (matchedTest && matchedTest.name && matchedTest.name !== item.name) {
              proposalChanged = true;
              return {
                ...item,
                testId: matchedTest.id,
                name: matchedTest.name,
                flatRateLabel: matchedTest.flatRateLabel || item.flatRateLabel,
              };
            }
            return item;
          });
          return { ...prog, items: newItems };
        });

        if (proposalChanged) {
          return { ...prop, programs: newPrograms, updatedAt: new Date().toISOString() };
        }
        return prop;
      });
    });
  };

  // Update proposal status
  const handleUpdateStatus = (
    id: string,
    status: 'draft' | 'sent' | 'confirmed' | 'rejected' | 'approved' | 'completed'
  ) => {
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

  // Create new blank proposal with company-specific sequential doc number
  const handleCreateNewProposal = (preferredClinicId?: string) => {
    const targetClinic =
      (preferredClinicId ? clinics.find(c => c.id === preferredClinicId) : null) ||
      clinics[0] ||
      DEFAULT_CLINICS[0];
    const newId = `prop-${Date.now()}`;
    const newDocNo = generateCompanyDocNumber(targetClinic, proposals);

    const newDoc: ProposalDocument = {
      id: newId,
      documentNo: newDocNo,
      title: 'ใบเสนอราคาใหม่ (ยังไม่ระบุชื่อบริษัท)',
      clinicProfileId: targetClinic.id,
      dateText: getTodayThaiDate('standard'),
      subject: targetClinic.defaultSubject || 'ขอเสนอโครงการตรวจสุขภาพเคลื่อนที่ ประจำปี 2569',
      attention: 'ท่านผู้บริหาร **บริษัท ลูกค้าใหม่ จำกัด**',
      introParagraph: targetClinic.defaultIntroText,
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
      remarks: [...targetClinic.defaultRemarks],
      serviceConditions: [...targetClinic.defaultTerms],
      closingParagraph: targetClinic.defaultClosingText,
      signer: { ...targetClinic.defaultSigner },
      clientConfirmation: {
        show: true,
        title: 'ยืนยันการใช้บริการ',
        signatureLabel: 'ลงชื่อ.................................................ผู้รับบริการ',
        namePlaceholder: '(.................................................)',
      },
      coordinators: targetClinic.defaultCoordinators.map(c => ({ ...c })),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProposals(prev => [newDoc, ...prev]);
    setActiveProposalId(newId);
    // Switch to edit mode when creating a new proposal
    setViewMode('split');
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
    setViewMode('split');
  };

  // Create Contract Amendment (โหมดปรับปรุงสัญญา)
  const handleCreateAmendment = (sourceProposal: ProposalDocument) => {
    const newId = `prop-${Date.now()}`;
    const amendedDoc: ProposalDocument = {
      ...JSON.parse(JSON.stringify(sourceProposal)),
      id: newId,
      docType: 'amendment',
      amendmentDocTitle: 'ใบเสนอราคา',
      title: `[ใบปรับปรุงสัญญา] ${sourceProposal.title || sourceProposal.documentNo}`,
      documentNo: `${sourceProposal.documentNo || 'QT'}-AMD`,
      dateText: getTodayThaiDate('standard'),
      subject: `ขอปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ ประจำปี 2569`,
      programs: sourceProposal.programs.map(prog => ({
        ...prog,
        colOriginalPriceLabel: 'ใบเสนอราคาเดิม',
        colAmendmentLabel: 'เอกสารปรับปรุง',
        items: prog.items.map(item => ({
          ...item,
          originalUnitPrice: item.originalUnitPrice !== undefined ? item.originalUnitPrice : item.unitPrice,
          originalFlatRateLabel: item.originalFlatRateLabel !== undefined ? item.originalFlatRateLabel : item.flatRateLabel,
          originalPricingType: item.originalPricingType !== undefined ? item.originalPricingType : item.pricingType,
          amendmentStatus: item.amendmentStatus || 'included',
          amendmentPriceType: item.amendmentPriceType || 'original',
          amendmentCustomPrice: item.amendmentCustomPrice !== undefined ? item.amendmentCustomPrice : item.unitPrice,
        })),
      })),
      remarks: [
        'การแก้ไขและปรับปรุงรายละเอียดรายการตรวจสุขภาพและราคาข้างต้น เป็นข้อตกลงร่วมกันระหว่างทั้งสองฝ่าย',
        ...(sourceProposal.remarks || []),
      ],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProposals(prev => [amendedDoc, ...prev]);
    setActiveProposalId(newId);
    setViewMode('split');
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
          saveStatus={saveStatus}
          onOpenDocPicker={() => setIsDocPickerModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1920px] w-full mx-auto px-3 sm:px-6 py-5">
          {/* 1. Main Dashboard View (Default Home Page) */}
          {viewMode === 'dashboard' && (
            <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผลแดชบอร์ด">
              <DashboardView
                proposals={proposals}
                clinics={clinics}
                activeProposalId={activeProposalId}
                onSelectProposal={setActiveProposalId}
                onOpenEditor={id => {
                  setActiveProposalId(id);
                  setViewMode('split');
                }}
                onOpenPreview={id => {
                  setActiveProposalId(id);
                  setViewMode('preview');
                }}
                onCreateNewProposal={handleCreateNewProposal}
                onOpenCloneModal={p => handleTriggerClone(p)}
                onDeleteProposal={handleDeleteProposal}
                onUpdateStatus={handleUpdateStatus}
                onOpenClinicProfiles={() => setIsClinicModalOpen(true)}
                onOpenMasterCatalog={() => setIsCatalogModalOpen(true)}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onCreateAmendment={handleCreateAmendment}
              />
            </ErrorBoundary>
          )}

          {/* 2. Split View: Editor + Realistic A4 Preview side-by-side */}
          {viewMode === 'split' && (
            <div>
              {/* Return to Dashboard bar */}
              <div className="mb-4 flex items-center justify-between no-print">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-sky-700 bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-sky-600" />
                  <span>กลับหน้าแดชบอร์ดภาพรวม & ประวัติ</span>
                </button>
                <div className="text-xs text-slate-500 font-medium">
                  กำลังแก้ไข: <strong className="text-slate-800">{activeProposal.title || activeProposal.documentNo}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start print:block print:w-full">
                {/* Left: Editor Panel */}
                <div className="lg:col-span-6 xl:col-span-6 no-print overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
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
                        onUpdateClinicLogo={handleUpdateClinicLogo}
                        allProposals={proposals}
                        onSave={handleManualSave}
                      />
                    </ErrorBoundary>
                  )}
                </div>

                {/* Right: Realistic A4 Preview */}
                <div className="lg:col-span-6 xl:col-span-6 bg-slate-200/80 rounded-2xl p-4 overflow-y-auto max-h-[calc(100vh-120px)] border border-slate-300/80 shadow-inner flex flex-col items-center print:bg-white print:border-none print:shadow-none print:p-0 print:max-h-none print:overflow-visible print:w-full print:block">
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
                    <div className="w-full flex justify-center print:block print:w-full">
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
            </div>
          )}

          {/* 3. Edit-Only View */}
          {viewMode === 'edit' && (
            <div className="max-w-4xl mx-auto no-print">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-sky-700 bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-sky-600" />
                  <span>กลับหน้าแดชบอร์ดภาพรวม & ประวัติ</span>
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> ดูตัวอย่างพิมพ์ A4
                </button>
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
                    onUpdateClinicLogo={handleUpdateClinicLogo}
                    allProposals={proposals}
                    onSave={handleManualSave}
                  />
                </ErrorBoundary>
              )}
            </div>
          )}

          {/* 4. Preview-Only View */}
          {viewMode === 'preview' && (
            <div className="w-full flex flex-col items-center py-2 print:py-0 print:block print:w-full">
              <div className="w-full max-w-[210mm] mb-4 flex items-center justify-between no-print">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-sky-700 bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-sky-600" />
                  <span>กลับหน้าแดชบอร์ดภาพรวม & ประวัติ</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('split')}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-sky-600" /> แก้ไขเอกสารนี้
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> พิมพ์หรือบันทึกเป็น PDF
                  </button>
                </div>
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

        {/* Modals wrapped in ErrorBoundary */}
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
            onSaveTests={handleSaveMasterTests}
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

        {/* 5. Document Picker Modal (Triggered from 'แก้ไขเอกสาร & A4' or navbar) */}
        <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการเลือกเอกสาร">
          <DocumentPickerModal
            isOpen={isDocPickerModalOpen}
            onClose={() => setIsDocPickerModalOpen(false)}
            proposals={proposals}
            clinics={clinics}
            activeProposalId={activeProposalId}
            onSelectAndEdit={id => {
              setActiveProposalId(id);
              setViewMode('split');
            }}
            onSelectAndPreview={id => {
              setActiveProposalId(id);
              setViewMode('preview');
            }}
            onCreateNew={() => handleCreateNewProposal()}
            onCreateAmendment={handleCreateAmendment}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
