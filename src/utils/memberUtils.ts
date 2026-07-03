import { Member } from '../types';

/**
 * Parses a currency string (e.g., "RM 779.680000000", "$416.57") into a clean number.
 */
export function parseCurrency(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  // Remove RM, $, commas, and any non-numeric/period characters
  const cleaned = val.replace(/[RMs$\s,]/gi, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number as Malaysian Ringgit (RM).
 */
export function formatCurrency(num: number): string {
  return 'RM ' + num.toLocaleString('ms-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Filter members based on search queries and filter options.
 */
export function filterMembers(
  members: Member[],
  searchQuery: string,
  filters: {
    statusDaftar?: string; // "DAFTAR", "BERHENTI"
    statusAhli?: string; // "GURU", "STAF", "PELAJAR" etc.
    jantina?: string; // "LELAKI", "PEREMPUAN"
    minSaham?: number;
    maxSaham?: number;
  }
): Member[] {
  const query = searchQuery.toLowerCase().trim();
  
  return members.filter(member => {
    // Search query matches Name, ID, IC Number, Member Number
    const matchQuery = !query || 
      (member.NAMA || '').toLowerCase().includes(query) ||
      (member.ID || '').toLowerCase().includes(query) ||
      (member['NO K/P'] || '').toLowerCase().includes(query) ||
      (member['NO AHLI'] || '').toLowerCase().includes(query);
      
    if (!matchQuery) return false;

    // Filter by registration status
    if (filters.statusDaftar && member['ID DAFTAR'] !== filters.statusDaftar) {
      // If we are filtering by "DAFTAR" but member's ID DAFTAR is blank, check if we treat it as active
      // Often, blank is empty, let's do strict match or loose
      if (filters.statusDaftar === 'DAFTAR' && !member['ID DAFTAR']) {
        // Let's assume blank is active or check NAMA presence
      } else {
        return false;
      }
    }

    // Filter by member status/role
    if (filters.statusAhli && member['STATUS AHLI'] !== filters.statusAhli) {
      return false;
    }

    // Filter by gender
    if (filters.jantina && member.JANTINA !== filters.jantina) {
      return false;
    }

    // Filter by share amount range
    const saham = parseCurrency(member['JUMLAH SAHAM SEMASA']);
    if (filters.minSaham !== undefined && saham < filters.minSaham) {
      return false;
    }
    if (filters.maxSaham !== undefined && saham > filters.maxSaham) {
      return false;
    }

    return true;
  });
}

/**
 * Export data as Excel-compatible CSV with UTF-8 BOM to preserve Malaysian characters/formatting.
 */
export function exportToCSV(members: Member[], filename: string) {
  const headers = [
    'ID', 'NAMA', 'NO K/P', 'NO AHLI', 'JUMLAH SAHAM SEMASA', 'ID DAFTAR', 
    'TARIKH DAFTAR AHLI', 'TARIKH BEHENTI', 'JANTINA', 'NO TEL', 'STATUS AHLI', 
    'PENAMBAHAN SAHAM', 'PENGELUARAN SAHAM', 'DIVIDEN TAHUN SEMASA', 'CATATAN'
  ];

  const csvRows = [
    headers.join(',')
  ];

  members.forEach(member => {
    const row = [
      escapeCSVField(member.ID),
      escapeCSVField(member.NAMA),
      escapeCSVField(member['NO K/P']),
      escapeCSVField(member['NO AHLI']),
      escapeCSVField(member['JUMLAH SAHAM SEMASA']),
      escapeCSVField(member['ID DAFTAR']),
      escapeCSVField(member['TARIKH DAFTAR AHLI']),
      escapeCSVField(member['TARIKH BEHENTI']),
      escapeCSVField(member.JANTINA),
      escapeCSVField(member['NO TEL']),
      escapeCSVField(member['STATUS AHLI']),
      escapeCSVField(member['PENAMBAHAN SAHAM']),
      escapeCSVField(member['PENGELUARAN SAHAM']),
      escapeCSVField(member['DIVIDEN TAHUN SEMASA']),
      escapeCSVField(member.CATATAN)
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSVField(val: string | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const text = String(val);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
