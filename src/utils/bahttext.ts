/**
 * Convert numeric Baht amount to Thai words
 * Example: 37830 -> "สามหมื่นเจ็ดพันแปดร้อยสามสิบบาทถ้วน"
 * Example: 56000 -> "ห้าหมื่นหกพันบาทถ้วน"
 * Example: 12000.50 -> "หนึ่งหมื่นสองพันบาทห้าสิบสตางค์"
 */

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(numStr: string): string {
  let result = '';
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i], 10);
    const pos = len - i - 1;

    if (digit === 0) continue;

    if (pos === 0) {
      if (digit === 1 && len > 1 && numStr[len - 2] !== '0') {
        result += 'เอ็ด';
      } else {
        result += THAI_DIGITS[digit];
      }
    } else if (pos === 1) {
      if (digit === 1) {
        result += 'สิบ';
      } else if (digit === 2) {
        result += 'ยี่สิบ';
      } else {
        result += THAI_DIGITS[digit] + 'สิบ';
      }
    } else {
      result += THAI_DIGITS[digit] + THAI_POSITIONS[pos];
    }
  }

  return result;
}

export function bahttext(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '';
  }

  const num = Number(amount);
  if (num === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const [intPartStr, decPartStr = ''] = absNum.toFixed(2).split('.');
  const satangNum = parseInt(decPartStr, 10);

  let text = '';

  // Millions grouping
  const intLen = intPartStr.length;
  if (intLen > 6) {
    const millionsGroup = intPartStr.slice(0, -6);
    const remainderGroup = intPartStr.slice(-6);
    text += convertGroup(millionsGroup) + 'ล้าน' + convertGroup(remainderGroup);
  } else {
    text += convertGroup(intPartStr);
  }

  if (text.length > 0) {
    text += 'บาท';
  }

  if (satangNum === 0) {
    text += 'ถ้วน';
  } else {
    text += convertGroup(decPartStr) + 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + text;
}
