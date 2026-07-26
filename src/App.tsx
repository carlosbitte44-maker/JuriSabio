/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Scale, ShieldCheck, Award, MessageSquare } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PeçasProcessuais from './components/PeçasProcessuais';
import TriagemPrazos from './components/TriagemPrazos';
import EmailsComunicacoes from './components/EmailsComunicacoes';
import AgendaAudiencias from './components/AgendaAudiencias';
import DocumentosEssenciais from './components/DocumentosEssenciais';
import EmailAutomacao from './components/EmailAutomacao';
import Settings from './components/Settings';
import { Case, LegalDocument, Deadline, Hearing, LegalEmail } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // App Customization Branding States
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('jurissabio_app_name') || 'JurisSábio IA';
  });
  const [appTheme, setAppTheme] = useState(() => {
    return localStorage.getItem('jurissabio_app_theme') || 'amber';
  });

  // Global Legal States
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [emails, setEmails] = useState<LegalEmail[]>([]);

  // Apply theme dynamically to CSS variables on load/change
  useEffect(() => {
    const themes: Record<string, { primary: string; hover: string; text: string }> = {
      amber: { primary: '#f59e0b', hover: '#d97706', text: '#fbbf24' },
      emerald: { primary: '#10b981', hover: '#059669', text: '#34d399' },
      blue: { primary: '#3b82f6', hover: '#2563eb', text: '#60a5fa' },
      violet: { primary: '#8b5cf6', hover: '#7c3aed', text: '#a78bfa' },
      rose: { primary: '#f43f5e', hover: '#e11d48', text: '#fb7185' },
    };

    const activeTheme = themes[appTheme] || themes.amber;
    document.documentElement.style.setProperty('--brand-500', activeTheme.primary);
    document.documentElement.style.setProperty('--brand-600', activeTheme.hover);
    document.documentElement.style.setProperty('--brand-400', activeTheme.text);
    localStorage.setItem('jurissabio_app_theme', appTheme);
  }, [appTheme]);

  useEffect(() => {
    localStorage.setItem('jurissabio_app_name', appName);
  }, [appName]);

  // Fetch all legal records from Express Backend APIs
  const fetchCases = () => {
    fetch('/api/cases')
      .then((res) => res.json())
      .then((data) => setCases(data))
      .catch((err) => console.error('Erro ao buscar casos:', err));
  };

  const fetchDocuments = () => {
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((err) => console.error('Erro ao buscar documentos:', err));
  };

  const fetchDeadlines = () => {
    fetch('/api/deadlines')
      .then((res) => res.json())
      .then((data) => setDeadlines(data))
      .catch((err) => console.error('Erro ao buscar prazos:', err));
  };

  const fetchHearings = () => {
    fetch('/api/hearings')
      .then((res) => res.json())
      .then((data) => setHearings(data))
      .catch((err) => console.error('Erro ao buscar audiências:', err));
  };

  const fetchEmails = () => {
    fetch('/api/emails')
      .then((res) => res.json())
      .then((data) => setEmails(data))
      .catch((err) => console.error('Erro ao buscar e-mails:', err));
  };

  const handleDeadlineDeleted = async (id: string) => {
    try {
      const response = await fetch(`/api/deadlines/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchDeadlines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHearingDeleted = async (id: string) => {
    try {
      const response = await fetch(`/api/hearings/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchHearings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDocumentDeleted = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchDocuments();
    fetchDeadlines();
    fetchHearings();
    fetchEmails();
  }, []);

  // Main layout router
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            cases={cases}
            deadlines={deadlines}
            hearings={hearings}
            emails={emails}
            setActiveTab={setActiveTab}
            onCaseChange={fetchCases}
          />
        );
      case 'pecas':
        return <PeçasProcessuais cases={cases} onDocumentAdded={fetchDocuments} />;
      case 'prazos':
        return (
          <TriagemPrazos
            cases={cases}
            deadlines={deadlines}
            onDeadlineAdded={fetchDeadlines}
            onDeadlineUpdated={fetchDeadlines}
            onDeadlineDeleted={handleDeadlineDeleted}
          />
        );
      case 'emails':
        return (
          <EmailsComunicacoes
            emails={emails}
            onEmailUpdated={fetchEmails}
            onHearingAdded={fetchHearings}
            cases={cases}
          />
        );
      case 'automacao':
        return (
          <EmailAutomacao
            onHearingAdded={fetchHearings}
            cases={cases}
          />
        );
      case 'audiencias':
        return (
          <AgendaAudiencias
            cases={cases}
            hearings={hearings}
            onHearingAdded={fetchHearings}
            onHearingDeleted={handleHearingDeleted}
          />
        );
      case 'documentos':
        return (
          <DocumentosEssenciais
            documents={documents}
            onDocumentUpdated={fetchDocuments}
            onDocumentDeleted={handleDocumentDeleted}
            cases={cases}
            onDeadlineAdded={fetchDeadlines}
          />
        );
      case 'config':
        return (
          <Settings
            appName={appName}
            setAppName={setAppName}
            appTheme={appTheme}
            setAppTheme={setAppTheme}
          />
        );
      default:
        return (
          <Dashboard
            cases={cases}
            deadlines={deadlines}
            hearings={hearings}
            emails={emails}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();
  const todayDeadlines = deadlines.filter((d) => d.status === 'Pendente' && d.dueDate === todayStr);
  const todayCount = todayDeadlines.length;

  return (
    <div id="root-container" className="flex flex-col md:flex-row min-h-screen bg-[#08090a] text-slate-200 font-sans antialiased">
      {/* Interactive Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        deadlines={deadlines}
        appName={appName}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top bar with system states */}
        <header className="hidden md:flex items-center justify-between border-b border-[#1F2125] px-8 py-3 bg-[#111215] shrink-0">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 font-mono">Dra. Amanda Medeiros • OAB/SP 456.789</span>
          </div>

          {todayCount > 0 && (
            <button
              onClick={() => setActiveTab('prazos')}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/35 hover:border-red-500/50 rounded-full text-red-400 font-mono text-[10px] font-bold transition-all cursor-pointer animate-pulse shrink-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>{todayCount} {todayCount === 1 ? 'PRAZO VENCENDO HOJE!' : 'PRAZOS VENCENDO HOJE!'}</span>
            </button>
          )}

          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-500" />
              <span>Conformidade LGPD Ativa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-amber-400" />
              <span>Suporte Técnico Virtual Ativo</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route View container */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
