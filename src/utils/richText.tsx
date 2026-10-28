import React from 'react';

/**
 * Parses markdown bold syntax (**bold**) and renders with proper <strong> tags
 * Accepts optional boldColor so bold words can match the text color or have their own custom color
 */
export function renderFormattedThaiText(
  text: string | undefined | null,
  boldColor?: string
): React.ReactNode {
  if (!text) return null;

  // Split by markdown bold pattern: **bold text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

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
  textarea: HTMLTextAreaElement | HTMLInputElement,
  currentValue: string,
  onChange: (val: string) => void
) {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  
  if (start === end) {
    // Nothing selected: insert placeholder or just ** **
    const newText =
      currentValue.substring(0, start) +
      '**ข้อความตัวหนา**' +
      currentValue.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 18);
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
      textarea.focus();
      textarea.setSelectionRange(start, start + unbolded.length);
    }, 10);
  } else {
    // Bold it
    const bolded = `**${selectedText}**`;
    const newText = currentValue.substring(0, start) + bolded + currentValue.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + bolded.length);
    }, 10);
  }
}
