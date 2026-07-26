/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Scale, FileText, Clock, Calendar, ArrowUpRight, AlertTriangle, ShieldCheck, MailWarning, Users, Search, Filter, Copy, Check, Plus, Trash2, FolderClosed, X } from 'lucide-react';
import { Case, Deadline, Hearing, LegalEmail, ProductivityIndicator } from '../types';

interface DashboardProps {
  cases: Case[];
  deadlines: Deadline[];
  hearings: Hearing[];
  emails: LegalEmail[];
  setActiveTab: (tab: string) => void;
  onCaseChange?: () => void;
}

export default function Dashboard({
  cases,
  deadlines,
  hearings,
  emails,
  setActiveTab,
  onCaseChange,
}: DashboardProps) {
  const [stats, setStats] = useState<ProductivityIndicator | null>(null);
  const [loading, setLoading] = useState(true);

  // Case list search & dynamic filters state
  const [caseSearch, setCaseSearch] = useState('');
  const [caseStatus, setCaseStatus] = useState<string>('Todos');
  const [caseArea, setCaseArea] = useState<string>('Todos');

  // Clipboard copy feedback
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);

  // Register New Case State
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseClient, setNewCaseClient] = useState('');
  const [newCaseCourt, setNewCaseCourt] = useState('');
  const [newCaseArea, setNewCaseArea] = useState<'Civil' | 'Tributário' | 'Trabalhista' | 'Penal' | 'Administrativo' | 'Constitucional' | 'Família'>('Civil');
  const [newCaseUrgency, setNewCaseUrgency] = useState<'Alta' | 'Média' | 'Baixa'>('Média');

  const handleCopyCaseNumber = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedCaseId(id);
    setTimeout(() => setCopiedCaseId(null), 2000);
  };

  const handleCreateCase = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newCaseTitle || !newCaseClient || !newCaseCourt) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: newCaseNumber,
          title: newCaseTitle,
          client: newCaseClient,
          court: newCaseCourt,
          area: newCaseArea,
          urgency: newCaseUrgency,
          status: 'Ativo',
        }),
      });

      if (response.ok) {
        if (onCaseChange) onCaseChange();
        setNewCaseNumber('');
        setNewCaseTitle('');
        setNewCaseClient('');
        setNewCaseCourt('');
        setNewCaseArea('Civil');
        setNewCaseUrgency('Média');
        setShowAddCase(false);
      } else {
        alert('Erro ao cadastrar caso processual.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCaseStatus = async (id: string, newStatus: 'Ativo' | 'Arquivado' | 'Suspenso') => {
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok && onCaseChange) {
        onCaseChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm('Deseja realmente remover ou arquivar este caso processual do sistema?')) return;
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'DELETE',
      });
      if (response.ok && onCaseChange) {
        onCaseChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCases = cases.filter((c) => {
    const q = caseSearch.toLowerCase().trim();
    const matchesSearch =
      c.client.toLowerCase().includes(q) ||
      c.number.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.court.toLowerCase().includes(q);

    const matchesStatus = caseStatus === 'Todos' ? true : c.status === caseStatus;
    const matchesArea = caseArea === 'Todos' ? true : c.area === caseArea;

    return matchesSearch && matchesStatus && matchesArea;
  });

  const uniqueAreas = ['Todos', ...Array.from(new Set(cases.map((c) => c.area).filter(Boolean)))];

  useEffect(() => {
    fetch('/api/productivity')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar produtividade:', err);
        setLoading(false);
      });
  }, [cases, deadlines, hearings, emails]);

  const COLORS = ['#d4af37', '#c5a880', '#ef4444', '#f59e0b', '#38bdf8'];

  const pendingDeadlines = deadlines.filter((d) => d.status === 'Pendente');
  const criticalDeadlines = pendingDeadlines.filter((d) => d.urgency === 'Crítica' || d.urgency === 'Alta');
  const unreadEmails = emails.filter((e) => e.status === 'Não Lido');

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2125] pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Escritório Virtual de Advocacia
          </h1>
          <p className="text-slate-400 mt-1">
            Gestão integrada, triagem de prazos em tempo real e inteligência processual.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#111215] border border-[#1F2125] px-3 py-1.5 rounded-lg text-xs text-slate-300 font-mono">
          <ShieldCheck size={14} className="text-amber-500" />
          <span>Servidor Seguro • LGPD Auditado</span>
        </div>
      </div>

      {/* Critical Warnings Bar */}
      {criticalDeadlines.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-red-200 animate-pulse">
          <AlertTriangle className="shrink-0 text-red-500" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-red-300">Atenção: {criticalDeadlines.length} prazos processuais críticos requerem ação imediata!</h4>
            <p className="text-xs text-red-400/90 mt-0.5">
              Peças de apelação e recursos em tribunais de segunda instância vencendo em breve.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('prazos')}
            className="text-xs font-semibold bg-red-850 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1 border border-red-700/30"
          >
            Ver Triagem <ArrowUpRight size={12} />
          </button>
        </div>
      )}

      {/* Summary Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-slate-400 font-mono uppercase tracking-wider">Casos Ativos</p>
            <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg"><Scale size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{cases.filter(c => c.status === 'Ativo').length}</span>
            <span className="text-xs text-emerald-500 font-medium">Estável</span>
          </div>
        </div>

        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-slate-400 font-mono uppercase tracking-wider">Peças Redigidas (IA)</p>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg"><FileText size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats.draftsCount}</span>
            <span className="text-xs text-emerald-500 font-medium">+12% este mês</span>
          </div>
        </div>

        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-slate-400 font-mono uppercase tracking-wider">Prazos Pendentes</p>
            <span className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg"><Clock size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{pendingDeadlines.length}</span>
            <span className="text-xs text-red-400 font-medium font-mono">{criticalDeadlines.length} urgentes</span>
          </div>
        </div>

        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-xs font-medium text-slate-400 font-mono uppercase tracking-wider">Aproveitamento de Prazos</p>
            <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg"><Users size={16} /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats.complianceRate}%</span>
            <span className="text-xs text-slate-400">Metas do CPC</span>
          </div>
        </div>
      </div>

      {/* Main Panel - Charts & Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Analytics Chart */}
        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2125] pb-3">
            <h3 className="font-display font-semibold text-white text-lg">Métricas Semanais de Produtividade</h3>
            <span className="text-xs text-slate-400 bg-[#1C1E22] px-2 py-1 rounded-full font-mono">Últimos 5 dias</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2125" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111215', borderRadius: '8px', border: '1px solid #1F2125', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Bar name="Peças Geradas" dataKey="drafts" fill="#d4af37" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar name="Prazos Atendidos" dataKey="deadlines" fill="#475569" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Caseload Allocations by Category */}
        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2125] pb-3">
            <h3 className="font-display font-semibold text-white text-lg">Distribuição por Área</h3>
            <span className="text-xs text-slate-400 bg-[#1C1E22] px-2 py-1 rounded-full font-mono">Processos</span>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            {stats.categoryDistribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111215', borderRadius: '8px', border: '1px solid #1F2125', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm">Sem processos cadastrados.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            {stats.categoryDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-300 truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Hearings & Secure Communication Inbox summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Hearings Module */}
        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2125] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-amber-500" size={18} />
              <h3 className="font-display font-semibold text-white text-lg">Audiências Próximas</h3>
            </div>
            <button onClick={() => setActiveTab('audiencias')} className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1">
              Ver Agenda <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {hearings.length > 0 ? (
              hearings.slice(0, 3).map((h) => (
                <div key={h.id} className="border border-[#1F2125] rounded-xl p-3 flex justify-between items-center bg-[#16181C]/40 hover:bg-[#16181C]/80 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{h.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{h.caseNumber}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${
                        h.type === 'Virtual' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[#1C1E22] text-slate-300 border border-[#1F2125]'
                      }`}>
                        {h.type}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {new Date(h.dateTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                  {h.type === 'Virtual' && (
                    <a
                      href={h.locationOrLink}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="ml-3 shrink-0 text-xs font-semibold text-amber-400 bg-[#111215] hover:bg-amber-500/10 border border-[#1F2125] hover:border-amber-500/30 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      Entrar Sala
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-6">Nenhuma audiência pendente agendada.</p>
            )}
          </div>
        </div>

        {/* Secure LGPD Inbox Summary */}
        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2125] pb-3">
            <div className="flex items-center gap-2">
              <MailWarning className="text-amber-500" size={18} />
              <h3 className="font-display font-semibold text-white text-lg">Comunicações Judiciais & LGPD</h3>
            </div>
            <button onClick={() => setActiveTab('emails')} className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1">
              Ver Inbox <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {emails.length > 0 ? (
              emails.slice(0, 3).map((e) => (
                <div key={e.id} className="border border-[#1F2125] rounded-xl p-3 flex items-start gap-3 bg-[#16181C]/40 hover:bg-[#16181C]/80 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    e.lgpdSensitive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {e.lgpdSensitive ? <ShieldCheck size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="font-semibold text-white text-sm truncate">{e.sender}</p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(e.receivedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-300 truncate mt-0.5">{e.subject}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        e.category === 'Urgente' || e.category === 'Prazo'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-[#1C1E22] text-slate-300 border border-[#1F2125]'
                      }`}>
                        {e.category}
                      </span>
                      {e.lgpdSensitive && (
                        <span className="text-[10px] text-red-400 font-medium font-mono flex items-center gap-0.5">
                          • Alerta LGPD Ativo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-6">Nenhum e-mail ou comunicação recebida.</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Gestão de Casos / Processos */}
      <div id="gestao-casos-section" className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2125] pb-4">
          <div>
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <Scale className="text-amber-500" size={20} /> Casos Processuais sob Gestão
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Pesquise, filtre e gerencie todos os processos cadastrados no escritório em tempo real.
            </p>
          </div>
          <button
            onClick={() => setShowAddCase(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus size={14} /> Cadastrar Processo
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col md:flex-row items-center gap-3 bg-[#16181C]/50 p-4 rounded-xl border border-[#1F2125]">
          <div className="relative w-full md:flex-1">
            <input
              type="text"
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              placeholder="Pesquisar por cliente, nº do processo, título..."
              className="w-full bg-[#111215] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none transition-colors"
            />
            <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] font-medium text-slate-400 font-mono hidden sm:inline">Status:</span>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full sm:w-auto bg-[#111215] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/40"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Arquivado">Arquivado</option>
                <option value="Suspenso">Suspenso</option>
              </select>
            </div>

            {/* Area Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] font-medium text-slate-400 font-mono hidden sm:inline">Área:</span>
              <select
                value={caseArea}
                onChange={(e) => setCaseArea(e.target.value)}
                className="w-full sm:w-auto bg-[#111215] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/40"
              >
                <option value="Todos">Todas as Áreas</option>
                {uniqueAreas.filter(a => a !== 'Todos').map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista / Tabela de Casos */}
        {filteredCases.length > 0 ? (
          <div className="overflow-x-auto border border-[#1F2125] rounded-xl bg-[#16181C]/20">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-[#1F2125] bg-[#16181C]/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="px-4 py-3">Nº do Processo / Cliente</th>
                  <th className="px-4 py-3">Objeto / Título</th>
                  <th className="px-4 py-3">Área / Tribunal</th>
                  <th className="px-4 py-3">Urgência</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2125]">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#16181C]/30 transition-colors text-xs">
                    <td className="px-4 py-3.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-amber-400">{c.number}</span>
                        <button
                          onClick={() => handleCopyCaseNumber(c.number, c.id)}
                          className="p-1 hover:text-white text-slate-500 transition-colors rounded hover:bg-[#1F2125]"
                          title="Copiar Número do Processo"
                        >
                          {copiedCaseId === c.id ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>{c.client}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-slate-300 font-medium line-clamp-2" title={c.title}>
                        {c.title}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 space-y-1">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.area === 'Civil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          c.area === 'Tributário' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          c.area === 'Penal' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          c.area === 'Trabalhista' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                          'bg-[#1C1E22] text-slate-300 border border-[#1F2125]'
                        }`}>
                          {c.area}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={c.court}>
                        {c.court}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.urgency === 'Alta' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        c.urgency === 'Média' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={c.status}
                        onChange={(e) => handleUpdateCaseStatus(c.id, e.target.value as any)}
                        className={`bg-[#111215] border border-[#1F2125] text-xs rounded-lg px-2.5 py-1 outline-none transition-all font-semibold cursor-pointer ${
                          c.status === 'Ativo' ? 'text-emerald-400 hover:border-emerald-500/30' :
                          c.status === 'Suspenso' ? 'text-amber-500 hover:border-amber-500/30' :
                          'text-slate-400 hover:border-slate-500/30'
                        }`}
                      >
                        <option value="Ativo" className="text-emerald-400">● Ativo</option>
                        <option value="Suspenso" className="text-amber-500">● Suspenso</option>
                        <option value="Arquivado" className="text-slate-400">● Arquivado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveTab('prazos')}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Lançar ou Monitorar Prazos"
                        >
                          <Clock size={11} /> Prazos
                        </button>
                        <button
                          onClick={() => setActiveTab('documentos')}
                          className="px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/20 hover:border-slate-500/40 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Gerenciar Documentos e Anexos"
                        >
                          <FolderClosed size={11} /> Docs
                        </button>
                        <button
                          onClick={() => handleDeleteCase(c.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all cursor-pointer"
                          title="Arquivar/Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#1F2125] p-3 space-y-3">
              {filteredCases.map((c) => (
                <div key={c.id} className="p-3 bg-[#111215]/50 border border-[#1F2125] rounded-xl space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-amber-400">{c.number}</span>
                        <button
                          onClick={() => handleCopyCaseNumber(c.number, c.id)}
                          className="p-1 hover:text-white text-slate-500 transition-colors"
                        >
                          {copiedCaseId === c.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <h4 className="text-white font-semibold text-sm">{c.client}</h4>
                    </div>
                    <select
                      value={c.status}
                      onChange={(e) => handleUpdateCaseStatus(c.id, e.target.value as any)}
                      className={`bg-[#16181C] border border-[#1F2125] text-xs rounded-lg px-2 py-1 outline-none font-semibold ${
                        c.status === 'Ativo' ? 'text-emerald-400' :
                        c.status === 'Suspenso' ? 'text-amber-500' :
                        'text-slate-400'
                      }`}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Suspenso">Suspenso</option>
                      <option value="Arquivado">Arquivado</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-slate-300 text-xs font-medium line-clamp-2">{c.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{c.court}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center justify-between border-t border-[#1F2125]/60 pt-2.5">
                    <div className="flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        c.area === 'Civil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        c.area === 'Tributário' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        c.area === 'Penal' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        c.area === 'Trabalhista' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                        'bg-[#1C1E22] text-slate-300 border border-[#1F2125]'
                      }`}>
                        {c.area}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                        c.urgency === 'Alta' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        c.urgency === 'Média' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {c.urgency}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('prazos')}
                        className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Prazos
                      </button>
                      <button
                        onClick={() => setActiveTab('documentos')}
                        className="p-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/20 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Docs
                      </button>
                      <button
                        onClick={() => handleDeleteCase(c.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 border border-[#1F2125] border-dashed rounded-xl bg-[#16181C]/10 text-center">
            <AlertTriangle className="text-amber-500/70 mb-2" size={24} />
            <h4 className="text-white font-medium text-xs">Nenhum caso processual encontrado</h4>
            <p className="text-slate-400 text-[11px] max-w-xs mt-1 leading-relaxed">
              Tente redefinir a busca ou ajustar os filtros de status e área selecionados.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DE NOVO PROCESSO */}
      {showAddCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#111215] border border-[#1F2125] rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAddCase(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="font-display font-bold text-white text-base">Cadastrar Novo Processo</h3>
              <p className="text-slate-400 text-xs mt-0.5">Adicione um novo caso jurídico ao painel do escritório.</p>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Número do Processo (CNJ)</label>
                <input
                  type="text"
                  required
                  value={newCaseNumber}
                  onChange={(e) => setNewCaseNumber(e.target.value)}
                  placeholder="Ex: 1002345-67.2026.8.26.0100"
                  className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 rounded-xl px-3 py-2 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  value={newCaseClient}
                  onChange={(e) => setNewCaseClient(e.target.value)}
                  placeholder="Ex: Carlos Alberto Bitte"
                  className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 rounded-xl px-3 py-2 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Título / Objeto do Caso</label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="Ex: Ação de Cobrança c/c Danos Morais"
                  className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 rounded-xl px-3 py-2 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Tribunal / Comarca de Tramitação</label>
                <input
                  type="text"
                  required
                  value={newCaseCourt}
                  onChange={(e) => setNewCaseCourt(e.target.value)}
                  placeholder="Ex: TJSP - 15ª Vara Cível do Foro Central"
                  className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 rounded-xl px-3 py-2 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Área do Direito</label>
                  <select
                    value={newCaseArea}
                    onChange={(e) => setNewCaseArea(e.target.value as any)}
                    className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="Civil">Civil</option>
                    <option value="Tributário">Tributário</option>
                    <option value="Trabalhista">Trabalhista</option>
                    <option value="Penal">Penal</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Constitucional">Constitucional</option>
                    <option value="Família">Família</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Nível de Urgência</label>
                  <select
                    value={newCaseUrgency}
                    onChange={(e) => setNewCaseUrgency(e.target.value as any)}
                    className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCase(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-all font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Salvar Processo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
