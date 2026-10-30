import React from 'react';
import { ClinicProfile } from '../types';
import { ClinicLogo } from './ClinicLogo';

interface DocumentHeaderProps {
  clinic: ClinicProfile;
  documentNo?: string;
  dateText?: string;
  compact?: boolean;
  showDocMeta?: boolean;
  headerStyle?: 'minimal' | 'official';
  docType?: 'quotation' | 'amendment';
  amendmentDocTitle?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  clinic,
  documentNo,
  dateText,
  compact = false,
  showDocMeta = true,
  headerStyle = 'minimal',
  docType = 'quotation',
  amendmentDocTitle,
}) => {
  // Strip "สำนักงานใหญ่" if present as requested by the user
  const cleanAddress = (clinic.address || '')
    .replace(/\(?สำนักงานใหญ่\)?/g, '')
    .trim();

  // Strip "เว็บไซต์" prefix if user typed it, keep clean URL
  const cleanWebsite = (clinic.website || '')
    .replace(/^เว็บไซต์\s*:?\s*/i, '')
    .trim();

  const isAmendment = docType === 'amendment';
  const mainTitle = isAmendment
    ? (amendmentDocTitle || 'ใบปรับปรุงรายละเอียดรายการตรวจสุขภาพและข้อตกลงการให้บริการ')
    : 'ใบเสนอราคา';
  const subTitle = isAmendment ? 'CONTRACT AMENDMENT' : 'QUOTATION';

  const isOfficial = headerStyle === 'official';

  return (
    <div
      className={`w-full border-b-2 border-blue-600 select-none ${
        compact ? 'pb-2 mb-3' : 'pb-2 mb-3'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Section: Logo + Spacing + Clinic Details (1 line each) */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-1">
          {/* Logo on the left */}
          <div className="flex-shrink-0 pt-0.5">
            <ClinicLogo
              logoUrl={clinic.logoUrl}
              clinicId={clinic.id}
              className="w-16 h-14"
            />
          </div>

          {/* Clinic Details (Left aligned, each item strictly on its own line) */}
          <div className="flex-1 min-w-0 text-left font-sans">
            {/* Line 1: Clinic Name (Bold, 12px) */}
            <h1 className="text-[12px] font-bold text-slate-950 leading-tight whitespace-nowrap">
              {clinic.name}
            </h1>

            {/* Line 2: English Name (Medium, 11px, uppercase) */}
            {clinic.englishName && (
              <div className="text-[11px] text-slate-700 font-medium leading-tight tracking-wide uppercase mt-0.5 whitespace-nowrap">
                {clinic.englishName}
              </div>
            )}

            {/* Line 3: Address (11px, single line) */}
            {cleanAddress && (
              <div className="text-[11px] text-slate-800 leading-tight font-normal mt-0.5 whitespace-nowrap">
                {cleanAddress}
              </div>
            )}

            {/* Line 4: Phone & Tax ID on the same single line */}
            <div className="text-[11px] text-slate-800 leading-tight font-normal mt-0.5 flex items-center gap-x-4 whitespace-nowrap">
              {clinic.phone && (
                <span>
                  <span className="font-normal text-slate-800">โทรศัพท์:</span> {clinic.phone}
                </span>
              )}
              {clinic.taxId && (
                <span>
                  <span className="font-normal text-slate-800">เลขประจำตัวผู้เสียภาษี:</span> {clinic.taxId}
                </span>
              )}
            </div>

            {/* Line 5: Email (English) & Website (no prefix) on the same single line */}
            <div className="text-[11px] text-slate-800 leading-tight font-normal mt-0.5 flex items-center gap-x-4 whitespace-nowrap">
              {clinic.email && (
                <span>
                  <span className="font-normal text-slate-800">Email:</span>{' '}
                  <span className="text-slate-800">{clinic.email}</span>
                </span>
              )}
              {cleanWebsite && (
                <span>
                  <a
                    href={cleanWebsite.startsWith('http') ? cleanWebsite : `https://${cleanWebsite}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline font-medium hover:text-blue-900"
                  >
                    {cleanWebsite}
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Minimal Header Style (with Box) */}
        {!isOfficial && showDocMeta && (
          <div className="flex-shrink-0 text-right min-w-[165px] max-w-[240px] pt-0.5 font-sans">
            <div className={`font-bold text-blue-700 tracking-tight leading-snug ${isAmendment ? 'text-[14px]' : 'text-[20px]'}`}>
              {mainTitle}
            </div>
            <div className="text-[9.5px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5 mb-1.5">
              {subTitle}
            </div>
            {/* Compact Box */}
            <div className="rounded-lg border border-slate-300 bg-slate-50/70 py-1.5 px-2.5 text-left text-[11.5px] shadow-2xs space-y-0.5">
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-slate-600 font-medium whitespace-nowrap">เลขที่:</span>
                <span className="font-bold text-slate-950 font-mono text-[12px] whitespace-nowrap">
                  {documentNo || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-slate-600 font-medium whitespace-nowrap">วันที่:</span>
                <span className="font-semibold text-slate-900 text-[11.5px] whitespace-nowrap">
                  {dateText || '-'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right Section: Official Header Style (Clean without box, title only) */}
        {isOfficial && (
          <div className="flex-shrink-0 text-right min-w-[160px] pt-1 font-sans">
            <div className={`font-bold text-blue-700 tracking-tight leading-snug ${isAmendment ? 'text-[14px]' : 'text-[22px]'}`}>
              {mainTitle}
            </div>
            <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">
              {subTitle}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
