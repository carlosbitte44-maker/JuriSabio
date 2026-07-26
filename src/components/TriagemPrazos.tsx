/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Clock, AlertTriangle, Calendar, Plus, CheckCircle, RefreshCw, Sparkles, BookOpen, Trash2, Search, Filter, Download } from 'lucide-react';
import { Deadline, Case } from '../types';
import { jsPDF } from 'jspdf';

interface TriagemPrazosProps {
  cases: Case[];
  deadlines: Deadline[];
  onDeadlineAdded: () => void;
  onDeadlineUpdated: () => void;
  onDeadlineDeleted: (id: string) => void;
}

export default function TriagemPrazos({
  cases,
  deadlines,
  onDeadlineAdded,
  onDeadlineUpdated,
  onDeadlineDeleted,
}: TriagemPrazosProps) {
  // Triage state
  const [publicationText, setPublicationText] = useState('');
  const [isTriaging, setIsTriaging] = useState(false);
  const [triagedResult, setTriagedResult] = useState<any | null>(null);

  // Filter state for monitoring active list
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Pendente' | 'Concluído'>('Todos');
  const [filterUrgency, setFilterUrgency] = useState<'Todos' | 'Crítica' | 'Alta' | 'Média'>('Todos');
  const [filterResponsible, setFilterResponsible] = useState<string>('Todos');

  // Manual Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualDueDate, setManualDueDate] = useState('');
  const [manualUrgency, setManualUrgency] = useState<'Crítica' | 'Alta' | 'Média'>('Média');
  const [manualResponsible, setManualResponsible] = useState('Dra. Amanda Medeiros');
  const [manualCaseId, setManualCaseId] = useState('');

  // Triage legal publication using Gemini
  const handleTriagePublication = async () => {
    if (!publicationText.trim()) return;
    setIsTriaging(true);
    setTriagedResult(null);

    try {
      const response = await fetch('/api/gemini/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: publicationText }),
      });
      const data = await response.json();
      if (data.error) {
        alert(`Erro na triagem: ${data.error}`);
      } else {
        setTriagedResult(data);
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao conectar à IA de triagem processual.');
    } finally {
      setIsTriaging(false);
    }
  };

  // Save the AI triaged deadline directly into DB
  const handleSaveTriagedDeadline = async () => {
    if (!triagedResult) return;

    // Try matching caseNumber to select caseId if available
    const matchedCase = cases.find((c) => triagedResult.caseNumber && c.number.includes(triagedResult.caseNumber.trim()));
    const finalCaseId = matchedCase ? matchedCase.id : (cases[0]?.id || 'case-1');
    const finalCaseNumber = matchedCase ? matchedCase.number : (triagedResult.caseNumber || '1002345-67.2026.8.26.0100');

    try {
      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: finalCaseId,
          caseNumber: finalCaseNumber,
          title: triagedResult.title,
          description: `${triagedResult.description} (Fundamento: ${triagedResult.legalBasis})`,
          dueDate: triagedResult.dueDate,
          status: 'Pendente',
          urgency: triagedResult.urgency === 'Crítica' ? 'Crítica' : triagedResult.urgency === 'Alta' ? 'Alta' : 'Média',
          responsible: triagedResult.responsible,
        }),
      });

      if (response.ok) {
        onDeadlineAdded();
        setTriagedResult(null);
        setPublicationText('');
        alert('Prazo triado com sucesso e agendado no sistema!');
      }
    } catch (err) {
      console.error('Erro ao salvar prazo triado:', err);
    }
  };

  // Manual save deadline
  const handleSaveManualDeadline = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualDueDate) return;

    const matchedCase = cases.find((c) => c.id === manualCaseId);

    try {
      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: manualCaseId || 'case-1',
          caseNumber: matchedCase ? matchedCase.number : 'Geral',
          title: manualTitle,
          description: manualDesc,
          dueDate: manualDueDate,
          status: 'Pendente',
          urgency: manualUrgency,
          responsible: manualResponsible,
        }),
      });

      if (response.ok) {
        onDeadlineAdded();
        setShowAddForm(false);
        setManualTitle('');
        setManualDesc('');
        setManualDueDate('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (dl: Deadline) => {
    const newStatus = dl.status === 'Pendente' ? 'Concluído' : 'Pendente';
    try {
      const response = await fetch(`/api/deadlines/${dl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        onDeadlineUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic filtered deadlines list based on screen inputs
  const filteredDeadlines = deadlines.filter((dl) => {
    const matchesSearch =
      dl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dl.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dl.description && dl.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'Todos' ? true : dl.status === filterStatus;
    const matchesUrgency = filterUrgency === 'Todos' ? true : dl.urgency === filterUrgency;
    const matchesResponsible = filterResponsible === 'Todos' ? true : dl.responsible === filterResponsible;
    
    return matchesSearch && matchesStatus && matchesUrgency && matchesResponsible;
  });

  // Unique list of responsibles for screen filters
  const uniqueResponsibles = ['Todos', ...Array.from(new Set(deadlines.map((d) => d.responsible).filter(Boolean)))];

  // PDF Generator for currently filtered deadlines and cases
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Top Brand Gold Accent Line
    doc.setFillColor(212, 175, 55); // #d4af37
    doc.rect(15, 12, 180, 2, 'F');

    // Brand / Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(17, 18, 21); // Dark grey/black
    doc.text('JurisSábio IA - Relatório Consolidado de Prazos', 15, 22);

    // Generation timestamp & details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139); // Slate Grey
    const generatedAtStr = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}  |  Total de Prazos: ${filteredDeadlines.length}`;
    doc.text(generatedAtStr, 15, 28);

    // Applied Filters Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 33, 180, 13, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Filtros aplicados no monitoramento:', 18, 41);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const filterText = `Busca: "${searchTerm || 'Nenhum'}"  |  Status: ${filterStatus}  |  Urgência: ${filterUrgency}  |  Responsável: ${filterResponsible}`;
    doc.text(filterText.length > 95 ? filterText.substring(0, 92) + '...' : filterText, 72, 41);

    let y = 53;

    if (filteredDeadlines.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhum prazo processual localizado com os filtros aplicados na tela.', 15, y + 5);
    } else {
      filteredDeadlines.forEach((dl, index) => {
        // Height safety check (A4 page is 297mm)
        if (y > 255) {
          doc.addPage();
          // Top Brand Accent
          doc.setFillColor(212, 175, 55);
          doc.rect(15, 12, 180, 1.5, 'F');
          y = 22;
        }

        // Inner card for each deadline
        doc.setFillColor(252, 252, 253);
        doc.setDrawColor(241, 245, 249);
        doc.rect(15, y, 180, 31, 'FD');

        // Draw Left Urgency border band
        let stripeColor = [148, 163, 184]; // default Slate
        if (dl.urgency === 'Crítica') stripeColor = [239, 68, 68]; // Red
        else if (dl.urgency === 'Alta') stripeColor = [245, 158, 11]; // Amber
        doc.setFillColor(stripeColor[0], stripeColor[1], stripeColor[2]);
        doc.rect(15, y, 2.5, 31, 'F');

        // Title text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); // slate 900
        const titleStr = `${index + 1}. ${dl.title}`;
        doc.text(titleStr.length > 60 ? titleStr.substring(0, 57) + '...' : titleStr, 21, y + 6);

        // Status alignment
        doc.setFontSize(9);
        if (dl.status === 'Concluído') {
          doc.setTextColor(16, 185, 129); // emerald 500
          doc.text('[CONCLUÍDO]', 162, y + 6);
        } else {
          doc.setTextColor(220, 38, 38); // red 600
          doc.text('[PENDENTE]', 164, y + 6);
        }

        // Associated Case / Client info
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate 500
        const associatedCase = cases.find((c) => c.id === dl.caseId || c.number === dl.caseNumber);
        const caseDetailsStr = associatedCase
          ? `Processo: ${dl.caseNumber}  •  Cliente: ${associatedCase.client} (${associatedCase.court})`
          : `Processo: ${dl.caseNumber}`;
        doc.text(caseDetailsStr.length > 95 ? caseDetailsStr.substring(0, 92) + '...' : caseDetailsStr, 21, y + 11.5);

        // Description / task
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85); // slate 700
        const descLines = doc.splitTextToSize(dl.description || 'Nenhuma descrição complementar.', 168);
        const cappedLines = descLines.slice(0, 2);
        doc.text(cappedLines, 21, y + 17);

        // Card Footer metadata
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate 500

        const localDate = new Date(dl.dueDate).toLocaleDateString('pt-BR');
        doc.text(`VENCIMENTO: ${localDate}`, 21, y + 26.5);

        doc.setFont('helvetica', 'normal');
        doc.text(`RESPONSÁVEL: ${dl.responsible.toUpperCase()}`, 74, y + 26.5);

        doc.setFont('helvetica', 'bold');
        if (dl.urgency === 'Crítica') doc.setTextColor(220, 38, 38);
        else if (dl.urgency === 'Alta') doc.setTextColor(217, 119, 6);
        else doc.setTextColor(100, 116, 139);
        doc.text(`URGÊNCIA: ${dl.urgency.toUpperCase()}`, 148, y + 26.5);

        y += 35; // card height + spacing
      });
    }

    // Footnotes branding
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('JurisSábio IA — Relatório confidencial de inteligência processual e compliance.', 15, 285);

    doc.save(`relatorio-prazos-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2125] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-amber-500" size={24} /> Triagem Processual de Prazos Urgentes
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Cole a publicação judicial do Diário de Justiça (DJE) e deixe a IA rastrear prazos em dias úteis automaticamente.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          {showAddForm ? 'Fechar Formulário' : 'Lançar Prazo Manual'} <Plus size={14} />
        </button>
      </div>

      {/* Manual Add Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleSaveManualDeadline} className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Título da Providência</label>
            <input
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Ex: Apresentar Réplica"
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Caso Vinculado</label>
            <select
              required
              value={manualCaseId}
              onChange={(e) => setManualCaseId(e.target.value)}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            >
              <option value="">-- Selecione o Processo --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number} - {c.client}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Data Limite (Prazo)</label>
            <input
              type="date"
              required
              value={manualDueDate}
              onChange={(e) => setManualDueDate(e.target.value)}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-medium text-slate-400">Descrição / Instruções do Prazo</label>
            <textarea
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              placeholder="Descreva o que deve ser protocolado ou providenciado..."
              rows={2}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none resize-none"
            ></textarea>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Urgência</label>
            <select
              value={manualUrgency}
              onChange={(e) => setManualUrgency(e.target.value as any)}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            >
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Advogado Responsável</label>
            <input
              type="text"
              required
              value={manualResponsible}
              onChange={(e) => setManualResponsible(e.target.value)}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="flex items-end justify-end">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 px-6 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Salvar Prazo
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: AI Triage Input vs Active Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: AI Copy Paste Triager */}
        <div className="lg:col-span-5 bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1F2125] pb-3">
            <Sparkles className="text-amber-500" size={18} />
            <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider">
              Análise de Publicação Judicial
            </h3>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Texto da Intimação / Diário Oficial</label>
            <textarea
              value={publicationText}
              onChange={(e) => setPublicationText(e.target.value)}
              placeholder="Cole aqui o recorte oficial ou a notificação de prazo recebida no e-mail..."
              rows={6}
              className="w-full bg-[#16181C] border border-[#1F2125] focus:border-amber-500/40 text-slate-100 text-xs rounded-xl p-3 outline-none resize-none transition-colors"
            ></textarea>
          </div>

          <button
            onClick={handleTriagePublication}
            disabled={isTriaging || !publicationText.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            {isTriaging ? (
              <>
                <RefreshCw className="animate-spin" size={14} /> Triando Publicação com IA...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Triar Publicação e Gerar Prazo
              </>
            )}
          </button>

          {/* AI Triaged Result Panel */}
          {triagedResult && (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-xs text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1">
                <CheckCircle size={14} className="text-emerald-400 animate-bounce" /> Ficha Técnica Triada por IA
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-slate-400">Título Sugerido:</span>
                  <p className="font-semibold text-slate-200">{triagedResult.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium text-slate-400">Data Limite Estimada:</span>
                    <p className="font-bold text-amber-400 font-mono">{triagedResult.dueDate}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400">Nível Urgência:</span>
                    <p className={`font-semibold ${
                      triagedResult.urgency === 'Crítica' ? 'text-red-400' : triagedResult.urgency === 'Alta' ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {triagedResult.urgency}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-400">Resumo da Decisão:</span>
                  <p className="text-slate-300 leading-relaxed">{triagedResult.description}</p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#16181C] border border-[#1F2125] p-2 rounded-lg text-slate-300">
                  <BookOpen size={12} className="text-amber-500 shrink-0" />
                  <span className="font-mono text-[10px] leading-none">Fundamento: {triagedResult.legalBasis}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setTriagedResult(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSaveTriagedDeadline}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Lançar na Agenda
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Deadlines Table/List */}
        <div className="lg:col-span-7 bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4 h-[600px] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F2125] pb-3 gap-2">
            <div>
              <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider">
                Prazos Processuais sob Monitoramento
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Filtre os prazos abaixo e gere relatórios consolidados em PDF.</p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-300 bg-[#16181C] border border-[#1F2125] px-2.5 py-1 rounded-full font-mono">
                {filteredDeadlines.length} exibidos
              </span>
              <button
                onClick={handleExportPDF}
                title="Exportar relatório consolidado dos prazos filtrados em PDF"
                className="bg-amber-500 hover:bg-amber-600 text-[#111215] font-bold text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={13} /> Relatório PDF
              </button>
            </div>
          </div>

          {/* Advanced Dynamic Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#16181C]/60 p-3 border border-[#1F2125] rounded-xl text-xs shrink-0">
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-1">
              <span className="absolute left-2.5 top-2.5 text-slate-400">
                <Search size={12} />
              </span>
              <input
                type="text"
                placeholder="Buscar prazo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111215] border border-[#1F2125] text-slate-200 pl-8 pr-2.5 py-1.5 rounded-lg outline-none text-[11px] focus:border-amber-500/40 transition-colors"
              />
            </div>

            {/* Status Select */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full bg-[#111215] border border-[#1F2125] text-slate-200 px-2 py-1.5 rounded-lg outline-none text-[11px] focus:border-amber-500/40 transition-colors"
              >
                <option value="Todos">Status: Todos</option>
                <option value="Pendente">Pendentes</option>
                <option value="Concluído">Concluídos</option>
              </select>
            </div>

            {/* Urgency Select */}
            <div>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value as any)}
                className="w-full bg-[#111215] border border-[#1F2125] text-slate-200 px-2 py-1.5 rounded-lg outline-none text-[11px] focus:border-amber-500/40 transition-colors"
              >
                <option value="Todos">Urgência: Todas</option>
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
              </select>
            </div>

            {/* Responsible Select */}
            <div>
              <select
                value={filterResponsible}
                onChange={(e) => setFilterResponsible(e.target.value)}
                className="w-full bg-[#111215] border border-[#1F2125] text-slate-200 px-2 py-1.5 rounded-lg outline-none text-[11px] focus:border-amber-500/40 transition-colors"
              >
                <option value="Todos">Responsável: Todos</option>
                {uniqueResponsibles.filter(r => r !== 'Todos').map((resp) => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredDeadlines.length > 0 ? (
              filteredDeadlines.map((dl) => {
                const isUrgent = dl.urgency === 'Crítica' || dl.urgency === 'Alta';
                const isCompleted = dl.status === 'Concluído';

                return (
                  <div
                    key={dl.id}
                    className={`border border-[#1F2125] rounded-xl p-4 flex items-start justify-between gap-4 transition-all ${
                      isCompleted ? 'bg-[#111215] opacity-50' : 'bg-[#16181C]/40 hover:border-amber-500/20 shadow-sm'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(dl)}
                          className={`p-1 rounded-full border transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-transparent border-slate-600 hover:border-amber-500 text-transparent'
                          }`}
                          title={isCompleted ? 'Reabrir Prazo' : 'Marcar como Concluído'}
                        >
                          <CheckCircle size={14} className={isCompleted ? 'opacity-100' : 'opacity-0'} />
                        </button>
                        <h4 className={`font-semibold text-slate-200 text-sm truncate ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {dl.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 font-mono">{dl.caseNumber}</p>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{dl.description}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : dl.urgency === 'Crítica'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : dl.urgency === 'Alta'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-[#16181C] text-slate-300 border border-[#1F2125]'
                        }`}>
                          {isCompleted ? 'Concluído' : dl.urgency}
                        </span>
                        <span className="text-slate-400 font-mono flex items-center gap-1">
                          <Calendar size={12} /> Prazo: {new Date(dl.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-slate-400 font-mono">
                          • Responsável: {dl.responsible}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeadlineDeleted(dl.id)}
                      className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-[#1C1E22] rounded-lg transition-colors cursor-pointer"
                      title="Excluir Prazo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm text-center py-12">Nenhum prazo processual localizado com estes critérios.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
