import React from 'react';
import { ClinicProfile } from '../types';
import { ClinicLogo } from './ClinicLogo';

interface DocumentHeaderProps {
  clinic: ClinicProfile;
  compact?: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ clinic, compact = false }) => {
  return (
    <div className="relative w-full pb-2.5 border-b border-slate-900 mb-4 select-none min-h-[70px]">
      {/* Clinic Logo on the left */}
      <div className="absolute left-0 top-0 flex-shrink-0">
        <ClinicLogo
          logoUrl={clinic.logoUrl}
          clinicId={clinic.id}
          className={compact ? 'w-18 h-14' : 'w-20 h-16'}
        />
      </div>

      {/* Clinic Info Header - Centered as requested, with 1 tab between name & Tax ID, all bold */}
      <div className="w-full text-center font-bold text-[12px] leading-snug text-slate-950 font-sans tracking-tight px-12">
        {/* Row 1: Clinic Name + 1 Tab (gap-6) + Tax ID */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-0.5 text-[12.5px] font-bold text-slate-950">
          <span>{clinic.name}</span>
          {clinic.taxId && (
            <span className="whitespace-nowrap font-bold text-slate-950">
              เลขประจำตัวผู้เสียภาษี {clinic.taxId}
            </span>
          )}
        </div>

        {/* Row 2: Clinic License Number - Centered */}
        {clinic.licenseNo && (
          <div className="text-center text-[11.5px] mt-0.5 font-bold text-slate-950">
            <span>ใบอนุญาตสถานพยาบาลประเภทที่ไม่รับผู้ป่วยไว้ค้างคืนเลขที่ </span>
            <span className="font-bold">{clinic.licenseNo}</span>
          </div>
        )}

        {/* Row 3: Address - Centered */}
        {clinic.address && (
          <div className="text-center text-[11.5px] mt-0.5 font-bold text-slate-950">
            {clinic.address}
          </div>
        )}

        {/* Row 4: Phone, Email, Website - Centered */}
        <div className="text-center text-[11.5px] mt-0.5 font-bold flex flex-wrap justify-center items-center gap-x-4 gap-y-0.5 text-slate-950">
          {clinic.phone && (
            <span>
              <span>โทรศัพท์</span> {clinic.phone}
            </span>
          )}
          {clinic.email && (
            <span>
              <span>E-mail :</span>{' '}
              <a href={`mailto:${clinic.email}`} className="text-slate-950 hover:underline">
                {clinic.email}
              </a>
            </span>
          )}
          {clinic.website && (
            <a
              href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 font-bold underline hover:text-blue-900"
            >
              {clinic.website}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
