import { ClinicProfile, ProposalDocument } from '../types';

/**
 * Generates sequential document numbers per clinic profile and per Thai year.
 * Format: {docPrefix}-QT-{ThaiYear}-{001}
 * e.g. BK-QT-2569-001, NN-QT-2569-001, NN-QT-2569-002
 */
export function generateCompanyDocNumber(
  clinic: ClinicProfile,
  existingProposals: ProposalDocument[],
  thaiYearOverride?: number
): string {
  const prefix = (clinic.docPrefix || clinic.shortName?.slice(0, 2) || 'BK')
    .trim()
    .toUpperCase();
  
  const thaiYear = thaiYearOverride || (new Date().getFullYear() + 543);
  
  // Find all proposals for this clinic and this year
  // Regex matches: PREFIX-QT-YEAR-NUMBER or similar variants
  const pattern = new RegExp(`^${prefix}-QT-${thaiYear}-(\\d+)`, 'i');
  
  let maxSeq = 0;
  
  for (const prop of existingProposals) {
    if (!prop.documentNo) continue;
    
    // Check if doc belongs to this clinic or matches the prefix
    const match = prop.documentNo.trim().match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqString = String(nextSeq).padStart(3, '0');
  
  return `${prefix}-QT-${thaiYear}-${seqString}`;
}
