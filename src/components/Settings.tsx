/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Palette, Layout, Save, Check, RotateCcw, AlertCircle, ShieldAlert } from 'lucide-react';

interface SettingsProps {
  appName: string;
  setAppName: (name: string) => void;
  appTheme: string;
  setAppTheme: (theme: string) => void;
}

export default function Settings({
  appName,
  setAppName,
  appTheme,
  setAppTheme,
}: SettingsProps) {
  const [localName, setLocalName] = useState(appName);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const themeOptions = [
    { id: 'amber', name: 'Dourado Imperial', primaryColor: '#f59e0b', colorClass: 'bg-[#f59e0b]', desc: 'Ouro sofisticado e clássico' },
    { id: 'emerald', name: 'Esmeralda / Verde', primaryColor: '#10b981', colorClass: 'bg-[#10b981]', desc: 'Verde oliva ecológico e relaxante' },
    { id: 'blue', name: 'Azul Corporativo', primaryColor: '#3b82f6', colorClass: 'bg-[#3b82f6]', desc: 'Azul sóbrio, tecnológico e corporativo' },
    { id: 'violet', name: 'Púrpura Imperial', primaryColor: '#8b5cf6', colorClass: 'bg-[#8b5cf6]', desc: 'Violeta moderno de alta autoridade' },
    { id: 'rose', name: 'Carmesim Nobre', primaryColor: '#f43f5e', colorClass: 'bg-[#f43f5e]', desc: 'Vermelho vibrante, urgente e enérgico' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (localName.trim()) {
      setAppName(localName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleReset = () => {
    setLocalName('JurisSábio IA');
    setAppName('JurisSábio IA');
    setAppTheme('amber');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="settings-container" className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[#1F2125] pb-4">
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Palette className="text-amber-500 animate-pulse" size={24} /> Configurações & Personalização
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Personalize a identidade visual e o nome do seu painel jurídico inteligente para melhor atender à marca do seu escritório.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Form: App Name and Theme */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: App Name */}
          <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2 border-b border-[#1F2125] pb-2 font-mono uppercase tracking-wider">
              <Layout size={16} className="text-amber-500" /> Nome da Plataforma (Branding)
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Nome Personalizado do Sistema
                </label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="Ex: Advocacia Silva & Associados"
                  maxLength={40}
                  className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none transition-colors shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-slate-400 hover:text-white border border-[#1F2125] hover:bg-[#16181C] text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Restaurar Padrões
                </button>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-semibold animate-fade-in">
                      <Check size={12} /> Salvo com sucesso!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save size={13} /> Salvar Nome
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: Colors */}
          <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2 border-b border-[#1F2125] pb-2 font-mono uppercase tracking-wider">
              <Palette size={16} className="text-amber-500" /> Esquema de Cor do Cliente (Agradável)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Escolha uma cor temática para o cabeçalho, botões, indicadores de prazos urgentes e barras laterais. O sistema adapta-se instantaneamente à cor selecionada.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {themeOptions.map((option) => {
                const isSelected = appTheme === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      setAppTheme(option.id);
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    }}
                    className={`border rounded-xl p-3.5 cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-amber-500/40 bg-amber-500/5 shadow-inner'
                        : 'border-[#1F2125] bg-[#16181C]/40 hover:border-amber-500/20'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full border border-[#1F2125] shrink-0 flex items-center justify-center text-white ${option.colorClass}`}>
                      {isSelected && <Check size={14} className="drop-shadow-md text-slate-950 stroke-[3]" />}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-200 text-xs">{option.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{option.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Live preview info */}
        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-xs text-amber-400 font-mono uppercase tracking-wider border-b border-[#1F2125] pb-2 flex items-center gap-1.5">
            <AlertCircle size={14} /> Detalhes do Branding
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-mono block">Nome Atual</span>
              <p className="text-sm font-bold text-slate-200">{appName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-mono block">Tom Ativo</span>
              <p className="text-xs font-semibold text-amber-400 capitalize">
                {themeOptions.find(o => o.id === appTheme)?.name || appTheme}
              </p>
            </div>

            <div className="bg-[#16181C] border border-[#1F2125] rounded-xl p-3.5 space-y-2 text-[11px] text-slate-400 leading-relaxed">
              <ShieldAlert size={16} className="text-amber-500" />
              <p>
                As alterações realizadas aqui são aplicadas diretamente no navegador em tempo real e persistidas localmente no dispositivo para as suas próximas sessões de trabalho.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
