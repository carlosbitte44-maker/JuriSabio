/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FileText, Search, Scale, Send, Check, Copy, Save, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { Case } from '../types';

interface PeçasProcessuaisProps {
  cases: Case[];
  onDocumentAdded: () => void;
}

export default function PeçasProcessuais({ cases, onDocumentAdded }: PeçasProcessuaisProps) {
  // Navigation tabs within Peças Processuais
  const [subTab, setSubTab] = useState<'redigir' | 'jurisprudencia'>('redigir');

  // Legal Petition Inputs
  const [draftType, setDraftType] = useState('Petição Inicial');
  const [caseTitle, setCaseTitle] = useState('');
  const [court, setCourt] = useState('TJSP - Foro Central da Capital');
  const [clientName, setClientName] = useState('');
  const [oppositeParty, setOppositeParty] = useState('');
  const [facts, setFacts] = useState('');
  const [legalThesis, setLegalThesis] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  // Drafting State
  const [isDrafting, setIsDrafting] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [editorText, setEditorText] = useState('');
  const [previewMode, setPreviewMode] = useState<'editor' | 'folha'>('editor');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Jurisprudence Research State
  const [jpQuery, setJpQuery] = useState('');
  const [jpTribunal, setJpTribunal] = useState('STJ');
  const [isSearchingJp, setIsSearchingJp] = useState(false);
  const [jpResult, setJpResult] = useState('');

  // Pre-fill fields from existing cases if chosen
  const handleSelectCase = (caseId: string) => {
    if (!caseId) return;
    const selected = cases.find((c) => c.id === caseId);
    if (selected) {
      setCaseTitle(selected.title);
      setClientName(selected.client);
      setCourt(selected.court);
      if (selected.area === 'Civil') {
        setLegalThesis('Com fulcro na responsabilidade civil objetiva, dano moral in re ipsa, Súmula 479 do STJ e Código de Defesa do Consumidor.');
      } else if (selected.area === 'Tributário') {
        setLegalThesis('Inelegibilidade fiscal, princípio da estrita legalidade e tese de exclusão de impostos da base tributável, conforme RE 574.706 do STF.');
      } else if (selected.area === 'Penal') {
        setLegalThesis('Direito fundamental à inviolabilidade domiciliar (Art. 5º, XI, CF), nulidade de provas por busca ilícita sem mandado e precedentes do STF.');
      } else if (selected.area === 'Trabalhista') {
        setLegalThesis('Súmula 338 do TST (ônus da prova do controle de jornada), horas extraordinárias e desvio de função caracterizado com base na CLT.');
      }
    }
  };

  // Generate legal draft from server API
  const handleGenerateDraft = async () => {
    if (!clientName || !draftType) {
      alert('Por favor, defina o Nome do Cliente e o Tipo de Peça Processual.');
      return;
    }

    setIsDrafting(true);
    setGeneratedDraft('');
    setSaved(false);

    try {
      const response = await fetch('/api/gemini/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: draftType,
          caseTitle,
          court,
          client: clientName,
          oppositeParty,
          facts,
          legalThesis,
          customInstructions,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setGeneratedDraft(`Erro: ${data.error}`);
        setEditorText(`Erro: ${data.error}`);
      } else {
        setGeneratedDraft(data.content);
        setEditorText(data.content);
      }
    } catch (err) {
      console.error(err);
      setGeneratedDraft('Falha ao conectar ao servidor de IA jurídica.');
      setEditorText('Falha ao conectar ao servidor de IA jurídica.');
    } finally {
      setIsDrafting(false);
    }
  };

  // Search jurisprudential databases
  const handleSearchJurisprudence = async () => {
    if (!jpQuery) return;
    setIsSearchingJp(true);
    setJpResult('');

    try {
      const response = await fetch('/api/gemini/jurisprudence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: jpQuery, tribunal: jpTribunal }),
      });
      const data = await response.json();
      if (data.error) {
        setJpResult(`Erro na busca: ${data.error}`);
      } else {
        setJpResult(data.result);
      }
    } catch (err) {
      console.error(err);
      setJpResult('Erro de conexão ao pesquisar banco jurisprudencial.');
    } finally {
      setIsSearchingJp(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToHub = async () => {
    if (!editorText) return;
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: 'case-1', // Link to first or general case
          caseNumber: cases[0]?.number || '1002345-67.2026.8.26.0100',
          title: `Peça IA - ${draftType} (${clientName})`,
          type: draftType,
          content: editorText,
          author: 'Advogado Virtuall IA',
          status: 'Rascunho',
        }),
      });

      if (response.ok) {
        setSaved(true);
        onDocumentAdded();
      }
    } catch (err) {
      console.error('Erro ao salvar no hub:', err);
    }
  };

  const legalDraftTypes = [
    'Petição Inicial',
    'Contestação',
    'Recurso de Apelação',
    'Recurso Especial (STJ)',
    'Recurso Extraordinário (STF)',
    'Habeas Corpus',
    'Mandado de Segurança',
    'Réplica à Contestação',
    'Agravo de Instrumento',
  ];

  return (
    <div className="space-y-6">
      {/* Title & Section Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2125] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Scale className="text-amber-500" size={24} /> Redação e Inteligência Processual
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Gerador de petições complexas fundamentadas no CPC, CLT, CPP e jurisprudência pacificada dos tribunais superiores.
          </p>
        </div>

        <div className="flex bg-[#16181C] p-1 rounded-xl shrink-0 border border-[#1F2125]">
          <button
            onClick={() => setSubTab('redigir')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'redigir'
                ? 'bg-[#1C1E22] text-amber-400 shadow-sm border border-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Redigir Petição
          </button>
          <button
            onClick={() => setSubTab('jurisprudencia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'jurisprudencia'
                ? 'bg-[#1C1E22] text-amber-400 shadow-sm border border-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pesquisa de Jurisprudência
          </button>
        </div>
      </div>

      {subTab === 'redigir' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Parameters / Input Form */}
          <div className="lg:col-span-5 bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider border-b border-[#1F2125] pb-2">
              Parâmetros da Peça Processual
            </h3>

            {/* Link to existing Case */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Vincular a um Caso Ativo (Opcional)</label>
              <select
                onChange={(e) => handleSelectCase(e.target.value)}
                className="w-full bg-[#16181C] border border-[#1F2125] hover:border-amber-500/20 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
              >
                <option value="">-- Escolha um caso para preenchimento rápido --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.number} - {c.client}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Tipo de Peça</label>
                <select
                  value={draftType}
                  onChange={(e) => setDraftType(e.target.value)}
                  className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none"
                >
                  {legalDraftTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Tribunal / Juízo</label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  placeholder="Ex: TJSP - 15ª Vara Cível"
                  className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Parte Autora (Cliente)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Qualificação ou nome completo"
                  className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Parte Ré / Oposta</label>
                <input
                  type="text"
                  value={oppositeParty}
                  onChange={(e) => setOppositeParty(e.target.value)}
                  placeholder="Nome do réu / empresa ré"
                  className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Descrição dos Fatos (Causa de Pedir)</label>
              <textarea
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                placeholder="Exponha resumidamente os acontecimentos e o dano sofrido pelo cliente..."
                rows={3}
                className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none resize-none"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Tese Jurídica e Fundamentação</label>
              <textarea
                value={legalThesis}
                onChange={(e) => setLegalThesis(e.target.value)}
                placeholder="Insira teses, artigos violados ou Súmulas que sustentam o pedido..."
                rows={3}
                className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none resize-none"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Instruções Customizadas para IA</label>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex: Pedir liminar urgente, focar no dano in re ipsa..."
                className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <button
              onClick={handleGenerateDraft}
              disabled={isDrafting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/30 text-white disabled:text-amber-500/50 font-semibold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer border border-amber-500/20"
            >
              {isDrafting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Redigindo Peça de Alta Complexidade...
                </>
              ) : (
                <>
                  <Send size={16} /> Estruturar e Gerar Petição IA
                </>
              )}
            </button>
          </div>

          {/* Editor & Preview Workspace */}
          <div className="lg:col-span-7 bg-[#111215] border border-[#1F2125] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]">
            {/* Workspace Controls */}
            <div className="bg-[#16181C] border-b border-[#1F2125] px-4 py-3 flex items-center justify-between">
              <div className="flex bg-[#111215] p-0.5 rounded-lg border border-[#1F2125]">
                <button
                  onClick={() => setPreviewMode('editor')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    previewMode === 'editor' ? 'bg-[#1C1E22] text-amber-400 shadow-sm border border-amber-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Editor de Rascunho
                </button>
                <button
                  onClick={() => setPreviewMode('folha')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    previewMode === 'folha' ? 'bg-[#1C1E22] text-amber-400 shadow-sm border border-amber-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Visualizar Petição Física
                </button>
              </div>

              {editorText && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 text-slate-400 hover:text-white hover:bg-[#1C1E22] rounded-lg transition-colors"
                    title="Copiar Conteúdo"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleSaveToHub}
                    disabled={saved}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-emerald-400 text-xs font-semibold rounded-lg shadow-sm border border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer"
                  >
                    <Save size={14} /> {saved ? 'Salvo no Hub!' : 'Salvar no Hub'}
                  </button>
                </div>
              )}
            </div>

            {/* Editing / Preview Canvas */}
            <div className="flex-1 p-5 overflow-y-auto bg-[#16181C]/20">
              {isDrafting ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                  <p className="text-sm font-semibold text-slate-200">O advogado virtual está fundamentando sua peça...</p>
                  <p className="text-xs text-slate-400 max-w-sm text-center">
                    Buscando teses constitucionais, súmulas vinculantes do STF e acórdãos recentes de recursos repetitivos no STJ.
                  </p>
                </div>
              ) : editorText ? (
                previewMode === 'editor' ? (
                  <textarea
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    className="w-full h-full p-4 bg-[#111215] border border-[#1F2125] rounded-xl outline-none font-sans text-sm text-slate-200 leading-relaxed shadow-sm resize-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/30"
                  ></textarea>
                ) : (
                  /* Physical Legal Paper Simulator */
                  <div className="bg-white border border-slate-300 shadow-md p-10 max-w-[550px] mx-auto min-h-[700px] font-serif text-slate-900 text-xs leading-[2] relative">
                    {/* Legal Watermark and Margins */}
                    <div className="absolute top-0 bottom-0 left-6 border-l border-red-200"></div>
                    <div className="absolute top-0 bottom-0 right-6 border-r border-red-200"></div>
                    <div className="pl-6 pr-6 whitespace-pre-line">{editorText}</div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                  <FileText size={48} className="text-slate-600 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-300">Nenhuma petição estruturada ainda.</p>
                  <p className="text-xs text-center max-w-xs text-slate-400">
                    Preencha os dados do caso à esquerda e mande o JurisSábio IA redigir uma peça processual robusta.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Jurisprudence Assistant Hub */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left search pane */}
          <div className="lg:col-span-4 bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider border-b border-[#1F2125] pb-2 flex items-center gap-1.5">
              <BookOpen size={16} className="text-amber-500" /> Pesquisa de Teses Superiores
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Tema ou Matéria Jurídica</label>
              <textarea
                value={jpQuery}
                onChange={(e) => setJpQuery(e.target.value)}
                placeholder="Ex: Prisão civil do depositário infiel, Exclusão de tributos, Cobrança indevida em conta poupança..."
                rows={4}
                className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none resize-none"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Tribunal Superior Alvo</label>
              <select
                value={jpTribunal}
                onChange={(e) => setJpTribunal(e.target.value)}
                className="w-full bg-[#16181C] border border-[#1F2125] text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none"
              >
                <option value="STJ">STJ (Superior Tribunal de Justiça)</option>
                <option value="STF">STF (Supremo Tribunal Federal)</option>
                <option value="TST">TST (Tribunal Superior do Trabalho)</option>
                <option value="Todos">Todos os Tribunais Superiores</option>
              </select>
            </div>

            <button
              onClick={handleSearchJurisprudence}
              disabled={isSearchingJp || !jpQuery}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-amber-400 font-semibold py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer border border-amber-500/20 hover:border-amber-500/40"
            >
              {isSearchingJp ? (
                <>
                  <RefreshCw className="animate-spin" size={14} /> Vasculhando Jurisprudência...
                </>
              ) : (
                <>
                  <Search size={14} /> Pesquisar Jurisprudência Atualizada
                </>
              )}
            </button>
          </div>

          {/* Right Results pane */}
          <div className="lg:col-span-8 bg-[#111215] border border-[#1F2125] rounded-2xl shadow-sm p-6 min-h-[450px] flex flex-col">
            <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider border-b border-[#1F2125] pb-3">
              Resultado Técnico da Análise de Precedentes
            </h3>

            <div className="flex-1 mt-4 overflow-y-auto">
              {isSearchingJp ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
                  <p className="text-xs text-slate-400">Pesquisando teses sumuladas, acórdãos paradigmas e temas repetitivos...</p>
                </div>
              ) : jpResult ? (
                <div className="prose prose-sm max-w-none text-slate-200 leading-relaxed whitespace-pre-line bg-[#16181C]/40 border border-[#1F2125] p-4 rounded-xl">
                  {jpResult}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 py-16">
                  <Search size={40} className="text-slate-600 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-300">Aguardando termo de pesquisa.</p>
                  <p className="text-xs text-slate-400 max-w-xs text-center">
                    Mande o assistente vasculhar teses relevantes. O resultado trará aplicação imediata para suas petições.
                  </p>
                </div>
              )}
            </div>

            {jpResult && !isSearchingJp && (
              <div className="border-t border-[#1F2125] pt-3 mt-4 flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <AlertCircle size={14} className="text-amber-500" />
                  Considere incorporar estes temas à redação da sua petição.
                </span>
                <button
                  onClick={() => {
                    setLegalThesis(jpResult.slice(0, 1000));
                    setSubTab('redigir');
                  }}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
                >
                  Usar na Petição
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
