import React, { useState, useMemo, useEffect } from 'react';
import { Member, SystemSettings } from '../types';
import { parseCurrency, formatCurrency, isRegisteredBefore2023 } from '../utils/memberUtils';
import { syncToGoogleSheets } from '../utils/appsScriptSync';
import { 
  Lock, 
  Settings, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Save, 
  LogOut, 
  Plus, 
  Eye, 
  EyeOff, 
  Info,
  Sliders,
  CheckCircle,
  XCircle,
  Users,
  Database,
  RefreshCw,
  ExternalLink,
  Code
} from 'lucide-react';

interface AdminPanelProps {
  members: Member[];
  settings: SystemSettings;
  onUpdateMembers: (newMembers: Member[]) => void;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  adminLoggedIn: boolean;
  onSetAdminLoggedIn: (loggedIn: boolean) => void;
}

type AdminTab = 'members' | 'settings';

export default function AdminPanel({
  members,
  settings,
  onUpdateMembers,
  onUpdateSettings,
  adminLoggedIn,
  onSetAdminLoggedIn
}: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Tab inside Admin Panel once logged in
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('members');
  
  // Member management state
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state for Add / Edit Member
  const [formState, setFormState] = useState<Partial<Member>>({});

  // Handle Login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'voxmajuterus') {
      onSetAdminLoggedIn(true);
      setLoginError('');
      setPassword('');
    } else {
      setLoginError('Kata laluan salah! Sila cuba lagi.');
    }
  };

  // Filter members list for admin panel table (simple list)
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return members.slice(0, 15); // Show first 15 by default
    return members.filter(m => 
      (m.NAMA || '').toLowerCase().includes(term) ||
      (m.ID || '').toLowerCase().includes(term) ||
      (m['NO K/P'] || '').toLowerCase().includes(term) ||
      (m['NO AHLI'] || '').toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  // Trigger notice
  const triggerNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open Edit Form
  const startEdit = (member: Member) => {
    setEditingMember(member);
    setIsAddingNew(false);
    setFormState({ ...member });
  };

  // Open Add Form
  const startAdd = () => {
    setEditingMember(null);
    setIsAddingNew(true);
    
    // Generate a secure new unique ID (integer sequence)
    const nextId = String(Math.max(...members.map(m => parseInt(m.ID) || 0)) + 1);
    const nextMemberNo = String(Math.max(...members.map(m => parseInt(m['NO AHLI']) || 0)) + 1);

    setFormState({
      ID: nextId,
      NAMA: '',
      'NO K/P': '',
      'NO AHLI': nextMemberNo,
      'JUMLAH SAHAM SEMASA': 'RM 0.00',
      'DIVIDEN 2023': 'RM 0.00',
      CATATAN: '',
      'KAEDAH KEMBALIAN SYER': '',
      'ID DAFTAR': 'DAFTAR',
      'TARIKH DAFTAR AHLI': new Date().toLocaleDateString('en-GB'),
      'TARIKH BEHENTI': '',
      JANTINA: 'LELAKI',
      'STATUS AHLI': 'GURU',
      TINGKATAN: '',
      KURSUS: '',
      'DIVIDEN SEMASA': 'RM 0.00',
      'STATUS SYER': 'AKTIF',
      // Past compatibility fields
      'NO TEL': '',
      'PENAMBAHAN SAHAM': 'RM 0.00',
      'TARIKH PENAMBAHAN': '',
      'PENGELUARAN SAHAM': 'RM 0.00',
      'TARIKH PENGELUARAN': '',
      'TANDATANGAN AHLI': '',
      'NO RESIT PENAMBAHAN SAHAM': '',
      'TARIKH TAMBAH SAHAM': '',
      'DIVIDEN TAHUN SEMASA': 'RM 0.00',
      SESI: settings.financialYear
    });
  };

  // Handle Input Changes in Add/Edit Form
  const handleInputChange = (key: keyof Member, value: string) => {
    setFormState(prev => {
      const updated = { ...prev, [key]: value };
      
      // Calculate dividend dynamically if share value or registration date changes
      if (key === 'JUMLAH SAHAM SEMASA' || key === 'TARIKH DAFTAR AHLI') {
        const numericSaham = parseCurrency(updated['JUMLAH SAHAM SEMASA']);
        const calculatedDiv = (numericSaham * settings.dividendRate) / 100;
        updated['DIVIDEN SEMASA'] = `RM ${calculatedDiv.toFixed(2)}`;
        updated['DIVIDEN TAHUN SEMASA'] = `RM ${calculatedDiv.toFixed(2)}`;
        
        if (isRegisteredBefore2023(updated['TARIKH DAFTAR AHLI'])) {
          updated['DIVIDEN 2023'] = `RM ${calculatedDiv.toFixed(2)}`;
        } else {
          updated['DIVIDEN 2023'] = 'RM 0.00';
        }
      }

      return updated;
    });
  };

  // Save Add or Edit Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.NAMA?.trim()) {
      triggerNotice('Nama ahli wajib diisi!', 'error');
      return;
    }
    if (!formState['NO K/P']?.trim()) {
      triggerNotice('No Kad Pengenalan wajib diisi!', 'error');
      return;
    }

    const memberToSave = formState as Member;

    if (isAddingNew) {
      // Check if duplicate ID or IC
      const duplicateIC = members.some(m => m['NO K/P'] === memberToSave['NO K/P']);
      if (duplicateIC) {
        triggerNotice('No KP ini sudah wujud dalam sistem!', 'error');
        return;
      }

      if (settings.googleAppsScriptUrl) {
        setIsSyncing(true);
        const res = await syncToGoogleSheets(settings.googleAppsScriptUrl, 'ADD_MEMBER', memberToSave);
        setIsSyncing(false);
        if (!res.success) {
          triggerNotice(`Sinc Gagal: ${res.message}. Data disimpan di Cache Tempatan sahaja.`, 'error');
        } else {
          triggerNotice('Ahli baru berjaya didaftarkan ke Google Sheets & Sistem!');
        }
      } else {
        triggerNotice('Ahli baru berjaya didaftarkan!');
      }

      const updatedMembers = [memberToSave, ...members];
      onUpdateMembers(updatedMembers);
      setIsAddingNew(false);
    } else if (editingMember) {
      if (settings.googleAppsScriptUrl) {
        setIsSyncing(true);
        const res = await syncToGoogleSheets(settings.googleAppsScriptUrl, 'UPDATE_MEMBER', memberToSave);
        setIsSyncing(false);
        if (!res.success) {
          triggerNotice(`Sinc Gagal: ${res.message}. Data dikemaskini di Cache Tempatan sahaja.`, 'error');
        } else {
          triggerNotice('Maklumat ahli berjaya dikemaskini ke Sistem!');
        }
      } else {
        triggerNotice('Maklumat ahli berjaya dikemaskini!');
      }

      const updatedMembers = members.map(m => m.ID === editingMember.ID ? memberToSave : m);
      onUpdateMembers(updatedMembers);
      setEditingMember(null);
    }
    
    setFormState({});
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId: string, name: string) => {
    if (window.confirm(`Adakah anda pasti mahu menghapus rekod ahli "${name}"? Tindakan ini tidak boleh diundurkan.`)) {
      if (settings.googleAppsScriptUrl) {
        setIsSyncing(true);
        const res = await syncToGoogleSheets(settings.googleAppsScriptUrl, 'DELETE_MEMBER', { ID: memberId });
        setIsSyncing(false);
        if (!res.success) {
          triggerNotice(`Sinc Gagal: ${res.message}. Data dikeluarkan dari Cache Tempatan sahaja.`, 'error');
        } else {
          triggerNotice('Rekod ahli berjaya dihapuskan dari Sistem!');
        }
      } else {
        triggerNotice('Rekod ahli berjaya dihapuskan!');
      }

      const updatedMembers = members.filter(m => m.ID !== memberId);
      onUpdateMembers(updatedMembers);
    }
  };

  // Handle Settings modification
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({ ...settings });
  
  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);
  
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.cooperativeName.trim()) {
      triggerNotice('Nama Koperasi/Kelab tidak boleh dibiarkan kosong!', 'error');
      return;
    }
    if (settingsForm.dividendRate < 0 || settingsForm.dividendRate > 100) {
      triggerNotice('Kadar dividen mestilah di antara 0% dan 100%!', 'error');
      return;
    }

    onUpdateSettings(settingsForm);
    triggerNotice('Tetapan sistem berjaya disimpan!');
  };

  // Bulk calculate all dividends for all members
  const handleRecalculateAllDividends = () => {
    if (window.confirm(`Adakah anda pasti mahu mengira semula Dividen Semasa dan Dividen 2023 untuk semua ahli (${members.length} orang) berdasarkan kadar dividen semasa (${settingsForm.dividendRate}%)?\n\nSemua dividen ahli akan digantikan dengan kiraan formula:\nKiraan = Jumlah Saham Semasa × ${settingsForm.dividendRate}%\n\nNota: Bagi Dividen 2023, sistem hanya akan mengira nilai untuk ahli yang mendaftar SEBELUM tahun 2023 sahaja. Ahli lain akan ditetapkan kepada RM 0.00.`)) {
      const updated = members.map(m => {
        const saham = parseCurrency(m['JUMLAH SAHAM SEMASA']);
        const calculatedDiv = (saham * settingsForm.dividendRate) / 100;
        const divFormatted = `RM ${calculatedDiv.toFixed(2)}`;
        const has2023 = isRegisteredBefore2023(m['TARIKH DAFTAR AHLI']);
        return {
          ...m,
          'DIVIDEN SEMASA': divFormatted,
          'DIVIDEN TAHUN SEMASA': divFormatted,
          'DIVIDEN 2023': has2023 ? divFormatted : 'RM 0.00'
        };
      });
      onUpdateMembers(updated);
      triggerNotice(`Berjaya mengira semula dividen untuk ${members.length} orang ahli menggunakan formula!`);
    }
  };

  // Lock screen view
  if (!adminLoggedIn) {
    return (
      <div className="flex items-center justify-center py-12" id="admin-login-screen">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/15">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">Kunci Kebenaran Pentadbir</h2>
            <p className="text-xs text-slate-400">
              Sila masukkan kata laluan untuk mengakses fungsi pengurusan, pendaftaran ahli, serta konfigurasi sistem.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata laluan admin..."
                className="w-full px-4 py-3 glass-input rounded-xl text-sm text-slate-700 placeholder-slate-400 font-mono"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
              />
              <button
                type="button"
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {loginError && (
              <p className="text-xs text-rose-500 font-semibold text-left flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                <Sliders className="w-3.5 h-3.5 shrink-0" /> {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-98"
            >
              Log Masuk Pentadbir
            </button>
          </form>

          <p className="text-[10px] text-slate-400 font-mono">
            KATA LALUAN : "Rujuk Setiausaha Koop ya"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-panel-container">
      {/* Admin header with logout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-2.5 py-1 rounded-full font-bold font-mono">
            SILA KENDALI DENGAN AMANAH (PENTADBIR)
          </span>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight mt-1.5">Portal Kawalan Sistem</h2>
          <p className="text-xs text-slate-400">Uruskan pendaftaran ahli, suntikan atau keluaran saham, dan tetapan parameter sistem.</p>
        </div>
        <button
          onClick={() => onSetAdminLoggedIn(false)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-semibold rounded-xl text-xs transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" /> Log Keluar Admin
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-rose-50 text-rose-800 border-rose-100'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          <span className="text-xs font-bold font-sans">{notification.text}</span>
        </div>
      )}

      {/* Internal Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        <button
          onClick={() => {
            setActiveAdminTab('members');
            setEditingMember(null);
            setIsAddingNew(false);
          }}
          className={`pb-3 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeAdminTab === 'members' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" /> Urus Pangkalan Data Ahli
        </button>
        <button
          onClick={() => {
            setActiveAdminTab('settings');
            setSettingsForm({ ...settings });
          }}
          className={`pb-3 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeAdminTab === 'settings' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" /> Konfigurasi Parameter Koperasi
        </button>
      </div>

      {/* Active Tab rendering */}
      {activeAdminTab === 'members' && (
        <div className="space-y-6">
          {settings.googleSheetsUrl && (
            <div className="p-4 bg-amber-50/70 backdrop-blur-md rounded-2xl border border-amber-200/50 flex gap-3 text-amber-850">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Sambungan Google Sheets Aktif</p>
                <p className="text-amber-700 leading-relaxed">
                  Data ahli utama dimuat secara automatik dari Google Sheets anda. Sebarang pendaftaran ahli baru atau suntingan di sini hanya disimpan dalam <strong>Cache Pelayar Tempatan</strong>. Sila buat perubahan kekal terus di Google Sheets anda dan muat semula aplikasi untuk melihat perubahan disegerakkan.
                </p>
              </div>
            </div>
          )}
          {/* Action Row */}
          {!isAddingNew && !editingMember && (
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              {/* Internal Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama atau No KP ahli untuk disunting..."
                  className="w-full pl-4 pr-4 py-2.5 glass-input rounded-xl text-xs text-slate-700 placeholder-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Add member button */}
              <button
                onClick={startAdd}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah Ahli Baru
              </button>
            </div>
          )}

          {/* Form to Add / Edit Member */}
          {(isAddingNew || editingMember) && (
            <form onSubmit={handleSaveMember} className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {isAddingNew ? 'Daftar Ahli Baru Koperasi' : `Kemaskini Rekod Ahli: ${editingMember?.NAMA}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">Lengkapkan maklumat profil, status keahlian, dan jumlah pegangan saham ahli di bawah.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddingNew(false);
                    setFormState({});
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold hover:underline"
                >
                  Batal Suntingan
                </button>
              </div>

              {/* Input grid */}
              <div className="space-y-5 text-slate-700 text-xs">
                {/* Section: Profil Peribadi */}
                <div className="space-y-3">
                  <h4 className="font-bold text-indigo-900 border-l-4 border-indigo-600 pl-2">1. Profil Peribadi Ahli</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Penuh (Wajib)</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-bold uppercase"
                        value={formState.NAMA || ''}
                        onChange={(e) => handleInputChange('NAMA', e.target.value)}
                        placeholder="Contoh: AHMAD BIN ABDULLAH"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">No. Kad Pengenalan / KP (Wajib)</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono"
                        value={formState['NO K/P'] || ''}
                        onChange={(e) => handleInputChange('NO K/P', e.target.value)}
                        placeholder="Contoh: 850101-01-1234"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jantina</label>
                      <select
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-semibold"
                        value={formState.JANTINA || 'LELAKI'}
                        onChange={(e) => handleInputChange('JANTINA', e.target.value)}
                      >
                        <option value="LELAKI">LELAKI</option>
                        <option value="PEREMPUAN">PEREMPUAN</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kursus</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800"
                        value={formState.KURSUS || ''}
                        onChange={(e) => handleInputChange('KURSUS', e.target.value)}
                        placeholder="Contoh: TEKNOLOGI REKABENTUK"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Status Keahlian */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-indigo-900 border-l-4 border-indigo-600 pl-2">2. Status Keahlian & Kategori</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori Ahli</label>
                      <select
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-semibold"
                        value={formState['STATUS AHLI'] || 'GURU'}
                        onChange={(e) => handleInputChange('STATUS AHLI', e.target.value)}
                      >
                        <option value="GURU">GURU</option>
                        <option value="STAF">STAF</option>
                        <option value="PELAJAR">PELAJAR</option>
                        <option value="LAIN">LAIN-LAIN</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Daftar</label>
                      <select
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-bold"
                        value={formState['ID DAFTAR'] || 'DAFTAR'}
                        onChange={(e) => handleInputChange('ID DAFTAR', e.target.value)}
                      >
                        <option value="DAFTAR">DAFTAR (Aktif)</option>
                        <option value="BERHENTI">BERHENTI (Tamat)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">No Ahli</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono font-bold"
                        value={formState['NO AHLI'] || ''}
                        onChange={(e) => handleInputChange('NO AHLI', e.target.value)}
                        placeholder="Contoh: 154"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tingkatan / Unit Kerja</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800"
                        value={formState.TINGKATAN || ''}
                        onChange={(e) => handleInputChange('TINGKATAN', e.target.value)}
                        placeholder="Contoh: TINGKATAN 5 / PENTADBIRAN"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Kewangan & Saham */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-indigo-900 border-l-4 border-indigo-600 pl-2">3. Kedudukan Kewangan & Dividen (Kiraan Formula Automatik)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jumlah Saham Semasa</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono font-bold"
                        value={formState['JUMLAH SAHAM SEMASA'] || 'RM 0.00'}
                        onChange={(e) => handleInputChange('JUMLAH SAHAM SEMASA', e.target.value)}
                        placeholder="Contoh: RM 1500.00"
                      />
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">Setiap kali nilai saham berubah, dividen di sebelah akan dikira secara automatik.</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dividen Semasa (Anggaran)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono font-bold"
                        value={formState['DIVIDEN SEMASA'] || 'RM 0.00'}
                        onChange={(e) => handleInputChange('DIVIDEN SEMASA', e.target.value)}
                        placeholder="Contoh: RM 97.50"
                      />
                      <span className="text-[9px] text-indigo-600 font-bold block mt-1 leading-tight bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
                        Formula: Saham × {settings.dividendRate}% <br />
                        Kiraan: RM {(parseCurrency(formState['JUMLAH SAHAM SEMASA']) * settings.dividendRate / 100).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dividen 2023</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono"
                        value={formState['DIVIDEN 2023'] || 'RM 0.00'}
                        onChange={(e) => handleInputChange('DIVIDEN 2023', e.target.value)}
                        placeholder="Contoh: RM 150.00"
                      />
                      {isRegisteredBefore2023(formState['TARIKH DAFTAR AHLI']) ? (
                        <span className="text-[9px] text-amber-700 font-bold block mt-1 leading-tight bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                          Formula: Saham × {settings.dividendRate}% <br />
                          Kiraan: RM {(parseCurrency(formState['JUMLAH SAHAM SEMASA']) * settings.dividendRate / 100).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-[9px] text-rose-700 font-bold block mt-1 leading-tight bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                          Mendaftar mulai tahun {formState['TARIKH DAFTAR AHLI'] ? String(formState['TARIKH DAFTAR AHLI']).split('/').pop() : '2023'} <br />
                          Kiraan: RM 0.00 (Boleh diedit)
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Syer</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-semibold"
                        value={formState['STATUS SYER'] || 'AKTIF'}
                        onChange={(e) => handleInputChange('STATUS SYER', e.target.value)}
                        placeholder="Contoh: AKTIF / TAMAT"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Tarikh & Maklumat Pemulangan */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-indigo-900 border-l-4 border-indigo-600 pl-2">4. Tarikh & Kaedah Kembalian Syer</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tarikh Daftar Ahli</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800"
                        value={formState['TARIKH DAFTAR AHLI'] || ''}
                        onChange={(e) => handleInputChange('TARIKH DAFTAR AHLI', e.target.value)}
                        placeholder="Contoh: DD/MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tarikh Berhenti (Jika Berkaitan)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800"
                        value={formState['TARIKH BEHENTI'] || ''}
                        onChange={(e) => handleInputChange('TARIKH BEHENTI', e.target.value)}
                        placeholder="Contoh: DD/MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kaedah Kembalian Syer</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800"
                        value={formState['KAEDAH KEMBALIAN SYER'] || ''}
                        onChange={(e) => handleInputChange('KAEDAH KEMBALIAN SYER', e.target.value)}
                        placeholder="Contoh: PINDAHAN BANK / TUNAI"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Sistem</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-sans"
                      value={formState.CATATAN || ''}
                      onChange={(e) => handleInputChange('CATATAN', e.target.value)}
                      placeholder="Masukkan ulasan atau nota sampingan untuk rujukan admin..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddingNew(false);
                    setFormState({});
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className={`px-5 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm ${
                    isSyncing ? 'bg-indigo-600 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-950'
                  }`}
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Menyelaras Google Sheets...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan Rekod
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Simple Members Table (Manage Mode) */}
          {!isAddingNew && !editingMember && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider font-mono text-[10px] text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">No Ahli</th>
                      <th className="py-2.5 px-4 font-semibold">Nama Penuh</th>
                      <th className="py-2.5 px-4 font-semibold">No K/P</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Saham Semasa</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Tindakan Pentadbir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.length > 0 ? (
                      filteredList.map(m => {
                        const isStopped = m['ID DAFTAR'] === 'BERHENTI';
                        return (
                          <tr key={m.ID} className="hover:bg-slate-50/40">
                            <td className="py-3 px-4 font-mono text-slate-400 font-bold">
                              #{m['NO AHLI'] || m.ID}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              <div>{m.NAMA || 'TIADA NAMA'}</div>
                              <div className="text-[10px] font-normal text-slate-400">{m['STATUS AHLI']} {isStopped && <span className="text-rose-500 font-bold">(BERHENTI)</span>}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{m['NO K/P'] || '-'}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800 font-mono">
                              {formatCurrency(parseCurrency(m['JUMLAH SAHAM SEMASA']))}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  type="button"
                                  onClick={() => startEdit(m)}
                                  className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg border border-slate-200 transition-all"
                                  title="Edit Ahli"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(m.ID, m.NAMA)}
                                  className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200 transition-all"
                                  title="Hapus Ahli"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Tiada rekod ahli ditemui bagi penapis "{searchTerm}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {filteredList.length >= 15 && !searchTerm && (
                <p className="text-[10px] text-slate-400 text-center py-3.5 border-t border-slate-50 font-mono">
                  Menunjukkan 15 ahli teratas sahaja. Sila taip nama di carian atas untuk mencari ahli yang spesifik.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Tetapan & Parameter Kewangan Koperasi</h3>
            <p className="text-[11px] text-slate-400">Pemberian dividen and pengiraan statistik dashboard dilaras secara dinamik mengikut input borang ini.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-slate-700 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Organisasi / Koperasi</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-bold"
                value={settingsForm.cooperativeName}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, cooperativeName: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kadar Dividen (%)</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono font-bold"
                value={settingsForm.dividendRate}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, dividendRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun Kewangan Semasa</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono"
                value={settingsForm.financialYear}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, financialYear: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Had Caruman Minimum Saham Semasa (RM)</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono"
                value={settingsForm.minShareAmount}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, minShareAmount: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-indigo-600">
                <Database className="w-3.5 h-3.5" /> Pautan Google Sheets (Published HTML/CSV)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono"
                placeholder="Contoh: https://docs.google.com/spreadsheets/d/e/.../pubhtml"
                value={settingsForm.googleSheetsUrl || ''}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, googleSheetsUrl: e.target.value }))}
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Pautan Google Sheet anda yang telah diterbitkan ke web. Sistem menyokong format <strong>pubhtml</strong>, <strong>pub?output=csv</strong> atau pautan perkongsian biasa. Data akan diselaraskan secara dinamik di dashboard dan senarai ahli.
              </p>
            </div>

            <div className="col-span-1 sm:col-span-2 border-t border-slate-100/50 pt-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-emerald-600">
                  <Code className="w-3.5 h-3.5" /> Pautan Google Apps Script Web App (Dua Hala - Menulis & Menghapus Data)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-800 font-mono"
                  placeholder="Contoh: https://script.google.com/macros/s/.../exec"
                  value={settingsForm.googleAppsScriptUrl || ''}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, googleAppsScriptUrl: e.target.value }))}
                />
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Untuk membolehkan aplikasi ini <strong>menulis semula, mengemaskini, atau mengeluarkan data</strong> terus ke Google Sheets dalam masa nyata, masukkan URL Web App Apps Script anda di bawah.
                </p>
              </div>

              {/* Step-by-Step Instructions Panel */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-500" /> Panduan Langkah Demi Langkah Integrasi Google Apps Script:
                </span>
                <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1.5 leading-relaxed font-sans">
                  <li>Buka fail Google Sheet anda.</li>
                  <li>Klik menu <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Padam semua kod sedia ada, salin kod Apps Script (klik butang hitam di bawah) dan tampal di dalam editor tersebut.</li>
                  <li>Simpan fail dengan klik ikon disket / tekan <code>Ctrl + S</code>.</li>
                  <li>Klik butang <strong>Deploy &gt; New deployment</strong> di penjuru kanan atas.</li>
                  <li>Pilih jenis <strong>Web app</strong> (klik ikon gerigi &gt; Web app jika tiada).</li>
                  <li>Set tetapan berikut:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 font-semibold text-slate-700">
                      <li>Execute as: <span className="text-indigo-600 font-bold">Me (e-mel anda)</span></li>
                      <li>Who has access: <span className="text-indigo-600 font-bold">Anyone</span> (Sangat penting agar aplikasi ini dibenarkan menghantar kemaskini)</li>
                    </ul>
                  </li>
                  <li>Klik <strong>Deploy</strong>, benarkan kebenaran akses (Authorize Access) jika diminta oleh Google.</li>
                  <li>Salin <strong>Web App URL</strong> yang dihasilkan dan tampal ke dalam ruangan input hijau di atas!</li>
                </ol>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const code = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "Invalid JSON format: " + err.message}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  var action = data.action;
  var member = data.member;
  
  if (!action || !member) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "Missing action or member data"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (action === "ADD_MEMBER") {
    // Append a new row matching headers
    var newRow = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      var val = member[header] !== undefined ? member[header] : "";
      newRow.push(val);
    }
    sheet.appendRow(newRow);
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Member added successfully"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Find Row Index by ID
  var idColIndex = headers.indexOf("ID") + 1;
  if (idColIndex === 0) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "ID column not found in sheet"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  var numRows = sheet.getLastRow();
  var ids = numRows > 1 ? sheet.getRange(2, idColIndex, numRows - 1, 1).getValues() : [];
  var targetRowIndex = -1;
  
  for (var r = 0; r < ids.length; r++) {
    if (String(ids[r][0]) === String(member.ID)) {
      targetRowIndex = r + 2; // Row starts from index 2
      break;
    }
  }
  
  if (targetRowIndex === -1) {
    // Fallback search by Name or IC if ID is newly generated or not found
    var nameColIndex = headers.indexOf("NAMA") + 1;
    var kpColIndex = headers.indexOf("NO K/P") + 1;
    var names = nameColIndex > 0 && numRows > 1 ? sheet.getRange(2, nameColIndex, numRows - 1, 1).getValues() : [];
    var kps = kpColIndex > 0 && numRows > 1 ? sheet.getRange(2, kpColIndex, numRows - 1, 1).getValues() : [];
    
    for (var r = 0; r < names.length; r++) {
      if ((member.NAMA && String(names[r][0]) === String(member.NAMA)) || 
          (member["NO K/P"] && kps[r] && String(kps[r][0]) === String(member["NO K/P"]))) {
        targetRowIndex = r + 2;
        break;
      }
    }
  }
  
  if (action === "UPDATE_MEMBER") {
    if (targetRowIndex === -1) {
      // If not found, append as new
      var newRow = [];
      for (var i = 0; i < headers.length; i++) {
        var header = headers[i];
        var val = member[header] !== undefined ? member[header] : "";
        newRow.push(val);
      }
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({success: true, message: "Member not found, added as new instead"}))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update existing row
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (member[header] !== undefined) {
        sheet.getRange(targetRowIndex, i + 1).setValue(member[header]);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Member updated successfully"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "DELETE_MEMBER") {
    if (targetRowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({success: false, message: "Member to delete not found in sheet"}))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    sheet.deleteRow(targetRowIndex);
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Member deleted successfully"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: false, message: "Unknown action"}))
                       .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return HtmlService.createHtmlOutput("<h3>Google Apps Script Web App is Online!</h3>");
}`;
                      navigator.clipboard.writeText(code);
                      alert('Kod Google Apps Script telah berjaya disalin ke Clipboard anda! Sila tampal di dalam tetingkap Apps Script.');
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white font-mono text-[10px] font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Code className="w-3.5 h-3.5" /> Salin Kod Apps Script (Copy Script Code)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Kira Semula Dividen Secara Pukal */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200/60 space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shrink-0 shadow-md shadow-emerald-600/10">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Kiraan Pukal: Auto-Kira Semua Dividen Ahli</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Adakah anda ingin mengira semula <strong>Dividen Semasa</strong> dan <strong>Dividen 2023</strong> secara automatik bagi kesemua ahli ({members.length} orang) berdasarkan formula matematik? 
                </p>
                <div className="pt-2">
                  <div className="inline-block bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-150/50 text-[10px] font-bold text-emerald-800 font-mono mb-2">
                    Formula: [Jumlah Saham Semasa] × {settingsForm.dividendRate}% = Dividen
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-start pl-11">
              <button
                type="button"
                onClick={handleRecalculateAllDividends}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Kira Semula Semua Dividen (Formula Automatik)
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Simpan Konfigurasi Sistem
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
