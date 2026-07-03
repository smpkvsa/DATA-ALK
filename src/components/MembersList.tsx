import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { filterMembers, parseCurrency, formatCurrency } from '../utils/memberUtils';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  CreditCard, 
  Phone, 
  Info,
  Calendar,
  X,
  FileCheck
} from 'lucide-react';

interface MembersListProps {
  members: Member[];
}

export default function MembersList({ members }: MembersListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDaftar, setStatusDaftar] = useState('');
  const [statusAhli, setStatusAhli] = useState('');
  const [jantina, setJantina] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Compute unique Status Ahli values for filter dropdown
  const statusAhliOptions = useMemo(() => {
    const statuses = new Set<string>();
    members.forEach(m => {
      if (m['STATUS AHLI']) {
        statuses.add(m['STATUS AHLI'].trim().toUpperCase());
      }
    });
    return Array.from(statuses).sort();
  }, [members]);

  // Apply filters
  const filtered = useMemo(() => {
    // Reset page to 1 when filters or search change
    return filterMembers(members, searchQuery, {
      statusDaftar: statusDaftar || undefined,
      statusAhli: statusAhli || undefined,
      jantina: jantina || undefined
    });
  }, [members, searchQuery, statusDaftar, statusAhli, jantina]);

  // Adjust pagination when search query updates
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusDaftar, statusAhli, jantina]);

  // Calculate paginated members
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  // Clear all filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusDaftar('');
    setStatusAhli('');
    setJantina('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6" id="members-list-container">
      {/* Header and Summary count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">Eksplorasi Pangkalan Data Ahli</h2>
          <p className="text-xs text-slate-400">Cari, tapis, dan lihat profil lengkap ahli koperasi.</p>
        </div>
        <div className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-800 font-mono font-bold px-3 py-1.5 rounded-full">
          Menunjukkan {filtered.length} daripada {members.length} Ahli
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, IC, No Ahli atau ID..."
              className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-slate-700 placeholder-slate-400 font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Daftar Filter */}
          <div className="relative">
            <select
              className="w-full px-3 py-2.5 glass-input rounded-xl text-sm text-slate-700 font-sans appearance-none"
              value={statusDaftar}
              onChange={(e) => setStatusDaftar(e.target.value)}
            >
              <option value="">Semua Status Daftar</option>
              <option value="DAFTAR">Aktif (DAFTAR)</option>
              <option value="BERHENTI">Tamat (BERHENTI)</option>
            </select>
          </div>

          {/* Jantina Filter */}
          <div className="relative">
            <select
              className="w-full px-3 py-2.5 glass-input rounded-xl text-sm text-slate-700 font-sans appearance-none"
              value={jantina}
              onChange={(e) => setJantina(e.target.value)}
            >
              <option value="">Semua Jantina</option>
              <option value="LELAKI">Lelaki</option>
              <option value="PEREMPUAN">Perempuan</option>
            </select>
          </div>
        </div>

        {/* Status Ahli / Role Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tapis Kategori:
          </span>
          <button
            onClick={() => setStatusAhli('')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              !statusAhli 
                ? 'bg-slate-800 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          {statusAhliOptions.map(option => (
            <button
              key={option}
              onClick={() => setStatusAhli(option)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusAhli === option 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {option}
            </button>
          ))}

          {(searchQuery || statusDaftar || statusAhli || jantina) && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-rose-500 hover:text-rose-600 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Padam Penapis
            </button>
          )}
        </div>
      </div>

      {/* Main Table section */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="members-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4 font-semibold">No Ahli</th>
                <th className="py-3 px-4 font-semibold">Nama Penuh</th>
                <th className="py-3 px-4 font-semibold">No IC / KP</th>
                <th className="py-3 px-4 font-semibold">Kategori / Sesi</th>
                <th className="py-3 px-4 font-semibold text-right">Jumlah Saham</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => {
                  const isStopped = member['ID DAFTAR'] === 'BERHENTI';
                  const sahamVal = parseCurrency(member['JUMLAH SAHAM SEMASA']);
                  
                  return (
                    <tr key={member.ID} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {member['NO AHLI'] ? `#${member['NO AHLI']}` : `ID ${member.ID}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 font-sans max-w-[280px] truncate" title={member.NAMA}>
                          {member.NAMA || 'TIADA NAMA'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {member.JANTINA || 'Tiada maklumat jantina'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {member['NO K/P'] || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">{member['STATUS AHLI'] || 'LAIN-LAIN'}</div>
                        {member.SESI && <div className="text-[10px] text-slate-400 font-mono">Sesi: {member.SESI}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                        {formatCurrency(sahamVal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isStopped 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {isStopped ? 'BERHENTI' : 'DAFTAR'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium hover:text-slate-950 transition-colors"
                        >
                          Lihat Profil
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Tiada keputusan ditemui bagi carian "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Papar baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-600">
              Muka <span className="font-bold text-slate-800">{currentPage}</span> daripada <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Member Profile Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white relative flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-white/10 text-indigo-200 font-mono font-bold px-2 py-0.5 rounded border border-white/10">
                  {selectedMember['ID DAFTAR'] === 'BERHENTI' ? 'REKOD TAMAT' : 'AHLI DAFTAR'}
                </span>
                <h3 className="text-lg font-bold font-sans mt-2 tracking-tight">
                  {selectedMember.NAMA || 'TIADA NAMA'}
                </h3>
                <p className="text-indigo-200 text-xs font-mono mt-0.5">
                  ID Ahli: {selectedMember['NO AHLI'] || 'Tiada'} (ID Sistem: {selectedMember.ID})
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
              {/* Profile details section */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">No. K/P (IC)</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedMember['NO K/P'] || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Jantina</span>
                  <span className="font-medium text-slate-800">{selectedMember.JANTINA || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">No. Telefon</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedMember['NO TEL'] || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Kategori Ahli</span>
                  <span className="font-semibold text-indigo-600">{selectedMember['STATUS AHLI'] || '-'}</span>
                </div>
              </div>

              {/* Financial Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Ringkasan Kewangan & Saham
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">Saham Semasa</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono block mt-1">
                      {formatCurrency(parseCurrency(selectedMember['JUMLAH SAHAM SEMASA']))}
                    </span>
                  </div>

                  <div className="bg-amber-50/30 p-3 rounded-lg border border-amber-100">
                    <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">Syer Tambahan</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                      {selectedMember['PENAMBAHAN SAHAM'] || 'RM 0.00'}
                    </span>
                    {selectedMember['TARIKH PENAMBAHAN'] && (
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Tkh: {selectedMember['TARIKH PENAMBAHAN']}</span>
                    )}
                  </div>

                  <div className="bg-rose-50/30 p-3 rounded-lg border border-rose-100">
                    <span className="text-[10px] text-rose-800 uppercase font-bold tracking-wider block">Syer Dikeluarkan</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                      {selectedMember['PENGELUARAN SAHAM'] || 'RM 0.00'}
                    </span>
                    {selectedMember['TARIKH PENGELUARAN'] && (
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Tkh: {selectedMember['TARIKH PENGELUARAN']}</span>
                    )}
                  </div>

                  <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100">
                    <span className="text-[10px] text-sky-800 uppercase font-bold tracking-wider block">Dividen Terkini</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                      {selectedMember['DIVIDEN TAHUN SEMASA'] || 'RM 0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Log Dates and Status details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Sejarah Pendaftaran
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tarikh Daftar</span>
                    <span className="font-medium text-slate-700">{selectedMember['TARIKH DAFTAR AHLI'] || 'Tiada Rekod'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tarikh Berhenti</span>
                    <span className="font-medium text-slate-700">{selectedMember['TARIKH BEHENTI'] || 'Aktif'}</span>
                  </div>
                  {selectedMember.SESI && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sesi/Tahun</span>
                      <span className="font-medium text-slate-700">{selectedMember.SESI}</span>
                    </div>
                  )}
                  {selectedMember.TINGKATAN && selectedMember.TINGKATAN !== '0' && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tingkatan / Unit</span>
                      <span className="font-medium text-slate-700">{selectedMember.TINGKATAN}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments/Notes */}
              {selectedMember.CATATAN && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Catatan Sistem</span>
                  <p className="text-[11px] leading-relaxed font-sans">{selectedMember.CATATAN}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup Rekod
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
