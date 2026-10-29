import React from 'react';
import { Bold, CornerDownLeft, ArrowRightToLine } from 'lucide-react';

/**
 * Formats tabs (\t) and multiple/leading spaces into non-breaking spaces (\u00A0)
 * so that browser layout engines and print media NEVER collapse user-defined indentation.
 */
export function formatIndentationAndTabs(text: string): string {
  if (!text) return '';
  // 1. Replace tab characters with 4 non-breaking spaces
  let formatted = text.replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0');

  // 2. Convert leading spaces on any line (start of text or immediately after a newline \n)
  // to non-breaking spaces so paragraphs and indented lines keep their full indentation!
  formatted = formatted.replace(/(^|\n)( +)/g, (_match, prefix, spaces) => {
    return prefix + '\u00A0'.repeat(spaces.length);
  });

  // 3. Convert any run of 2 or more spaces into non-breaking spaces
  formatted = formatted.replace(/ {2,}/g, match => '\u00A0'.repeat(match.length));

  return formatted;
}

/**
 * Parses markdown bold syntax (**bold**) and renders with proper <strong> tags,
 * while preserving all leading spaces, tab indentations, and newlines.
 */
export function renderFormattedThaiText(
  text: string | undefined | null,
  boldColor?: string
): React.ReactNode {
  if (!text) return null;

  // Pre-process indentation and tabs into non-collapsible spaces
  const processed = formatIndentationAndTabs(text);

  // Split by markdown bold pattern: **bold text**
  const parts = processed.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldContent = part.slice(2, -2);
      const style: React.CSSProperties = {};
      if (boldColor && boldColor !== 'inherit') {
        style.color = boldColor;
      }

      return (
        <strong
          key={idx}
          className="font-bold"
          style={style}
        >
          {boldContent}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Helper to wrap selected text in a textarea with markdown **bold**
 */
export function insertBoldMarkdown(
  element: HTMLTextAreaElement | HTMLInputElement,
  currentValue: string,
  onChange: (val: string) => void
) {
  const start = element.selectionStart || 0;
  const end = element.selectionEnd || 0;
  
  if (start === end) {
    // Nothing selected: insert placeholder or just ** **
    const newText =
      currentValue.substring(0, start) +
      '**ข้อความตัวหนา**' +
      currentValue.substring(end);
    onChange(newText);
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start + 2, start + 18);
    }, 10);
    return;
  }

  const selectedText = currentValue.substring(start, end);
  
  // If already bolded, unbold
  if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
    const unbolded = selectedText.slice(2, -2);
    const newText = currentValue.substring(0, start) + unbolded + currentValue.substring(end);
    onChange(newText);
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start, start + unbolded.length);
    }, 10);
  } else {
    // Bold it
    const bolded = `**${selectedText}**`;
    const newText = currentValue.substring(0, start) + bolded + currentValue.substring(end);
    onChange(newText);
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start, start + bolded.length);
    }, 10);
  }
}

/**
 * Helper to insert a newline (\n) at the cursor position
 */
export function insertNewline(
  element: HTMLTextAreaElement | HTMLInputElement,
  currentValue: string,
  onChange: (val: string) => void
) {
  const start = element.selectionStart || 0;
  const end = element.selectionEnd || 0;

  const newText = currentValue.substring(0, start) + '\n' + currentValue.substring(end);
  onChange(newText);
  setTimeout(() => {
    element.focus();
    element.setSelectionRange(start + 1, start + 1);
  }, 10);
}

/**
 * Helper to insert tab indentation (4 non-breaking spaces / indent) at cursor position
 */
export function insertTabIndent(
  element: HTMLTextAreaElement | HTMLInputElement,
  currentValue: string,
  onChange: (val: string) => void
) {
  const start = element.selectionStart || 0;
  const end = element.selectionEnd || 0;
  const indent = '    '; // 4 spaces for reliable tab indent

  const newText = currentValue.substring(0, start) + indent + currentValue.substring(end);
  onChange(newText);
  setTimeout(() => {
    element.focus();
    element.setSelectionRange(start + indent.length, start + indent.length);
  }, 10);
}

interface TextFormatToolbarProps {
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  value: string;
  onChange: (val: string) => void;
  compact?: boolean;
}

/**
 * Reusable helper button toolbar for textareas / inputs
 * Provides: [B ทำตัวหนา], [↵ ขึ้นบรรทัดใหม่ / Enter], [⇥ ย่อหน้า / Tab]
 */
export const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  inputRef,
  value,
  onChange,
  compact = false,
}) => {
  const handleBold = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      insertBoldMarkdown(inputRef.current, value, onChange);
    }
  };

  const handleNewline = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      insertNewline(inputRef.current, value, onChange);
    }
  };

  const handleTab = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      insertTabIndent(inputRef.current, value, onChange);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-slate-700 select-none ${compact ? 'scale-90 origin-right' : ''}`}>
      <button
        type="button"
        onClick={handleBold}
        className="px-1.5 py-0.5 text-[11px] font-bold hover:bg-white hover:text-slate-900 rounded transition flex items-center gap-1 cursor-pointer"
        title="ทำเป็นตัวหนา [**ข้อความ**]"
      >
        <Bold className="w-3 h-3" />
        {!compact && <span>ตัวหนา</span>}
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={handleNewline}
        className="px-1.5 py-0.5 text-[11px] font-medium hover:bg-white hover:text-slate-900 rounded transition flex items-center gap-1 cursor-pointer"
        title="ขึ้นบรรทัดใหม่ (Enter)"
      >
        <CornerDownLeft className="w-3 h-3 text-sky-600" />
        {!compact && <span>ขึ้นบรรทัดใหม่</span>}
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={handleTab}
        className="px-1.5 py-0.5 text-[11px] font-medium hover:bg-white hover:text-slate-900 rounded transition flex items-center gap-1 cursor-pointer"
        title="ย่อหน้า / Tab (เว้นวรรค 4 ช่อง)"
      >
        <ArrowRightToLine className="w-3 h-3 text-indigo-600" />
        {!compact && <span>ย่อหน้า</span>}
      </button>
    </div>
  );
};
