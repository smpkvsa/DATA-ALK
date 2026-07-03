export interface Member {
  ID: string;
  NAMA: string;
  "NO K/P": string;
  "NO AHLI": string;
  "JUMLAH SAHAM SEMASA": string;
  CATATAN: string;
  "ID DAFTAR": string; // "DAFTAR" | "BERHENTI" | ""
  "TARIKH DAFTAR AHLI": string;
  "TARIKH BEHENTI": string;
  JANTINA: string; // "LELAKI" | "PEREMPUAN" | ""
  "NO TEL": string;
  "STATUS AHLI": string; // "GURU" | "STAF" | "PELAJAR" | ""
  TINGKATAN: string;
  KURSUS: string;
  "PENAMBAHAN SAHAM": string;
  "TARIKH PENAMBAHAN": string;
  "PENGELUARAN SAHAM": string;
  "TARIKH PENGELUARAN": string;
  "TANDATANGAN AHLI": string;
  "NO RESIT PENAMBAHAN SAHAM": string;
  "TARIKH TAMBAH SAHAM": string;
  "DIVIDEN TAHUN SEMASA": string;
  SESI: string;
}

export interface SystemSettings {
  cooperativeName: string;
  dividendRate: number; // e.g. 5 for 5%
  financialYear: string;
  minShareAmount: number;
  googleSheetsUrl?: string;
  googleAppsScriptUrl?: string;
}
