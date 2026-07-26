/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scale, LayoutDashboard, FileText, CalendarRange, Clock, Mail, FolderClosed, ShieldAlert, ChevronLeft, ChevronRight, Menu, X, Zap, Settings } from 'lucide-react';
import { Deadline } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  deadlines: Deadline[];
  appName?: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  deadlines = [],
  appName = 'JurisSábio IA',
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pecas', label: 'Peticionar IA', icon: FileText },
    { id: 'prazos', label: 'Triagem de Prazos', icon: Clock },
    { id: 'emails', label: 'E-mails & LGPD', icon: Mail },
    { id: 'automacao', label: 'Automação E-mail', icon: Zap },
    { id: 'audiencias', label: 'Agenda Audiências', icon: CalendarRange },
    { id: 'documentos', label: 'Documentos', icon: FolderClosed },
    { id: 'config', label: 'Personalizar', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
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

  const navContent = (
    <div className="flex flex-col h-full bg-[#111215] text-slate-100 border-r border-[#1F2125]">
      {/* Header / Logo */}
      <div className="flex items-center justify-between p-4 border-b border-[#1F2125]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Scale size={20} className="shrink-0 animate-pulse" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg tracking-tight whitespace-nowrap bg-gradient-to-r from-amber-300 via-amber-100 to-white bg-clip-text text-transparent">
              {appName}
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 hover:bg-[#1C1E22] rounded-lg text-slate-400 hover:text-white transition-colors"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isPrazos = item.id === 'prazos';
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#1C1E22] text-amber-400 border-l-4 border-amber-500 font-semibold pl-2 shadow-inner'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#16181C]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {isPrazos && todayCount > 0 && (
                collapsed ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#111215] animate-pulse" />
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded-full animate-pulse">
                    {todayCount}
                  </span>
                )
              )}
            </button>
          );
        })}

        {/* Urgent Deadlines Today Widget */}
        {!collapsed && todayCount > 0 && (
          <div className="mt-6 p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl space-y-2 animate-pulse">
            <div className="flex items-center gap-1.5 text-red-400">
              <Clock size={14} className="shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Urgência Hoje</span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              Você tem <strong className="text-red-400 font-bold">{todayCount} {todayCount === 1 ? 'prazo vencendo' : 'prazos vencendo'}</strong> hoje!
            </p>
            <button
              onClick={() => handleTabClick('prazos')}
              className="w-full text-center py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
            >
              Visualizar Prazos
            </button>
          </div>
        )}
      </nav>

      {/* Footer / User Badge */}
      <div className="p-4 border-t border-[#1F2125] bg-[#0B0C0E]/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-xs font-semibold text-amber-400 shrink-0">
            ADV
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">Escritório de Elite</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <p className="text-[10px] text-slate-400 font-mono truncate">LGPD Conforme</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#111215] text-slate-100 border-b border-[#1F2125] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">
            <Scale size={18} />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-white">
            {appName}
          </span>
          {todayCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/15 border border-red-500/35 rounded-full text-red-400 font-mono text-[9px] font-bold animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>{todayCount} hoje</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 hover:bg-[#1C1E22] rounded text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 h-screen sticky top-0 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {navContent}
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        ></div>
      )}

      {/* Mobile Drawer Content */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
}
