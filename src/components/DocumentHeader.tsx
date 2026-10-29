import React from 'react';
import { ClinicProfile } from '../types';
import { ClinicLogo } from './ClinicLogo';

interface DocumentHeaderProps {
  clinic: ClinicProfile;
  documentNo?: string;
  dateText?: string;
  compact?: boolean;
  showDocMeta?: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  clinic,
  documentNo,
  dateText,
  compact = false,
  showDocMeta = true,
}) => {
  // Strip "สำนักงานใหญ่" if present as requested by the user
  const cleanAddress = (clinic.address || '')
    .replace(/\(?สำนักงานใหญ่\)?/g, '')
    .trim();

  // Strip "เว็บไซต์" prefix if user typed it, keep clean URL
  const cleanWebsite = (clinic.website || '')
    .replace(/^เว็บไซต์\s*:?\s*/i, '')
    .trim();

  return (
    <div
      className={`w-full border-b-2 border-blue-600 select-none ${
        compact ? 'pb-2 mb-3' : 'pb-3 mb-4'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Section: Logo + 1 Tab Spacing + Clinic Details */}
        <div className="flex items-start gap-5 flex-1 min-w-0">
          {/* Logo on the left */}
          <div className="flex-shrink-0 pt-0.5">
            <ClinicLogo
              logoUrl={clinic.logoUrl}
              clinicId={clinic.id}
              className={compact ? 'w-16 h-13' : 'w-20 h-16'}
            />
          </div>

          {/* Clinic Details (Left aligned, with clear 1-tab indent from logo, all lines uniform size) */}
          <div className="flex-1 min-w-0 text-left font-sans pl-1">
            {/* Line 1: Clinic Name (Same font size as Line 2, bold) */}
            <h1 className="text-[12.5px] font-bold text-slate-950 leading-normal">
              {clinic.name}
            </h1>

            {/* Line 2: English Name (Same font size as Line 1 and details, medium uppercase) */}
            {clinic.englishName && (
              <div className="text-[12.5px] text-slate-700 font-medium leading-normal tracking-wide uppercase mt-0.5">
                {clinic.englishName}
              </div>
            )}

            {/* Line 3: Address (without สำนักงานใหญ่, same font size) */}
            {cleanAddress && (
              <div className="text-[12.5px] text-slate-800 leading-normal font-normal mt-0.5">
                {cleanAddress}
              </div>
            )}

            {/* Line 4: Phone & Tax ID on the same line, same font size */}
            <div className="text-[12.5px] text-slate-800 leading-normal font-normal mt-0.5 flex flex-wrap items-center gap-x-5 gap-y-0.5">
              {clinic.phone && (
                <span>
                  <span className="font-semibold text-slate-950">โทรศัพท์:</span> {clinic.phone}
                </span>
              )}
              {clinic.taxId && (
                <span>
                  <span className="font-semibold text-slate-950">เลขประจำตัวผู้เสียภาษี:</span> {clinic.taxId}
                </span>
              )}
            </div>

            {/* Line 5: Email (English) & Website (no prefix) on the same line, same font size */}
            <div className="text-[12.5px] text-slate-800 leading-normal font-normal mt-0.5 flex flex-wrap items-center gap-x-5 gap-y-0.5">
              {clinic.email && (
                <span>
                  <span className="font-semibold text-slate-950">Email:</span>{' '}
                  <span className="text-slate-900">{clinic.email}</span>
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

        {/* Right Section: ใบเสนอราคา (Blue) / QUOTATION / Box with เลขที่ & วันที่ */}
        {showDocMeta && (
          <div className="flex-shrink-0 text-right min-w-[240px] pt-0.5 font-sans">
            <div className="text-[23px] sm:text-[25px] font-bold text-blue-700 tracking-tight leading-none">
              ใบเสนอราคา
            </div>
            <div className="text-[11px] font-bold text-slate-500 tracking-[0.22em] uppercase mt-1 mb-2">
              QUOTATION
            </div>
            {/* Box with เลขที่เอกสาร / No: and วันที่ / Date: as shown in example image 2 */}
            <div className="rounded-xl border border-slate-300 bg-slate-50/70 p-2.5 px-3 text-left text-[12px] shadow-2xs space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600 font-medium">เลขที่เอกสาร / No:</span>
                <span className="font-bold text-slate-950 font-mono tracking-tight text-[12.5px]">
                  {documentNo || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600 font-medium">วันที่ / Date:</span>
                <span className="font-semibold text-slate-900">
                  {dateText || '-'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Compact Right Section on Continuation Pages */}
        {!showDocMeta && compact && documentNo && (
          <div className="flex-shrink-0 text-right font-sans text-[11.5px] text-slate-700 pt-1">
            <div className="text-[13px] font-bold text-blue-700 leading-tight">
              ใบเสนอราคา <span className="text-[10.5px] font-semibold text-slate-500 tracking-wider">QUOTATION</span>
            </div>
            <div className="text-[11px] text-slate-700 font-medium mt-0.5">
              เลขที่เอกสาร / No: <span className="font-bold font-mono text-slate-950">{documentNo}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
