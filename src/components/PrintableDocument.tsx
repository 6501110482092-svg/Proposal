import React from 'react';
import { ClinicProfile, ProposalDocument, ProposalProgram } from '../types';
import { DocumentHeader } from './DocumentHeader';
import { renderFormattedThaiText } from '../utils/richText';
import { bahttext } from '../utils/bahttext';

interface PrintableDocumentProps {
  proposal: ProposalDocument;
  clinic: ClinicProfile;
  previewMode?: 'multi-page' | 'continuous';
}

export const PrintableDocument: React.FC<PrintableDocumentProps> = ({
  proposal,
  clinic,
  previewMode = 'multi-page',
}) => {
  // 1. Resolve body text color (excluding header)
  const getResolvedTextColor = (): string => {
    switch (proposal.bodyTextColor) {
      case 'copy-blue':
        return '#1e40af'; // Classic carbon copy / typewriter stencil blue
      case 'gray':
        return '#4b5563'; // Charcoal gray
      case 'black':
        return '#0f172a';
      default:
        if (proposal.bodyTextColor && proposal.bodyTextColor.startsWith('#')) {
          return proposal.bodyTextColor;
        }
        return '#0f172a';
    }
  };

  const resolvedTextColor = getResolvedTextColor();

  // 2. Resolve bold text color (defaults to match text color unless specifically set)
  const getResolvedBoldColor = (): string => {
    if (!proposal.boldTextColor || proposal.boldTextColor === 'inherit') {
      return resolvedTextColor;
    }
    switch (proposal.boldTextColor) {
      case 'black':
        return '#000000';
      case 'copy-blue':
        return '#172554'; // Deep navy blue for bold
      default:
        if (proposal.boldTextColor.startsWith('#')) {
          return proposal.boldTextColor;
        }
        return resolvedTextColor;
    }
  };

  const resolvedBoldColor = getResolvedBoldColor();

  // 3. Resolve table border color (sync with text color if requested)
  const resolvedBorderColor = proposal.syncTableBorderColor
    ? resolvedTextColor
    : proposal.tableBorderColor || '#0f172a';

  const bodyStyle: React.CSSProperties = {
    color: resolvedTextColor,
  };

  const cellBorderStyle: React.CSSProperties = {
    borderColor: resolvedBorderColor,
  };

  // Calculate total price of a program
  const calculateProgramTotal = (prog: ProposalProgram): number => {
    if (prog.totalPriceOverride !== undefined && prog.totalPriceOverride !== null) {
      return prog.totalPriceOverride;
    }
    return prog.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  // Helper to render a table program
  const renderProgramTable = (prog: ProposalProgram, index: number) => {
    const totalAmount = calculateProgramTotal(prog);
    const thaiBaht = prog.thaiBahtTextOverride || bahttext(totalAmount);

    return (
      <div key={prog.id || index} className="mb-5 avoid-break" style={bodyStyle}>
        {/* Program Title */}
        {prog.title && (
          <h3
            className="font-bold text-[14.5px] mb-1.5 underline underline-offset-4 decoration-1"
            style={{ color: resolvedBoldColor }}
          >
            {prog.title}
          </h3>
        )}

        {/* Program Table */}
        <table
          className="doc-table text-[13px] border-collapse w-full mb-1"
          style={{ borderColor: resolvedBorderColor, border: `1px solid ${resolvedBorderColor}` }}
        >
          <thead>
            <tr className="bg-slate-100/70 font-bold text-center">
              <th
                className="py-1 px-1.5 w-12 text-center"
                style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
              >
                {prog.colRankLabel || 'ลำดับ'}
              </th>
              <th
                className="py-1 px-2.5 text-left"
                style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
              >
                {prog.colNameLabel || 'โปรแกรมรายการตรวจสุขภาพ'}
              </th>
              <th
                className="py-1 px-2 w-28 text-center whitespace-nowrap"
                style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
              >
                {prog.colPriceLabel || 'ราคา (บาท)'}
              </th>
              <th
                className="py-1 px-2 w-20 text-center whitespace-nowrap"
                style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
              >
                {prog.colCountLabel || 'จำนวนคน'}
              </th>
              <th
                className="py-1 px-2 w-28 text-center whitespace-nowrap"
                style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
              >
                {prog.colTotalLabel || 'รวมราคา'}
              </th>
            </tr>
          </thead>
          <tbody>
            {prog.items.map((item, itemIdx) => {
              // Format price display
              let priceDisplay: string = '-';
              if (item.pricingType === 'fixed' && item.flatRateLabel) {
                priceDisplay = item.flatRateLabel;
              } else if (item.pricingType === 'free') {
                priceDisplay = item.flatRateLabel || 'ฟรี';
              } else if (item.pricingType === 'unpriced') {
                priceDisplay = item.unitPrice ? item.unitPrice.toLocaleString() : '-';
              } else if (item.unitPrice > 0) {
                priceDisplay = item.unitPrice.toLocaleString();
              }

              // Headcount display
              const countDisplay =
                item.pricingType === 'unpriced' && item.headcount === 0
                  ? '-'
                  : item.pricingType === 'fixed' && !item.headcount
                  ? '-'
                  : item.headcount
                  ? item.headcount.toLocaleString()
                  : '-';

              // Total display
              let totalDisplay = '-';
              if (item.pricingType === 'fixed' && item.flatRateLabel?.includes('เหมาจ่าย') && !item.totalPrice) {
                totalDisplay = '-';
              } else if (item.totalPrice > 0) {
                totalDisplay = item.totalPrice.toLocaleString();
              } else if (item.pricingType === 'free') {
                totalDisplay = '-';
              }

              return (
                <tr key={item.id || itemIdx} className="hover:bg-slate-50/50">
                  <td
                    className="py-1 px-1 text-center font-medium"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {item.orderNumber || itemIdx + 1}
                  </td>
                  <td
                    className="py-1 px-2 text-left"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    <span className="font-normal">{item.name}</span>
                    {item.note && (
                      <span className="block text-[11px] opacity-80 mt-0.5">
                        {item.note}
                      </span>
                    )}
                  </td>
                  <td
                    className="py-1 px-2 text-center whitespace-nowrap"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {priceDisplay}
                  </td>
                  <td
                    className="py-1 px-2 text-center whitespace-nowrap"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {countDisplay}
                  </td>
                  <td
                    className="py-1 px-2 text-right font-medium whitespace-nowrap"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {totalDisplay}
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            {prog.showTotalRow && (
              <tr
                className="bg-slate-50/80 font-bold"
                style={{ borderTop: `2px solid ${resolvedBorderColor}` }}
              >
                <td
                  colSpan={2}
                  className="py-1 px-2.5 text-left"
                  style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                >
                  <div className="flex flex-col">
                    <span style={{ color: resolvedBoldColor }}>
                      {prog.totalRowLabel || 'รวมราคาโปรแกรมรายการตรวจ'}
                    </span>
                    {thaiBaht && totalAmount > 0 && (
                      <span className="text-[12px] font-medium opacity-90 italic">
                        ({thaiBaht})
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="py-1 px-2 text-center"
                  style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                >
                  -
                </td>
                <td
                  className="py-1 px-2 text-center"
                  style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                >
                  {prog.defaultHeadcount || '-'}
                </td>
                <td
                  className="py-1 px-2 text-right font-bold text-[14px]"
                  style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}`, color: resolvedBoldColor }}
                >
                  {totalAmount.toLocaleString()}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Table Note */}
        {prog.tableNote && (
          <div className="mt-2 text-[12.5px] font-medium leading-normal">
            {renderFormattedThaiText(prog.tableNote, resolvedBoldColor)}
          </div>
        )}
      </div>
    );
  };

  // Page 1: Header, Date (middle of right half), Subject, Attention, Intro, Program 1
  const renderPage1 = () => (
    <div className="a4-sheet a4-page flex flex-col justify-between">
      <div>
        {/* Header (Always black & formal as requested) */}
        <DocumentHeader clinic={clinic} />

        {/* Date Row: Placed in the middle of the right half of the page */}
        <div className="w-full grid grid-cols-12 mb-5 text-[14px] font-normal tracking-wide" style={bodyStyle}>
          <div className="col-start-7 col-span-5 text-center">
            {proposal.dateText}
          </div>
        </div>

        {/* Body content with selected text color */}
        <div style={bodyStyle}>
          {/* Subject (เรื่อง) */}
          <div className="flex items-baseline gap-2 mb-2 text-[14px]">
            <span className="font-bold whitespace-nowrap min-w-[50px]" style={{ color: resolvedBoldColor }}>
              เรื่อง
            </span>
            <span className="font-normal">{proposal.subject}</span>
          </div>

          {/* Attention (เรียน) */}
          <div className="flex items-baseline gap-2 mb-5 text-[14px]">
            <span className="font-bold whitespace-nowrap min-w-[50px]" style={{ color: resolvedBoldColor }}>
              เรียน
            </span>
            <span className="font-normal">{renderFormattedThaiText(proposal.attention, resolvedBoldColor)}</span>
          </div>

          {/* Intro Paragraph */}
          {proposal.introParagraph && (
            <div className="mb-5 text-[13.5px] leading-relaxed text-justify whitespace-pre-line font-normal indent-10">
              {renderFormattedThaiText(proposal.introParagraph, resolvedBoldColor)}
            </div>
          )}

          {/* Program 1 */}
          {proposal.programs.length > 0 && renderProgramTable(proposal.programs[0], 0)}
        </div>
      </div>
    </div>
  );

  const renderPage2 = () => {
    const page2Programs = proposal.programs.slice(1);
    if (page2Programs.length === 0) return null;

    return (
      <div className="a4-sheet a4-page flex flex-col justify-between">
        <div>
          {/* Header on Page 2 */}
          <DocumentHeader clinic={clinic} compact />

          {/* Programs for Page 2 */}
          <div style={bodyStyle}>
            {page2Programs.map((prog, idx) => renderProgramTable(prog, idx + 1))}
          </div>
        </div>
      </div>
    );
  };

  const renderPageFinal = () => {
    return (
      <div className="a4-sheet a4-page flex flex-col justify-between">
        <div>
          {/* Header on Page 3 */}
          <DocumentHeader clinic={clinic} compact />

          <div style={bodyStyle}>
            {/* Remarks Section (หมายเหตุ) */}
            {proposal.remarks && proposal.remarks.length > 0 && (
              <div className="mb-4 text-[13.5px]">
                <h4 className="font-bold underline underline-offset-2 mb-1.5" style={{ color: resolvedBoldColor }}>
                  หมายเหตุ
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  {proposal.remarks.map((rem, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {renderFormattedThaiText(rem, resolvedBoldColor)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Service Conditions (เงื่อนไขการให้บริการ) */}
            {proposal.serviceConditions && proposal.serviceConditions.length > 0 && (
              <div className="mb-5 text-[13.5px]">
                <h4 className="font-bold underline underline-offset-2 mb-1.5" style={{ color: resolvedBoldColor }}>
                  เงื่อนไขการให้บริการ
                </h4>
                <ol className="list-decimal pl-6 space-y-1.5">
                  {proposal.serviceConditions.map((cond, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {renderFormattedThaiText(cond, resolvedBoldColor)}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Closing Paragraph (จึงเรียนมาเพื่อโปรดพิจารณา...) */}
            {proposal.closingParagraph && (
              <div className="mb-8 text-[13.5px] leading-relaxed text-justify indent-10">
                {renderFormattedThaiText(proposal.closingParagraph, resolvedBoldColor)}
              </div>
            )}

            {/* Signoff (ขอแสดงความนับถือ) */}
            <div className="w-full flex justify-end mb-8">
              <div className="text-center min-w-[220px] text-[13.5px]">
                <div className="mb-10 font-normal">ขอแสดงความนับถือ</div>
                <div className="font-normal mb-0.5">({proposal.signer?.name || '...........................................'})</div>
                <div className="text-[13px] opacity-90">{proposal.signer?.title || 'เจ้าหน้าที่ฝ่ายขาย'}</div>
              </div>
            </div>

            {/* Footer Grid: Client Confirmation (Left) & Coordinator Box (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pt-2 border-t border-slate-300">
              {/* Left Box: Client Confirmation */}
              {proposal.clientConfirmation?.show && (
                <div className="flex flex-col justify-end text-[13px] pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-4 h-4 border-2 border-current rounded-xs"></span>
                    <span className="font-bold" style={{ color: resolvedBoldColor }}>
                      {proposal.clientConfirmation.title || 'ยืนยันการใช้บริการ'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span>{proposal.clientConfirmation.signatureLabel || 'ลงชื่อ.................................................ผู้รับบริการ'}</span>
                  </div>
                  <div>
                    <span>{proposal.clientConfirmation.namePlaceholder || '(.................................................)'}</span>
                  </div>
                </div>
              )}

              {/* Right Box: Coordinators (border box matching PDF) */}
              {proposal.coordinators && proposal.coordinators.length > 0 && (
                <div
                  className="p-3 rounded-none text-[12.5px] bg-white flex flex-col justify-center"
                  style={{ border: `1px solid ${resolvedBorderColor}` }}
                >
                  {proposal.coordinators.map((coord, idx) => (
                    <div key={coord.id || idx} className="mb-1.5 last:mb-0">
                      <div className="font-medium">
                        ผู้ประสานงาน{' '}
                        <span className="font-bold" style={{ color: resolvedBoldColor }}>
                          {coord.name}
                        </span>
                        {coord.phone && <span> โทร: {coord.phone}</span>}
                      </div>
                      {coord.email && (
                        <div className="opacity-80 text-[12px]">
                          E-mail: {coord.email}
                        </div>
                      )}
                      {coord.note && (
                        <div className="font-medium text-[11.5px] mt-0.5">
                          {coord.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="printable-area" className="w-full flex flex-col items-center">
      {/* Page 1 */}
      {renderPage1()}

      {/* Page 2 (if any additional programs) */}
      {proposal.programs.length > 1 && renderPage2()}

      {/* Page 3 / Final Page (Terms, Signoff, Coordinators) */}
      {renderPageFinal()}
    </div>
  );
};
