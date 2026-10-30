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

  // Helper to calculate original total of a program
  const calculateOriginalProgramTotal = (prog: ProposalProgram): number => {
    return prog.items.reduce((sum, item) => {
      const origUnit = item.originalUnitPrice !== undefined ? item.originalUnitPrice : item.unitPrice;
      if (item.pricingType === 'fixed' || item.originalPricingType === 'fixed') {
        return sum + (item.totalPrice || origUnit || 0);
      }
      if (item.pricingType === 'free' || item.originalPricingType === 'free') {
        return sum;
      }
      const count = item.headcount || prog.defaultHeadcount || 0;
      return sum + (origUnit * count);
    }, 0);
  };

  // Helper to calculate amended total of a program (only includes items with amendmentStatus !== 'excluded')
  const calculateAmendedProgramTotal = (prog: ProposalProgram): number => {
    if (prog.totalPriceOverride !== undefined && prog.totalPriceOverride !== null) {
      return prog.totalPriceOverride;
    }
    return prog.items.reduce((sum, item) => {
      if (item.amendmentStatus === 'excluded') {
        return sum;
      }
      let effectiveUnit = item.unitPrice;
      if (item.amendmentPriceType === 'custom' && item.amendmentCustomPrice !== undefined) {
        effectiveUnit = item.amendmentCustomPrice;
      }
      if (item.pricingType === 'fixed') {
        return sum + (item.amendmentPriceType === 'custom' && item.amendmentCustomPrice !== undefined ? item.amendmentCustomPrice : item.totalPrice);
      }
      if (item.pricingType === 'free') {
        return sum;
      }
      const count = item.headcount || prog.defaultHeadcount || 0;
      return sum + (effectiveUnit * count);
    }, 0);
  };

  // Calculate total price of a program
  const calculateProgramTotal = (prog: ProposalProgram): number => {
    if (proposal.docType === 'amendment') {
      return calculateAmendedProgramTotal(prog);
    }
    if (prog.totalPriceOverride !== undefined && prog.totalPriceOverride !== null) {
      return prog.totalPriceOverride;
    }
    return prog.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  // Helper to render a table program
  const renderProgramTable = (prog: ProposalProgram, index: number) => {
    const isAmendment = proposal.docType === 'amendment';
    const totalAmount = calculateProgramTotal(prog);
    const origTotalAmount = calculateOriginalProgramTotal(prog);
    const thaiBaht = prog.thaiBahtTextOverride || bahttext(totalAmount);

    const origPerPerson = prog.defaultHeadcount > 0 ? Math.round(origTotalAmount / prog.defaultHeadcount) : 0;
    const amendedPerPerson = prog.defaultHeadcount > 0 ? Math.round(totalAmount / prog.defaultHeadcount) : 0;
    const standardPerPerson = prog.defaultHeadcount > 0 ? Math.round(totalAmount / prog.defaultHeadcount) : 0;

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
                className="py-1 px-1.5 w-10 text-center"
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
              {isAmendment ? (
                <>
                  <th
                    className="py-1 px-2 w-28 text-center whitespace-nowrap"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {prog.colOriginalPriceLabel || 'ใบเสนอราคาเดิม'}
                  </th>
                  <th
                    className="py-1 px-2 w-36 text-center whitespace-nowrap"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {prog.colAmendmentLabel || 'เอกสารปรับปรุง'}
                  </th>
                </>
              ) : (
                <th
                  className="py-1 px-2 w-28 text-center whitespace-nowrap"
                  style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                >
                  {prog.colPriceLabel || 'ราคา (บาท)'}
                </th>
              )}
              <th
                className="py-1 px-2 w-18 text-center whitespace-nowrap"
                style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
              >
                {prog.colCountLabel || 'จำนวนคน'}
              </th>
              <th
                className="py-1 px-2 w-26 text-center whitespace-nowrap"
                style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
              >
                {prog.colTotalLabel || 'รวมราคา'}
              </th>
            </tr>
          </thead>
          <tbody>
            {prog.items.map((item, itemIdx) => {
              const isExcluded = isAmendment && item.amendmentStatus === 'excluded';

              // Format price display in standard mode
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

              // Original price display for amendment mode
              const origUnit = item.originalUnitPrice !== undefined ? item.originalUnitPrice : item.unitPrice;
              let origPriceDisplay = '-';
              if (item.originalPricingType === 'fixed' || item.pricingType === 'fixed') {
                origPriceDisplay = item.originalFlatRateLabel || item.flatRateLabel || `${origUnit.toLocaleString()} ฿`;
              } else if (item.originalPricingType === 'free' || item.pricingType === 'free') {
                origPriceDisplay = 'ฟรี';
              } else if (origUnit > 0) {
                origPriceDisplay = `${origUnit.toLocaleString()}`;
              }

              // Amendment selection display
              let amendmentSelectionDisplay = null;
              if (isAmendment) {
                if (isExcluded) {
                  amendmentSelectionDisplay = (
                    <span className="text-slate-400 font-medium text-[12px]">
                      ไม่มี (ไม่รับบริการ)
                    </span>
                  );
                } else if (item.amendmentPriceType === 'custom' && item.amendmentCustomPrice !== undefined) {
                  amendmentSelectionDisplay = (
                    <span className="text-emerald-700 font-bold text-[12px]">
                      มี (ราคาใหม่ {item.amendmentCustomPrice.toLocaleString()} ฿)
                    </span>
                  );
                } else {
                  amendmentSelectionDisplay = (
                    <span className="text-blue-700 font-bold text-[12px]">
                      มี (ราคาเดิม)
                    </span>
                  );
                }
              }

              // Headcount display
              const countDisplay = isExcluded
                ? '-'
                : item.pricingType === 'unpriced' && item.headcount === 0
                ? '-'
                : item.pricingType === 'fixed' && !item.headcount
                ? '-'
                : item.headcount
                ? item.headcount.toLocaleString()
                : '-';

              // Item Total price calculation
              let itemTotalNum = 0;
              if (!isExcluded) {
                if (isAmendment) {
                  const effectiveUnit = item.amendmentPriceType === 'custom' && item.amendmentCustomPrice !== undefined
                    ? item.amendmentCustomPrice
                    : item.unitPrice;
                  if (item.pricingType === 'fixed') {
                    itemTotalNum = item.amendmentPriceType === 'custom' && item.amendmentCustomPrice !== undefined
                      ? item.amendmentCustomPrice
                      : item.totalPrice;
                  } else if (item.pricingType === 'free') {
                    itemTotalNum = 0;
                  } else {
                    itemTotalNum = effectiveUnit * (item.headcount || prog.defaultHeadcount || 0);
                  }
                } else {
                  itemTotalNum = item.totalPrice || 0;
                }
              }

              let totalDisplay = '-';
              if (!isExcluded) {
                if (item.pricingType === 'fixed' && item.flatRateLabel?.includes('เหมาจ่าย') && !itemTotalNum) {
                  totalDisplay = '-';
                } else if (itemTotalNum > 0) {
                  totalDisplay = itemTotalNum.toLocaleString();
                } else if (item.pricingType === 'free') {
                  totalDisplay = '-';
                }
              }

              return (
                <tr
                  key={item.id || itemIdx}
                  className={`hover:bg-slate-50/50 ${isExcluded ? 'bg-slate-50/40' : ''}`}
                >
                  <td
                    className={`py-1 px-1 text-center font-medium ${isExcluded ? 'text-slate-400' : ''}`}
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {item.orderNumber || itemIdx + 1}
                  </td>
                  <td
                    className="py-1 px-2 text-left"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    <div
                      className={`font-normal leading-snug ${isExcluded ? 'text-slate-400' : ''}`}
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: isExcluded ? '#94a3b8' : undefined }}
                    >
                      {renderFormattedThaiText(item.name, isExcluded ? '#94a3b8' : resolvedBoldColor)}
                    </div>
                    {item.note && (
                      <div
                        className={`text-[11px] mt-0.5 ${isExcluded ? 'text-slate-400 opacity-70' : 'opacity-80'}`}
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: isExcluded ? '#94a3b8' : undefined }}
                      >
                        {renderFormattedThaiText(item.note, isExcluded ? '#94a3b8' : resolvedBoldColor)}
                      </div>
                    )}
                  </td>

                  {/* Standard or Amendment Price Columns */}
                  {isAmendment ? (
                    <>
                      <td
                        className={`py-1 px-2 text-center whitespace-nowrap ${isExcluded ? 'text-slate-400' : 'text-slate-700'}`}
                        style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                      >
                        {origPriceDisplay}
                      </td>
                      <td
                        className="py-1 px-2 text-center whitespace-nowrap"
                        style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                      >
                        {amendmentSelectionDisplay}
                      </td>
                    </>
                  ) : (
                    <td
                      className="py-1 px-2 text-center whitespace-nowrap"
                      style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                    >
                      {priceDisplay}
                    </td>
                  )}

                  <td
                    className={`py-1 px-2 text-center whitespace-nowrap ${isExcluded ? 'text-slate-400' : ''}`}
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {countDisplay}
                  </td>
                  <td
                    className={`py-1 px-2 text-right font-medium whitespace-nowrap ${isExcluded ? 'text-slate-400' : ''}`}
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
                  className="py-1.5 px-2.5 text-left"
                  style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                >
                  <div className="flex flex-col">
                    <span style={{ color: resolvedBoldColor }}>
                      {prog.totalRowLabel || 'รวมราคาโปรแกรมรายการตรวจ'}
                    </span>
                    {thaiBaht && totalAmount > 0 && (
                      <span className="text-[12px] font-medium opacity-90 italic mt-0.5">
                        ({thaiBaht})
                      </span>
                    )}
                  </div>
                </td>

                {isAmendment ? (
                  <>
                    <td
                      className="py-1 px-2 text-center text-xs text-slate-400 font-normal"
                      style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                    >
                      -
                    </td>
                    <td
                      className="py-1 px-2 text-center text-xs text-blue-800 font-bold"
                      style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                    >
                      {amendedPerPerson > 0 ? `${amendedPerPerson.toLocaleString()} ฿/คน` : '-'}
                    </td>
                  </>
                ) : (
                  <td
                    className="py-1 px-2 text-center text-xs font-bold text-blue-900"
                    style={{ ...cellBorderStyle, border: `1px solid ${resolvedBorderColor}` }}
                  >
                    {standardPerPerson > 0 ? `${standardPerPerson.toLocaleString()} ฿/คน` : '-'}
                  </td>
                )}

                <td
                  className="py-1 px-2 text-center font-bold"
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

  // Page 1: Header (with Quotation, Doc No, Date in top right), Subject, Attention, Intro, Program 1
  const renderPage1 = () => (
    <div className="a4-sheet a4-page flex flex-col justify-between">
      <div>
        {/* Header (with logo, clinic details on left, and ใบเสนอราคา / เลขที่ / วันที่ on right) */}
        <DocumentHeader
          clinic={clinic}
          documentNo={proposal.documentNo}
          dateText={proposal.dateText}
          showDocMeta={true}
          headerStyle={proposal.headerStyle || 'minimal'}
          docType={proposal.docType}
          amendmentDocTitle={proposal.amendmentDocTitle}
        />

        {/* Body content with selected text color */}
        <div style={bodyStyle}>
          {/* If official header style is chosen, render Document No & Date on the same line right above Subject */}
          {proposal.headerStyle === 'official' && (
            <div className="flex items-baseline mb-2.5 text-[14px]">
              <div className="flex items-baseline gap-2" style={{ paddingLeft: '58px' }}>
                <span className="font-bold whitespace-nowrap" style={{ color: resolvedBoldColor }}>
                  เลขที่:
                </span>
                <span className="font-normal">
                  {proposal.documentNo || '-'}
                </span>
              </div>
              <div className="ml-auto pr-16 sm:pr-20 flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap" style={{ color: resolvedBoldColor }}>
                  วันที่:
                </span>
                <span className="font-normal">
                  {proposal.dateText || '-'}
                </span>
              </div>
            </div>
          )}

          {/* Subject (เรื่อง) */}
          <div className="flex items-baseline gap-2 mb-2 text-[14px]">
            <span className="font-bold whitespace-nowrap min-w-[50px]" style={{ color: resolvedBoldColor }}>
              เรื่อง
            </span>
            <div
              className="font-normal flex-1"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {renderFormattedThaiText(proposal.subject, resolvedBoldColor)}
            </div>
          </div>

          {/* Attention (เรียน) */}
          <div className="flex items-baseline gap-2 mb-5 text-[14px]">
            <span className="font-bold whitespace-nowrap min-w-[50px]" style={{ color: resolvedBoldColor }}>
              เรียน
            </span>
            <div
              className="font-normal flex-1"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {renderFormattedThaiText(proposal.attention, resolvedBoldColor)}
            </div>
          </div>

          {/* Intro Paragraph */}
          {proposal.introParagraph && (
            <div
              className="mb-5 text-[13.5px] leading-relaxed font-normal"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
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
          {/* Header on Page 2 (Exact same header structure as Page 1!) */}
          <DocumentHeader
            clinic={clinic}
            documentNo={proposal.documentNo}
            dateText={proposal.dateText}
            showDocMeta={true}
            headerStyle={proposal.headerStyle || 'minimal'}
            docType={proposal.docType}
            amendmentDocTitle={proposal.amendmentDocTitle}
          />

          {proposal.headerStyle === 'official' && (
            <div className="flex items-baseline mb-2.5 text-[13px]" style={bodyStyle}>
              <div className="flex items-baseline gap-2" style={{ paddingLeft: '58px' }}>
                <span className="font-bold whitespace-nowrap" style={{ color: resolvedBoldColor }}>
                  เลขที่:
                </span>
                <span className="font-normal">
                  {proposal.documentNo || '-'}
                </span>
              </div>
              <div className="ml-auto pr-16 sm:pr-20 flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap" style={{ color: resolvedBoldColor }}>
                  วันที่:
                </span>
                <span className="font-normal">
                  {proposal.dateText || '-'}
                </span>
              </div>
            </div>
          )}

          {/* Programs for Page 2 */}
          <div style={bodyStyle}>
            {page2Programs.map((prog, idx) => renderProgramTable(prog, idx + 1))}
          </div>
        </div>
      </div>
    );
  };

  // Check if final page has any content before rendering it
  const hasFinalPageContent = Boolean(
    (proposal.remarks && proposal.remarks.length > 0) ||
    (proposal.serviceConditions && proposal.serviceConditions.length > 0) ||
    (proposal.closingParagraph && proposal.closingParagraph.trim()) ||
    (proposal.signer?.name && proposal.signer.name.trim()) ||
    proposal.clientConfirmation?.show ||
    (proposal.coordinators && proposal.coordinators.length > 0)
  );

  const renderPageFinal = () => {
    if (!hasFinalPageContent) return null;

    return (
      <div className="a4-sheet a4-page flex flex-col justify-between">
        <div>
          {/* Header on Final Page (Exact same header structure as Page 1!) */}
          <DocumentHeader
            clinic={clinic}
            documentNo={proposal.documentNo}
            dateText={proposal.dateText}
            showDocMeta={true}
            headerStyle={proposal.headerStyle || 'minimal'}
            docType={proposal.docType}
            amendmentDocTitle={proposal.amendmentDocTitle}
          />

          {proposal.headerStyle === 'official' && (
            <div className="flex items-baseline mb-2.5 text-[13px]" style={bodyStyle}>
              <div className="flex items-baseline gap-2" style={{ paddingLeft: '58px' }}>
                <span className="font-bold whitespace-nowrap" style={{ color: resolvedBoldColor }}>
                  เลขที่:
                </span>
                <span className="font-normal">
                  {proposal.documentNo || '-'}
                </span>
              </div>
              <div className="ml-auto pr-16 sm:pr-20 flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap" style={{ color: resolvedBoldColor }}>
                  วันที่:
                </span>
                <span className="font-normal">
                  {proposal.dateText || '-'}
                </span>
              </div>
            </div>
          )}

          <div style={bodyStyle}>
            {/* Remarks Section (หมายเหตุ) */}
            {proposal.remarks && proposal.remarks.length > 0 && (
              <div className="mb-4 text-[13.5px]">
                <h4 className="font-bold underline underline-offset-2 mb-1.5" style={{ color: resolvedBoldColor }}>
                  หมายเหตุ
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  {proposal.remarks.map((rem, idx) => (
                    <li
                      key={idx}
                      className="leading-relaxed"
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
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
                    <li
                      key={idx}
                      className="leading-relaxed"
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {renderFormattedThaiText(cond, resolvedBoldColor)}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Closing Paragraph (จึงเรียนมาเพื่อโปรดพิจารณา...) */}
            {proposal.closingParagraph && (
              <div
                className="mb-8 text-[13.5px] leading-relaxed"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {renderFormattedThaiText(proposal.closingParagraph, resolvedBoldColor)}
              </div>
            )}

            {/* Signoff (ขอแสดงความนับถือ) */}
            <div className="w-full flex justify-end mb-8 avoid-break">
              <div className="text-center min-w-[220px] text-[13.5px]">
                <div className="mb-10 font-normal">ขอแสดงความนับถือ</div>
                <div className="font-normal mb-0.5">({proposal.signer?.name || '...........................................'})</div>
                <div className="text-[13px] opacity-90">{proposal.signer?.title || 'เจ้าหน้าที่ฝ่ายขาย'}</div>
              </div>
            </div>

            {/* Footer Grid: Client Confirmation (Left) & Coordinator Box (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pt-2 border-t border-slate-300 avoid-break">
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
      {hasFinalPageContent && renderPageFinal()}
    </div>
  );
};
