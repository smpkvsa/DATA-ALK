import React, { useState, useMemo } from 'react';
import { Member, SystemSettings } from '../types';
import { parseCurrency, formatCurrency, exportToCSV } from '../utils/memberUtils';
import { 
  FileSpreadsheet, 
  Printer, 
  FileText, 
  HelpCircle,
  Download,
  Sliders,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';

interface ReportsProps {
  members: Member[];
  settings: SystemSettings;
  onTriggerPrint: (reportMembers: Member[], reportTitle: string) => void;
}

type ReportType = 'aktif' | 'premium' | 'berhenti' | 'dividen' | 'custom';

export default function Reports({ members, settings, onTriggerPrint }: ReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('aktif');
  
  // Custom Filters state
  const [statusDaftar, setStatusDaftar] = useState('DAFTAR');
  const [statusAhli, setStatusAhli] = useState('');
  const [jantina, setJantina] = useState('');
  const [minSaham, setMinSaham] = useState('');
  const [maxSaham, setMaxSaham] = useState('');

  // Sesi/Syllabus options
  const statusAhliOptions = useMemo(() => {
    const statuses = new Set<string>();
    members.forEach(m => {
      if (m['STATUS AHLI']) {
        statuses.add(m['STATUS AHLI'].trim().toUpperCase());
      }
    });
    return Array.from(statuses).sort();
  }, [members]);

  // Set preset filters when report type changes
  const activeFilters = useMemo(() => {
    switch (reportType) {
      case 'aktif':
        return {
          title: 'Laporan Senarai Ahli Aktif',
          desc: 'Senarai penuh ahli berdaftar yang masih aktif melabur di dalam koperasi.',
          statusDaftar: 'DAFTAR',
          statusAhli: '',
          jantina: '',
          minSaham: undefined,
          maxSaham: undefined
        };
      case 'premium':
        return {
          title: 'Laporan Pemegang Saham Premium',
          desc: 'Ahli aktif dengan pegangan saham tinggi bernilai RM 1,000.00 ke atas.',
          statusDaftar: 'DAFTAR',
          statusAhli: '',
          jantina: '',
          minSaham: 1000,
          maxSaham: undefined
        };
      case 'berhenti':
        return {
          title: 'Laporan Ahli Tamat / Berhenti',
          desc: 'Senarai ahli yang telah memberhentikan keahlian mereka dan status pemulangan syer.',
          statusDaftar: 'BERHENTI',
          statusAhli: '',
          jantina: '',
          minSaham: undefined,
          maxSaham: undefined
        };
      case 'dividen':
        return {
          title: 'Laporan Pembayaran Dividen Semasa',
          desc: `Anggaran pembayaran dividen ahli aktif mengikut kadar semasa (${settings.dividendRate}%).`,
          statusDaftar: 'DAFTAR',
          statusAhli: '',
          jantina: '',
          minSaham: undefined,
          maxSaham: undefined
        };
      case 'custom':
        return {
          title: 'Laporan Kustom Sistem',
          desc: 'Laporan khas mengikut kriteria tapis yang dipilih secara terperinci.',
          statusDaftar: statusDaftar || undefined,
          statusAhli: statusAhli || undefined,
          jantina: jantina || undefined,
          minSaham: minSaham ? parseFloat(minSaham) : undefined,
          maxSaham: maxSaham ? parseFloat(maxSaham) : undefined
        };
    }
  }, [reportType, settings.dividendRate, statusDaftar, statusAhli, jantina, minSaham, maxSaham]);

  // Run filtering
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Skipp completely empty placeholders
      if (!member.NAMA && !member.ID) return false;

      // Filter Status Daftar
      if (activeFilters.statusDaftar && member['ID DAFTAR'] !== activeFilters.statusDaftar) {
        return false;
      }

      // Filter Role/Status Ahli
      if (activeFilters.statusAhli && member['STATUS AHLI'] !== activeFilters.statusAhli) {
        return false;
      }

      // Filter Gender
      if (activeFilters.jantina && member.JANTINA !== activeFilters.jantina) {
        return false;
      }

      // Filter Share Range
      const saham = parseCurrency(member['JUMLAH SAHAM SEMASA']);
      if (activeFilters.minSaham !== undefined && saham < activeFilters.minSaham) {
        return false;
      }
      if (activeFilters.maxSaham !== undefined && saham > activeFilters.maxSaham) {
        return false;
      }

      return true;
    });
  }, [members, activeFilters]);

  // Report statistics summary
  const reportStats = useMemo(() => {
    let totalSaham = 0;
    let totalDividen = 0;
    let countActive = 0;
    let countStopped = 0;

    filteredMembers.forEach(m => {
      const isStopped = m['ID DAFTAR'] === 'BERHENTI';
      const value = parseCurrency(m['JUMLAH SAHAM SEMASA']);
      
      totalSaham += value;
      if (isStopped) {
        countStopped++;
      } else {
        countActive++;
        totalDividen += (value * settings.dividendRate) / 100;
      }
    });

    return {
      totalSaham,
      totalDividen,
      countActive,
      countStopped,
      totalCount: filteredMembers.length
    };
  }, [filteredMembers, settings.dividendRate]);

  // Handle excel export click
  const handleExportExcel = () => {
    const filename = `${activeFilters.title.toLowerCase().replace(/\s+/g, '_')}_${settings.financialYear}`;
    exportToCSV(filteredMembers, filename);
  };

  // Handle PDF/Print click
  const handlePrint = () => {
    onTriggerPrint(filteredMembers, activeFilters.title);
  };

  return (
    <div className="space-y-6" id="reports-container">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">Pusat Laporan Automatik</h2>
        <p className="text-xs text-slate-400">Pilih kriteria laporan, analisis statistik agregat, dan eksport terus ke PDF atau Excel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Preset Selection */}
        <div className="space-y-4 lg:col-span-1">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Pilihan Laporan</span>
          
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col divide-y divide-slate-100/50">
            {/* Active Report Preset */}
            <button
              onClick={() => setReportType('aktif')}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                reportType === 'aktif' ? 'bg-slate-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
              }`}
            >
              <FileText className={`w-5 h-5 shrink-0 ${reportType === 'aktif' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-xs text-slate-800 block">Laporan Ahli Aktif</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Ahli aktif berdaftar semasa</span>
              </div>
            </button>

            {/* Premium Shareholders Preset */}
            <button
              onClick={() => setReportType('premium')}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                reportType === 'premium' ? 'bg-slate-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
              }`}
            >
              <TrendingUp className={`w-5 h-5 shrink-0 ${reportType === 'premium' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-xs text-slate-800 block">Pemegang Premium</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Syer bernilai ≥ RM1,000.00</span>
              </div>
            </button>

            {/* Resigned Members Preset */}
            <button
              onClick={() => setReportType('berhenti')}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                reportType === 'berhenti' ? 'bg-slate-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
              }`}
            >
              <Sliders className={`w-5 h-5 shrink-0 ${reportType === 'berhenti' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-xs text-slate-800 block">Laporan Ahli Berhenti</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Ahli tamat atau tarik diri</span>
              </div>
            </button>

            {/* Dividend Payouts Preset */}
            <button
              onClick={() => setReportType('dividen')}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                reportType === 'dividen' ? 'bg-slate-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
              }`}
            >
              <FileSpreadsheet className={`w-5 h-5 shrink-0 ${reportType === 'dividen' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-xs text-slate-800 block">Pembayaran Dividen</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Penyata dividen {settings.dividendRate}%</span>
              </div>
            </button>

            {/* Custom Filters */}
            <button
              onClick={() => setReportType('custom')}
              className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                reportType === 'custom' ? 'bg-slate-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
              }`}
            >
              <Sliders className={`w-5 h-5 shrink-0 ${reportType === 'custom' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-xs text-slate-800 block">Carian Kustom</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Penapis mengikut keperluan</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Columns: Configuration and Preview */}
        <div className="space-y-6 lg:col-span-3">
          {/* Custom Filters Input Form (Only visible if Custom report selected) */}
          {reportType === 'custom' && (
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Pilihan Tapis Laporan Kustom</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Status Daftar</label>
                  <select
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-700"
                    value={statusDaftar}
                    onChange={(e) => setStatusDaftar(e.target.value)}
                  >
                    <option value="">Semua Status</option>
                    <option value="DAFTAR">DAFTAR (Aktif)</option>
                    <option value="BERHENTI">BERHENTI (Tamat)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kategori Ahli</label>
                  <select
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-700"
                    value={statusAhli}
                    onChange={(e) => setStatusAhli(e.target.value)}
                  >
                    <option value="">Semua Peranan</option>
                    {statusAhliOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Jantina</label>
                  <select
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-700"
                    value={jantina}
                    onChange={(e) => setJantina(e.target.value)}
                  >
                    <option value="">Semua Jantina</option>
                    <option value="LELAKI">Lelaki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Saham Minimum (RM)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-700 font-mono"
                    placeholder="Contoh: 100"
                    value={minSaham}
                    onChange={(e) => setMinSaham(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Saham Maksimum (RM)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-700 font-mono"
                    placeholder="Contoh: 5000"
                    value={maxSaham}
                    onChange={(e) => setMaxSaham(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Report Metadata and Summary Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            {/* Header of Preview */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded font-mono font-bold text-slate-600 block w-max">
                  TAHUN KEWANGAN {settings.financialYear}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2 font-sans tracking-tight">
                  {activeFilters.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeFilters.desc}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 shrink-0 self-stretch sm:self-auto">
                <button
                  onClick={handleExportExcel}
                  disabled={filteredMembers.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                  title="Export to Excel / CSV"
                >
                  <Download className="w-4 h-4" /> Eksport Excel
                </button>
                <button
                  onClick={handlePrint}
                  disabled={filteredMembers.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/10 transition-colors disabled:opacity-50"
                  title="Print / Export as PDF"
                >
                  <Printer className="w-4 h-4" /> Eksport PDF
                </button>
              </div>
            </div>

            {/* Agregate Report Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jumlah Rekod</span>
                <span className="text-xl font-bold text-slate-800 font-mono block mt-1">{reportStats.totalCount} Ahli</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ahli Aktif</span>
                <span className="text-xl font-bold text-slate-800 font-mono block mt-1">{reportStats.countActive}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jumlah Saham</span>
                <span className="text-xl font-bold text-emerald-600 font-mono block mt-1">{formatCurrency(reportStats.totalSaham)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Anggaran Dividen</span>
                <span className="text-xl font-bold text-indigo-600 font-mono block mt-1">{formatCurrency(reportStats.totalDividen)}</span>
              </div>
            </div>

            {/* Table of Preview Records */}
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Previu Data (Maksimum 10 baris pertama)</span>
              
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 uppercase tracking-wider font-mono z-10">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">No Ahli</th>
                        <th className="py-2.5 px-3 font-semibold">Nama Ahli</th>
                        <th className="py-2.5 px-3 font-semibold">No K/P</th>
                        <th className="py-2.5 px-3 font-semibold">Status / Jantina</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Pegangan Saham</th>
                        {reportType === 'dividen' && <th className="py-2.5 px-3 font-semibold text-right">Dividen ({settings.dividendRate}%)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.slice(0, 10).map((m) => {
                          const value = parseCurrency(m['JUMLAH SAHAM SEMASA']);
                          return (
                            <tr key={m.ID} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono text-slate-400">
                                #{m['NO AHLI'] || m.ID}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {m.NAMA || 'TIADA NAMA'}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {m['NO K/P'] || '-'}
                              </td>
                              <td className="py-2.5 px-3">
                                {m['STATUS AHLI'] || 'LAIN'} ({m.JANTINA || 'Tiada'})
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-800 font-mono">
                                {formatCurrency(value)}
                              </td>
                              {reportType === 'dividen' && (
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-600 font-mono">
                                  {formatCurrency((value * settings.dividendRate) / 100)}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                            Tiada rekod data sepadan dengan kriteria laporan ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {filteredMembers.length > 10 && (
                <p className="text-[10px] text-slate-400 text-right">
                  * Dan {filteredMembers.length - 10} baris lagi... (Gunakan eksport penuh Excel atau PDF untuk melihat keseluruhan rekod).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
