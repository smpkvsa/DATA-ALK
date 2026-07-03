import { Member } from '../types';

/**
 * Normalizes any Google Sheets URL (sharing link, published HTML, or CSV link)
 * into a direct CSV download/fetch link.
 */
export function normalizeSheetsUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Case 1: Published to the web link (e.g. /d/e/2PACX-.../pubhtml)
  if (trimmed.includes('/d/e/')) {
    const cleanUrl = trimmed.split('?')[0];
    if (cleanUrl.endsWith('/pubhtml')) {
      return cleanUrl.substring(0, cleanUrl.length - 8) + '/pub?output=csv';
    }
    if (cleanUrl.endsWith('/pub')) {
      return cleanUrl + '?output=csv';
    }
    return cleanUrl + '/pub?output=csv';
  }

  // Case 2: Standard sharing link (e.g. /d/SPREADSHEET_ID/edit...)
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const spreadsheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }

  return trimmed;
}

/**
 * Parses raw CSV text into a structured list of Member objects.
 * Handles commas in quotes and filters out blank entries (where NAMA is empty).
 */
export function parseCSV(csvText: string): Member[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' || char === '\r') {
      if (inQuotes) {
        currentLine += char;
      } else {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip LF
        }
        lines.push(currentLine);
        currentLine = '';
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records: Member[] = [];

  for (let j = 1; j < lines.length; j++) {
    const line = lines[j].trim();
    if (!line) continue;
    const values = parseCSVLine(lines[j]);
    const obj: any = {};
    headers.forEach((header, index) => {
      const key = header.trim();
      obj[key] = values[index] !== undefined ? values[index].trim() : '';
    });

    // Check if it's a valid record (must have a Name and ID)
    if (obj.ID && obj.NAMA && obj.NAMA.trim().length > 0) {
      records.push(obj as Member);
    }
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',') {
      if (inQuotes) {
        currentVal += ',';
      } else {
        result.push(currentVal);
        currentVal = '';
      }
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
}
