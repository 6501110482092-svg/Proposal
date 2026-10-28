export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

/**
 * Returns today's date formatted in Thai BE
 * e.g., "28 ตุลาคม 2569"
 */
export function getTodayThaiDate(format: 'standard' | 'with-prefix' | 'with-be' = 'standard'): string {
  const now = new Date();
  const day = now.getDate();
  const month = THAI_MONTHS[now.getMonth()];
  const beYear = now.getFullYear() + 543;

  switch (format) {
    case 'with-prefix':
      return `วันที่ ${day} ${month} ${beYear}`;
    case 'with-be':
      return `วันที่ ${day} ${month} พ.ศ. ${beYear}`;
    case 'standard':
    default:
      return `${day} ${month} ${beYear}`;
  }
}

/**
 * Parses day, month index (0-11), and BE year from a Thai date string if possible
 */
export function parseThaiDate(text: string): { day: number; monthIndex: number; year: number } | null {
  if (!text) return null;
  
  const clean = text.replace(/วันที่|พ\.ศ\.|ปี/g, '').trim();
  const parts = clean.split(/\s+/);
  
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1];
    const year = parseInt(parts[2], 10);
    
    const monthIndex = THAI_MONTHS.findIndex(m => m === monthName || m.startsWith(monthName));
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return { day, monthIndex, year };
    }
  }
  
  const now = new Date();
  return {
    day: now.getDate(),
    monthIndex: now.getMonth(),
    year: now.getFullYear() + 543,
  };
}

/**
 * Formats an ISO date string into a friendly Thai date & time format
 * e.g., "28 ต.ค. 2569 15:48 น."
 */
export function formatThaiDateTime(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = d.getDate();
    const month = THAI_MONTHS_SHORT[d.getMonth()];
    const beYear = d.getFullYear() + 543;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${beYear} เวลา ${hours}:${minutes} น.`;
  } catch (e) {
    return isoString;
  }
}

