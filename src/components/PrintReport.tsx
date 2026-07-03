import React from 'react';
import { Member, SystemSettings } from '../types';
import { parseCurrency, formatCurrency } from '../utils/memberUtils';
import { Printer, ArrowLeft, Download } from 'lucide-react';

interface PrintReportProps {
  reportMembers: Member[];
  reportTitle: string;
  settings: SystemSettings;
  onBack: () => void;
}

export default function PrintReport({
  reportMembers,
  reportTitle,
  settings,
  onBack
}: PrintReportProps) {
  
  // Calculate aggregate metrics
  const { totalSaham, totalDividen, activeCount, stoppedCount } = React.useMemo(() => {
    let totalSaham = 0;
    let totalDividen = 0;
    let activeCount = 0;
    let stoppedCount = 0;

    reportMembers.forEach(m => {
      const isStopped = m['ID DAFTAR'] === 'BERHENTI';
      const val = parseCurrency(m['JUMLAH SAHAM SEMASA']);
      totalSaham += val;
      
      if (isStopped) {
        stoppedCount++;
      } else {
        activeCount++;
        totalDividen += (val * settings.dividendRate) / 100;
      }
    });

    return { totalSaham, totalDividen, activeCount, stoppedCount };
  }, [reportMembers, settings.dividendRate]);

  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  const currentDateTimeStr = new Date().toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 md:px-8 print:bg-white print:p-0 font-sans text-slate-800" id="print-view-wrapper">
      
      {/* Control Bar (hidden in printing) */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-150 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali Ke Aplikasi
        </button>
        <button
          onClick={handleTriggerBrowserPrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-600/10 transition-colors"
        >
          <Printer className="w-4 h-4" /> Cetak / Cetak PDF (Browser)
        </button>
      </div>

      {/* Official Document Sheet */}
      <div className="max-w-5xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-md border border-slate-100 print:shadow-none print:border-none print:p-0">
        
        {/* Letterhead Header */}
        <div className="border-b-4 border-slate-900 pb-5 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-sans uppercase">
              {settings.cooperativeName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              SISTEM PORTAL INTEGRASI DATA & SAHAM AHLI • LAPORAN RASMI
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Dijana Pada: {currentDateTimeStr} • Sesi Penyata: {settings.financialYear}
            </p>
          </div>
          <div className="border-2 border-slate-900 px-4 py-2 rounded font-mono font-bold text-center text-xs text-slate-900 bg-slate-50 shrink-0 uppercase tracking-widest">
            KOPERASI RASMI
          </div>
        </div>

        {/* Report Metadata */}
        <div className="mt-6 text-center">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900 font-sans underline decoration-2 underline-offset-4">
            {reportTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Penyata Ringkasan Prestasi dan Ahli Mengikut Rekod Terkini</p>
        </div>

        {/* Aggregated Statistical Table */}
        <div className="mt-8 bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Jumlah Rekod</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono block">{reportMembers.length} Ahli</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Ahli Aktif</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono block">{activeCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Jumlah Saham</span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono block">{formatCurrency(totalSaham)}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Anggaran Dividen ({settings.dividendRate}%)</span>
            <span className="text-sm font-extrabold text-indigo-700 font-mono block">{formatCurrency(totalDividen)}</span>
          </div>
        </div>

        {/* Data Records Table */}
        <div className="mt-8 overflow-hidden border border-slate-250 rounded-xl">
          <table className="w-full text-left border-collapse text-[11px] text-slate-800">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-250 font-mono text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                <th className="py-2.5 px-3">ID / No Ahli</th>
                <th className="py-2.5 px-3">Nama Penuh Ahli</th>
                <th className="py-2.5 px-3">No K/P</th>
                <th className="py-2.5 px-3 text-center">Status / Jantina</th>
                <th className="py-2.5 px-3 text-right">Pegangan Saham</th>
                <th className="py-2.5 px-3 text-right">Anggaran Dividen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportMembers.map((m, index) => {
                const saham = parseCurrency(m['JUMLAH SAHAM SEMASA']);
                const isStopped = m['ID DAFTAR'] === 'BERHENTI';
                const div = isStopped ? 0 : (saham * settings.dividendRate) / 100;

                return (
                  <tr key={m.ID} className="page-break-inside-avoid">
                    <td className="py-2 px-3 font-mono text-slate-500 font-bold">
                      {m['NO AHLI'] ? `#${m['NO AHLI']}` : `ID ${m.ID}`}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {m.NAMA || 'TIADA NAMA'}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {m['NO K/P'] || '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="font-semibold">{m['STATUS AHLI'] || 'AHLI'}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-1">({m.JANTINA || 'L/P'})</span>
                      {isStopped && <span className="text-rose-600 font-extrabold text-[9px] ml-1.5">[TAMAT]</span>}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {formatCurrency(saham)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(div)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Corporate Signing / Certification Footer Section */}
        <div className="mt-16 pt-8 border-t border-dashed border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-750 page-break-inside-avoid" id="signing-section">
          <div className="space-y-16">
            <div className="border-b border-slate-900 w-4/5 mx-auto"></div>
            <div>
              <p className="font-bold uppercase tracking-wider">Disediakan Oleh</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Setiausaha Koperasi</p>
            </div>
          </div>

          <div className="space-y-16">
            <div className="border-b border-slate-900 w-4/5 mx-auto"></div>
            <div>
              <p className="font-bold uppercase tracking-wider">Disahkan Benar</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Bendahari Kehormat</p>
            </div>
          </div>

          <div className="space-y-16">
            <div className="border-b border-slate-900 w-4/5 mx-auto"></div>
            <div>
              <p className="font-bold uppercase tracking-wider">Diluluskan Oleh</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Pengerusi Lembaga Koperasi</p>
            </div>
          </div>
        </div>

        {/* Print Disclaimer */}
        <div className="mt-12 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-4 hidden print:block">
          * Laporan ini dicetak secara automatik daripada Sistem Pengurusan Data Koperasi VoxMaju. Sebarang pengubahan atau pemalsuan data bertentangan dengan Akta Koperasi 1993 adalah menyalahi undang-undang.
        </div>
      </div>
    </div>
  );
}
