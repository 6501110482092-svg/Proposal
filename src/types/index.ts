export interface PriceTier {
  id: string;
  name: string;
  min: number;
  max: number | null; // null means unbounded (e.g. 101+)
}

export interface MasterTest {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultPricingType: 'tier' | 'fixed' | 'free' | 'unpriced';
  fixedPrice?: number;
  flatRateLabel?: string; // e.g. "เหมาจ่าย 12,000 บาท"
  tierPrices: {
    [tierId: string]: number;
  };
  note?: string;
}

export interface ClinicProfile {
  id: string;
  name: string;
  englishName?: string;
  shortName: string;
  docPrefix?: string; // e.g. "BK", "NN", "MC"
  logoUrl?: string; // Image URL or Base64 data
  taxId: string;
  licenseNo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  
  // Defaults when this clinic is chosen for a proposal
  defaultSubject: string;
  defaultIntroText: string;
  defaultRemarks: string[];
  defaultTerms: string[];
  defaultClosingText: string;
  defaultSigner: {
    name: string;
    title: string;
  };
  defaultCoordinators: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    note?: string;
  }[];
}

export interface ProposalItem {
  id: string;
  testId?: string;
  orderNumber: number;
  name: string;
  pricingType: 'tier' | 'fixed' | 'free' | 'unpriced';
  unitPrice: number;
  flatRateLabel?: string; // e.g. "เหมาจ่าย 12,000 บาท"
  headcount: number;
  isCustomHeadcount: boolean; // if true, uses custom headcount instead of table default
  totalPrice: number;
  note?: string;

  // Contract Amendment Mode fields (ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ)
  originalUnitPrice?: number; // ราคาเดิมจากใบเสนอราคา
  originalFlatRateLabel?: string;
  originalPricingType?: 'tier' | 'fixed' | 'free' | 'unpriced';
  amendmentStatus?: 'included' | 'excluded'; // 'included' = "มี" (รับบริการ), 'excluded' = "ไม่มี" (ไม่รับบริการ)
  amendmentPriceType?: 'original' | 'custom'; // 'original' = ราคาเดิม, 'custom' = ใส่ราคาใหม่
  amendmentCustomPrice?: number; // ราคาใหม่กรณีใส่ราคาใหม่
  amendmentCustomFlatRateLabel?: string;
}

export interface ProposalProgram {
  id: string;
  title: string;
  defaultHeadcount: number;
  
  // Customizable table headers
  colRankLabel: string;      // default: "ลำดับ"
  colNameLabel: string;      // default: "โปรแกรมรายการตรวจสุขภาพสำหรับพนักงานทั่วไป"
  colPriceLabel: string;     // default: "ราคา (บาท)"
  colCountLabel: string;     // default: "จำนวนคน"
  colTotalLabel: string;     // default: "รวมราคา (บาท)"

  // Amendment table column headers
  colOriginalPriceLabel?: string; // default: "ใบเสนอราคาเดิม"
  colAmendmentLabel?: string;     // default: "เอกสารปรับปรุง"
  
  items: ProposalItem[];
  
  // Total summary row
  showTotalRow: boolean;
  totalRowLabel: string;     // default: "รวมราคาโปรแกรมรายการตรวจทั่วไปพนักงาน"
  totalPriceOverride?: number;
  thaiBahtTextOverride?: string;
  
  // Note specific to this program table (e.g. "**และราคาตรวจเพิ่มเติมเป็นราคาผู้ตรวจรายบุคคล...")
  tableNote?: string;
  pageBreakAfter?: boolean;  // forces a page break after this program
}

export interface ProposalDocument {
  id: string;
  documentNo: string;
  title: string;             // Internal nickname for proposal list, e.g. "เจริญสุข ฟาร์มา - ตรวจสุขภาพประจำปี 2569"
  clinicProfileId: string;

  // Document Type: Normal Quotation vs Contract Amendment (ใบปรับปรุงสัญญา)
  docType?: 'quotation' | 'amendment';
  amendmentDocTitle?: string; // e.g. "ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ"
  
  // Header Style: 'minimal' (with right box) vs 'official' (date & docNo on same line above subject)
  headerStyle?: 'minimal' | 'official';
  
  // Header details
  dateText: string;          // e.g. "20 ตุลาคม 2569"
  subject: string;           // "เรื่อง" e.g. "ขอเสนอโครงการตรวจสุขภาพเคลื่อนที่ ประจำปี 2569"
  attention: string;         // "เรียน" e.g. "ท่านผู้บริหาร **บริษัท เจริญสุข ฟาร์มา ซัพพลาย จำกัด**"
  introParagraph: string;    // Introduction paragraph
  
  // Programs & Tables
  programs: ProposalProgram[];
  
  // Remarks & Conditions
  remarks: string[];
  serviceConditions: string[];
  closingParagraph: string;
  
  // Sign-off
  signer: {
    name: string;
    title: string;
  };
  
  // Client confirmation section
  clientConfirmation: {
    show: boolean;
    title: string;
    signatureLabel: string;
    namePlaceholder: string;
  };
  
  // Coordinators box
  coordinators: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    note?: string;
  }[];
  
  // Styling options (excluding header)
  bodyTextColor?: 'black' | 'gray' | 'copy-blue' | string;
  boldTextColor?: 'inherit' | 'black' | 'copy-blue' | string;
  syncTableBorderColor?: boolean;
  tableBorderColor?: string;

  status: 'draft' | 'sent' | 'confirmed' | 'rejected' | 'approved' | 'completed';
  createdAt: string;
  updatedAt: string;
}
