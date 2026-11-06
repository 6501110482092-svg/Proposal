import { ProposalProgram } from '../types';

export interface ProgramWithIndex extends ProposalProgram {
  originalIndex: number;
}

export interface ProgramPageGroup {
  pageIndex: number; // 2, 3, etc.
  programs: ProgramWithIndex[];
}

export interface PaginationOptions {
  density?: 'standard' | 'compact' | 'ultra-compact';
  isOfficialHeader?: boolean;
}

/**
 * Estimates vertical points/height for a program table on A4.
 */
export function estimateProgramPoints(
  prog: ProposalProgram,
  density: 'standard' | 'compact' | 'ultra-compact' = 'standard'
): number {
  let pts = prog.title ? 35 : 10;
  // If tier-rate, header is 2 rows
  pts += prog.tierGroupHeaderLabel || (prog.selectedTierIds && prog.selectedTierIds.length > 0) ? 55 : 35;

  const rowHeight = density === 'ultra-compact' ? 22 : density === 'compact' ? 26 : 32;
  const noteHeight = density === 'ultra-compact' ? 12 : density === 'compact' ? 14 : 16;

  prog.items.forEach(it => {
    pts += rowHeight;
    if (it.note) pts += noteHeight;
  });

  if (prog.tableNote) {
    const lineCount = (prog.tableNote.match(/\n/g) || []).length + 1;
    pts += Math.max(28, lineCount * (density === 'ultra-compact' ? 14 : 18));
  }

  if (prog.showTotalRow) {
    pts += 35;
  }

  pts += 18; // bottom margin

  return pts;
}

/**
 * Partitions programs (excluding program 0, which is on page 1) into discrete A4 pages.
 * Each page is guaranteed to be rendered with its own DocumentHeader.
 */
export function partitionProgramsIntoPages(
  programs: ProposalProgram[],
  options?: PaginationOptions
): ProgramPageGroup[] {
  const remaining: ProgramWithIndex[] = programs
    .slice(1)
    .map((p, idx) => ({ ...p, originalIndex: idx + 1 }));

  if (remaining.length === 0) return [];

  const density = options?.density || 'standard';
  // Available vertical points for programs on an A4 page (after DocumentHeader, padding, margins)
  // Total printable height ≈ 1030px. Header is ~140px. Safe limit ≈ 820px.
  const MAX_PAGE_POINTS = density === 'ultra-compact' ? 910 : density === 'compact' ? 860 : 810;

  const pages: ProgramPageGroup[] = [];
  let currentPrograms: ProgramWithIndex[] = [];
  let currentUsedPoints = 0;

  remaining.forEach((prog, idx) => {
    const isFirstInList = idx === 0;
    const forceNewPage = prog.pageBreakBefore === true;
    const prevForcesNewPage = idx > 0 && remaining[idx - 1]?.pageBreakAfter === true;

    if (isFirstInList) {
      currentPrograms.push(prog);
    } else if (forceNewPage || prevForcesNewPage) {
      // User explicitly requested this table to be on a new A4 page (with clinic header)
      pages.push({ pageIndex: pages.length + 2, programs: currentPrograms });
      currentPrograms = [prog];
    } else {
      // By default, keep together on the same page unless user explicitly chooses a new page
      currentPrograms.push(prog);
    }
  });

  if (currentPrograms.length > 0) {
    pages.push({ pageIndex: pages.length + 2, programs: currentPrograms });
  }

  return pages;
}

/**
 * Returns a map of program ID -> page number (1, 2, 3, etc.)
 */
export function getProgramPageMap(
  programs: ProposalProgram[],
  options?: PaginationOptions
): Record<string, number> {
  const map: Record<string, number> = {};
  if (programs.length === 0) return map;

  // Program 0 is always on Page 1
  if (programs[0]) {
    map[programs[0].id] = 1;
  }

  const pages = partitionProgramsIntoPages(programs, options);
  pages.forEach(page => {
    page.programs.forEach(p => {
      map[p.id] = page.pageIndex;
    });
  });

  return map;
}

/**
 * Calculates total pages in the proposal document.
 */
export function calculateTotalDocumentPages(
  programs: ProposalProgram[],
  hasFinalPageContent: boolean,
  options?: PaginationOptions
): number {
  const programPages = partitionProgramsIntoPages(programs, options);
  // Page 1 is always present if programs.length > 0
  const basePages = programs.length > 0 ? 1 : 0;
  return basePages + programPages.length + (hasFinalPageContent ? 1 : 0);
}
