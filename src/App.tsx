import React, { useState, useEffect } from 'react';
import initialMembersData from './data/initialMembers.json';
import { Member, SystemSettings } from './types';
import Dashboard from './components/Dashboard';
import MembersList from './components/MembersList';
import Reports from './components/Reports';
import AdminPanel from './components/AdminPanel';
import PrintReport from './components/PrintReport';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Shield, 
  Menu, 
  X, 
  TrendingUp,
  Award
} from 'lucide-react';

const DEFAULT_SETTINGS: SystemSettings = {
  cooperativeName: 'Kelab Kebajikan Guru & Staf VoxMaju',
  dividendRate: 6.5,
  financialYear: '2026',
  minShareAmount: 50.00
};

export default function App() {
  // Load members from LocalStorage or fallback to initial data
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const stored = localStorage.getItem('vox_members_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load members from localStorage', e);
    }
    return initialMembersData as Member[];
  });

  // Load system settings from LocalStorage or fallback to defaults
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const stored = localStorage.getItem('vox_system_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'reports' | 'admin'>('dashboard');
  
  // Mobile menu visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Admin Login persistent state
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('vox_admin_auth') === 'true';
  });

  // Printable Report Overlay state
  const [printData, setPrintData] = useState<{ reportMembers: Member[]; title: string } | null>(null);

  // Sync members to localStorage
  useEffect(() => {
    localStorage.setItem('vox_members_data', JSON.stringify(members));
  }, [members]);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('vox_system_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync admin authentication state
  useEffect(() => {
    sessionStorage.setItem('vox_admin_auth', String(adminLoggedIn));
  }, [adminLoggedIn]);

  // Handle updates from Admin Panel
  const handleUpdateMembers = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);
  };

  const handleUpdateSettings = (updatedSettings: SystemSettings) => {
    setSettings(updatedSettings);
  };

  // Trigger printable report overlay
  const handleTriggerPrint = (reportMembers: Member[], reportTitle: string) => {
    setPrintData({ reportMembers, title: reportTitle });
  };

  // If we are in the print overlay, render full screen Print View
  if (printData) {
    return (
      <PrintReport
        reportMembers={printData.reportMembers}
        reportTitle={printData.title}
        settings={settings}
        onBack={() => setPrintData(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans relative overflow-hidden" id="main-app-layout">
      {/* Mobile Top Header (Hidden on Desktop) */}
      <header className="md:hidden bg-slate-900/95 backdrop-blur-md text-white py-4 px-5 flex justify-between items-center border-b border-slate-850 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wider font-sans">VoxMaju</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Left Sidebar (Desktop and Mobile Drawer) with Glass Dark Look */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-40
        w-64 bg-slate-900/92 backdrop-blur-2xl text-white shrink-0 flex flex-col justify-between
        transition-transform duration-300 ease-in-out border-r border-slate-800/80 shadow-2xl
        md:translate-x-0 h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/25">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base uppercase tracking-wider font-sans">VoxMaju</h1>
              <p className="text-[10px] text-slate-400 font-mono">Sistem Saham & Ahli</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-8 space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Analisis
            </button>

            <button
              onClick={() => {
                setActiveTab('members');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'members'
                  ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-4 h-4" /> Pangkalan Data Ahli
            </button>

            <button
              onClick={() => {
                setActiveTab('reports');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileText className="w-4 h-4" /> Laporan Automatik
            </button>

            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Shield className="w-4 h-4" /> Urusan Pentadbir
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-800/80 space-y-3.5">
          {adminLoggedIn && (
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-[10px] font-bold text-slate-300">Pentadbir Log Masuk</p>
                <button
                  onClick={() => setAdminLoggedIn(false)}
                  className="text-[9px] font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                >
                  Log Keluar
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>VERSI v1.1.2</span>
            <span>© VOXMAJU</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-35 md:hidden"
        ></div>
      )}

      {/* Main Content Pane with decorative glass background */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative overflow-x-hidden">
        {/* Decorative Background Circles */}
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-blue-400 rounded-full blur-[100px] opacity-[0.14] pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400 rounded-full blur-[90px] opacity-[0.12] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-emerald-400 rounded-full blur-[80px] opacity-[0.08] pointer-events-none"></div>

        {/* Top bar for corporate branding & title (Glass effect) */}
        <div className="bg-white/40 backdrop-blur-md border-b border-white/40 py-3.5 px-6 sm:px-8 flex justify-between items-center shrink-0 hidden md:flex z-10">
          <div>
            <h1 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              {settings.cooperativeName}
            </h1>
          </div>
          <div className="text-xs text-slate-600 font-mono font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Penyata Sesi Kewangan: {settings.financialYear}
          </div>
        </div>

        {/* Active viewport with scrolling and layout bounds */}
        <div className="p-6 sm:p-8 flex-1 animate-fade-in max-w-7xl w-full mx-auto pb-16 z-10">
          {activeTab === 'dashboard' && (
            <Dashboard 
              members={members} 
              settings={settings} 
            />
          )}

          {activeTab === 'members' && (
            <MembersList 
              members={members} 
            />
          )}

          {activeTab === 'reports' && (
            <Reports 
              members={members} 
              settings={settings} 
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel 
              members={members} 
              settings={settings} 
              onUpdateMembers={handleUpdateMembers}
              onUpdateSettings={handleUpdateSettings}
              adminLoggedIn={adminLoggedIn}
              onSetAdminLoggedIn={setAdminLoggedIn}
            />
          )}
        </div>
      </main>
    </div>
  );
}
