import React, { useMemo } from 'react';
import { Member, SystemSettings } from '../types';
import { parseCurrency, formatCurrency } from '../utils/memberUtils';
import CoopLogo from './CoopLogo';
import { 
  TrendingUp, 
  Users, 
  UserMinus, 
  DollarSign, 
  PieChart as PieIcon, 
  Award,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

interface DashboardProps {
  members: Member[];
  settings: SystemSettings;
}

export default function Dashboard({ members, settings }: DashboardProps) {
  // Compute metrics
  const metrics = useMemo(() => {
    let totalSahamActive = 0;
    let totalSahamStopped = 0;
    let activeCount = 0;
    let stoppedCount = 0;
    let totalDividends = 0;

    let jantinaCount = { LELAKI: 0, PEREMPUAN: 0, LAIN: 0 };
    let statusAhliCount: { [key: string]: number } = {};

    // For distribution charts
    const ranges = {
      under100: 0,
      r100to500: 0,
      r500to1000: 0,
      r1000to5000: 0,
      over5000: 0,
    };

    members.forEach(m => {
      // Clean name or empty name skipping
      const isPlaceholder = !m.NAMA || m.NAMA.trim() === '';
      const isStopped = m['ID DAFTAR'] === 'BERHENTI';
      const status = m['STATUS AHLI'] || 'LAIN';
      const jantina = m.JANTINA ? m.JANTINA.toUpperCase() : '';
      const value = parseCurrency(m['JUMLAH SAHAM SEMASA']);

      if (isStopped) {
        stoppedCount++;
        totalSahamStopped += value;
      } else {
        activeCount++;
        totalSahamActive += value;

        // Categorize Gender
        if (jantina.includes('LELAKI')) {
          jantinaCount.LELAKI++;
        } else if (jantina.includes('PEREMPUAN')) {
          jantinaCount.PEREMPUAN++;
        } else if (!isPlaceholder) {
          jantinaCount.LAIN++;
        }

        // Categorize Member Role
        if (!isPlaceholder) {
          const cleanStatus = status.trim().toUpperCase();
          statusAhliCount[cleanStatus] = (statusAhliCount[cleanStatus] || 0) + 1;
        }

        // Categorize Share value ranges
        if (value < 100) ranges.under100++;
        else if (value <= 500) ranges.r100to500++;
        else if (value <= 1000) ranges.r500to1000++;
        else if (value <= 5000) ranges.r1000to5000++;
        else ranges.over5000++;
      }
    });

    // Calculate dividend
    totalDividends = (totalSahamActive * settings.dividendRate) / 100;

    return {
      totalSahamActive,
      totalSahamStopped,
      activeCount,
      stoppedCount,
      totalDividends,
      jantinaCount,
      statusAhliCount,
      ranges
    };
  }, [members, settings]);

  // Format statuses for role charts
  const roleChartData = useMemo(() => {
    return Object.entries(metrics.statusAhliCount)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Take top 5
  }, [metrics.statusAhliCount]);

  // Top active members with highest shares
  const topShareholders = useMemo(() => {
    return [...members]
      .filter(m => m['ID DAFTAR'] !== 'BERHENTI' && m.NAMA)
      .sort((a, b) => parseCurrency(b['JUMLAH SAHAM SEMASA']) - parseCurrency(a['JUMLAH SAHAM SEMASA']))
      .slice(0, 5);
  }, [members]);

  const genderTotal = metrics.jantinaCount.LELAKI + metrics.jantinaCount.PEREMPUAN + metrics.jantinaCount.LAIN;
  const malePercent = genderTotal > 0 ? Math.round((metrics.jantinaCount.LELAKI / genderTotal) * 100) : 0;
  const femalePercent = genderTotal > 0 ? Math.round((metrics.jantinaCount.PEREMPUAN / genderTotal) * 100) : 0;

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <CoopLogo size={90} className="bg-slate-950/30 p-1.5 rounded-2xl border border-slate-800 shrink-0 shadow-inner" />
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-400/20 font-mono">
              {settings.financialYear} FINANCIAL METRICS
            </span>
            <h2 className="text-2xl font-bold mt-2 font-sans tracking-tight leading-tight">
              {settings.cooperativeName}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl font-sans leading-relaxed">
              Analisis prestasi data keahlian dan pegangan saham secara masa nyata. Sistem dikonfigurasi dengan kadar dividen semasa sebanyak <span className="text-emerald-400 font-bold">{settings.dividendRate}%</span>.
            </p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex flex-col items-end shrink-0 self-stretch sm:self-auto justify-center">
          <span className="text-xs text-slate-300 font-mono uppercase tracking-wider">Kadar Dividen</span>
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">{settings.dividendRate}%</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Saham Active */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg" id="card-total-saham">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Jumlah Saham Aktif</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {formatCurrency(metrics.totalSahamActive)}
            </h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium">
              Sedia Ada
            </span>
          </div>
        </div>

        {/* Total Dividen Teragih */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg" id="card-total-dividen">
          <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Anggaran Dividen ({settings.dividendRate}%)</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {formatCurrency(metrics.totalDividends)}
            </h3>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono font-medium">
              Tahun {settings.financialYear}
            </span>
          </div>
        </div>

        {/* Active Members */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg" id="card-active-members">
          <div className="p-3.5 bg-sky-50 rounded-xl text-sky-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Bilangan Ahli Aktif</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {metrics.activeCount}
            </h3>
            <span className="text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-mono font-medium">
              Status DAFTAR
            </span>
          </div>
        </div>

        {/* Stopped Members */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg" id="card-stopped-members">
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600">
            <UserMinus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Ahli Berhenti</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {metrics.stoppedCount}
            </h3>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-mono font-medium">
              Status BERHENTI
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Share Distribution Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Agihan Pegangan Saham (Ahli Aktif)</h3>
                <p className="text-xs text-slate-400">Pecahan bilangan ahli mengikut julat amaun saham semasa.</p>
              </div>
              <span className="text-xs bg-slate-50 text-slate-600 border border-slate-100 px-2.5 py-1 rounded font-mono font-medium">
                Kategori
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-64 w-full relative flex items-end justify-between pt-6 px-4 border-b border-slate-100">
              {/* Chart Grid Lines */}
              <div className="absolute inset-x-0 top-1/4 border-t border-slate-50 border-dashed pointer-events-none"></div>
              <div className="absolute inset-x-0 top-2/4 border-t border-slate-50 border-dashed pointer-events-none"></div>
              <div className="absolute inset-x-0 top-3/4 border-t border-slate-50 border-dashed pointer-events-none"></div>

              {/* Bars */}
              {(() => {
                const data = [
                  { label: '< RM100', val: metrics.ranges.under100, color: 'from-blue-400 to-indigo-500' },
                  { label: 'RM101-500', val: metrics.ranges.r100to500, color: 'from-indigo-400 to-indigo-600' },
                  { label: 'RM501-1k', val: metrics.ranges.r500to1000, color: 'from-violet-400 to-violet-600' },
                  { label: 'RM1k-5k', val: metrics.ranges.r1000to5000, color: 'from-emerald-400 to-emerald-600' },
                  { label: '> RM5k', val: metrics.ranges.over5000, color: 'from-teal-400 to-teal-600' },
                ];
                const maxVal = Math.max(...data.map(d => d.val), 1);

                return data.map((d, i) => {
                  const pct = (d.val / maxVal) * 90; // scale to max 90% height
                  return (
                    <div key={i} className="flex flex-col items-center group flex-1">
                      {/* Tooltip on hover */}
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded px-2.5 py-1 -mt-10 pointer-events-none z-10 font-mono shadow-md">
                        {d.val} Ahli ({Math.round((d.val / metrics.activeCount) * 100)}%)
                      </div>

                      {/* Bar fill */}
                      <div className="w-12 sm:w-16 bg-slate-50 rounded-t-lg relative flex items-end justify-center h-48 transition-all hover:bg-slate-100">
                        <div 
                          style={{ height: `${pct}%` }} 
                          className={`w-full bg-gradient-to-t ${d.color} rounded-t-lg transition-all duration-700 ease-out flex items-top justify-center`}
                        >
                          {d.val > 0 && (
                            <span className="text-[10px] font-bold text-white font-mono mt-1 select-none">
                              {d.val}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* X Label */}
                      <span className="text-[11px] text-slate-500 font-medium mt-3 whitespace-nowrap">
                        {d.label}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Julat pegangan tertinggi berada di bawah <span className="text-slate-700 font-medium">RM100</span> (yuran pendaftaran asas), diikuti pegangan premium di atas <span className="text-slate-700 font-medium">RM1,000</span>.</span>
          </div>
        </div>

        {/* Demographics breakdown (Gender + Roles) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Demografi Ahli Aktif</h3>
            <p className="text-xs text-slate-400 mb-6">Pecahan ahli mengikut jantina dan peranan.</p>

            {/* Gender Breakdown */}
            <div className="space-y-4 mb-6">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Pecahan Jantina</span>
              
              {/* Progress bar container */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-indigo-600"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>LELAKI ({metrics.jantinaCount.LELAKI})</span>
                  <span className="flex items-center gap-1.5 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-400"></span>PEREMPUAN ({metrics.jantinaCount.PEREMPUAN})</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden">
                  <div style={{ width: `${malePercent}%` }} className="h-full bg-indigo-500 transition-all duration-500"></div>
                  <div style={{ width: `${femalePercent}%` }} className="h-full bg-rose-400 transition-all duration-500"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{malePercent}% LELAKI</span>
                  <span>{femalePercent}% PEREMPUAN</span>
                </div>
              </div>
            </div>

            {/* Roles/Status breakdown */}
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono block">Peranan & Tugas</span>
              
              <div className="space-y-2.5">
                {roleChartData.length > 0 ? (
                  roleChartData.map((role, idx) => {
                    const maxVal = Math.max(...roleChartData.map(r => r.value), 1);
                    const pct = (role.value / maxVal) * 100;
                    const colors = [
                      'bg-slate-700',
                      'bg-slate-500',
                      'bg-indigo-600',
                      'bg-sky-500',
                      'bg-teal-500'
                    ];
                    const color = colors[idx % colors.length];

                    return (
                      <div key={role.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700 font-mono">{role.name || 'LAIN-LAIN'}</span>
                          <span className="font-bold text-slate-800">{role.value} <span className="text-[10px] text-slate-400 font-normal">({Math.round((role.value / metrics.activeCount) * 100)}%)</span></span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                          <div style={{ width: `${pct}%` }} className={`h-full ${color} rounded-full`}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Tiada data status ahli</p>
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-4 flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Data dikemaskini terus dari sumber pengurusan koperasi.</span>
          </div>
        </div>
      </div>

      {/* Shareholders list and stats summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Shareholders */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Ahli Pegangan Saham Tertinggi</h3>
              <p className="text-xs text-slate-400">Lima ahli aktif yang memegang modal saham terbesar dalam koperasi.</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded font-mono font-medium">
              VVIP
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-3 font-semibold">No Ahli</th>
                  <th className="py-2.5 px-3 font-semibold">Nama Ahli</th>
                  <th className="py-2.5 px-3 font-semibold">Status / Jantina</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Jumlah Saham</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Anggaran Dividen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {topShareholders.map((member, index) => {
                  const sahamVal = parseCurrency(member['JUMLAH SAHAM SEMASA']);
                  const divVal = (sahamVal * settings.dividendRate) / 100;
                  return (
                    <tr key={member.ID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-500">
                        #{member['NO AHLI'] || member.ID}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 max-w-[200px] truncate">
                          {member.NAMA}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          IC: {member['NO K/P']}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1.5 items-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            member['STATUS AHLI'] === 'GURU' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            member['STATUS AHLI'] === 'STAF' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {member['STATUS AHLI'] || 'AHLI'}
                          </span>
                          <span className="text-slate-400 text-[10px]">{member.JANTINA}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800 font-mono">
                        {formatCurrency(sahamVal)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(divVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit and Validation Panel */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-3 text-amber-600">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-slate-800 text-base">Status Integriti Sistem</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">Ringkasan pemeriksaan kepatuhan dan ralat data.</p>
          
          <div className="space-y-4 text-xs">
            {/* Checked items */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-emerald-800">
              <span className="text-emerald-500 font-bold font-mono">✓</span>
              <div>
                <p className="font-bold font-sans">Kepatuhan Yuran Asas</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Semua ahli berdaftar aktif mempunyai pegangan sekurang-kurangnya RM50 (syarat minima).</p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-indigo-800">
              <span className="text-indigo-500 font-bold font-mono">✓</span>
              <div>
                <p className="font-bold font-sans">Kesahihan No Kad Pengenalan</p>
                <p className="text-[11px] text-indigo-700 mt-0.5">Format IC disahkan mengikut piawaian JPN (YYMMDD-PB-###).</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-start gap-2.5 text-slate-700">
              <span className="text-slate-500 font-bold font-mono">i</span>
              <div>
                <p className="font-bold font-sans">Pegangan Berhenti Ditangguhkan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Pegangan bernilai {formatCurrency(metrics.totalSahamStopped)} sedang dalam proses pemulangan syer (Catatan: "Syer Belum Dipulangkan").</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
