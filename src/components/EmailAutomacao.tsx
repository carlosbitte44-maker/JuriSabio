/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Bot, 
  Play, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  CheckCircle2, 
  Sliders, 
  ToggleLeft, 
  ToggleRight,
  Calendar,
  Layers
} from 'lucide-react';
import { AutomationRule, AutomationLog, Case } from '../types';

interface EmailAutomacaoProps {
  onHearingAdded?: () => void;
  cases?: Case[];
}

export default function EmailAutomacao({ onHearingAdded, cases = [] }: EmailAutomacaoProps) {
  // Rules and Logs State
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [ruleLoading, setRuleLoading] = useState(false);

  // New Rule Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [actionType, setActionType] = useState<AutomationRule['actionType']>('Auto-Resposta');
  const [templateText, setTemplateText] = useState('');
  const [formError, setFormError] = useState('');

  // Simulator Form State
  const [simSender, setSimSender] = useState('carlos.silva.mendes@yahoo.com.br');
  const [simSubject, setSimSubject] = useState('Dúvida urgente sobre minha audiência de conciliação');
  const [simBody, setSimBody] = useState(`Prezada Dra. Amanda,

Gostaria de confirmar se teremos a audiência na próxima semana. Meu CPF é 441.229.400-11 e meu RG é 50.124.992-3.
Pode me enviar o link oficial para entrar no Zoom? 

Obrigado,
Carlos Silva Mendes`);

  // Simulation Result State
  const [simulationResult, setSimulationResult] = useState<{
    ruleTriggered: AutomationRule | null;
    personalizedReply: string;
    isLgpdAlert: boolean;
    destinedSector?: string;
    hasHearing?: boolean;
    hearingDetails?: {
      title: string;
      description: string;
      dateTime: string;
      type: 'Virtual' | 'Presencial';
      locationOrLink: string;
    } | null;
    log: AutomationLog;
  } | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState('');

  // Editable fields for simulation result
  const [editedReply, setEditedReply] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [hearingScheduledStatus, setHearingScheduledStatus] = useState(false);

  // Copy indicator state
  const [copied, setCopied] = useState(false);

  const virtualEmail = 'automacao-rosy@jurissabio.com.br';

  // Sync simulation result edited reply
  useEffect(() => {
    if (simulationResult) {
      setEditedReply(simulationResult.personalizedReply);
      setSelectedCaseId(cases && cases.length > 0 ? cases[0].id : '');
      setHearingScheduledStatus(false);
    } else {
      setEditedReply('');
      setSelectedCaseId('');
    }
  }, [simulationResult, cases]);

  // Fetch initial data
  const fetchData = async () => {
    setRuleLoading(true);
    try {
      const [rulesRes, logsRes] = await Promise.all([
        fetch('/api/automation/rules'),
        fetch('/api/automation/logs')
      ]);
      if (rulesRes.ok && logsRes.ok) {
        const rulesData = await rulesRes.json();
        const logsData = await logsRes.json();
        setRules(rulesData);
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados de automação:', err);
    } finally {
      setRuleLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(virtualEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create a new rule
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !triggerKeyword.trim() || !templateText.trim()) {
      setFormError('Todos os campos são obrigatórios.');
      return;
    }

    try {
      const response = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleName,
          triggerKeyword: triggerKeyword.trim(),
          actionType,
          templateText
        })
      });

      if (response.ok) {
        setRuleName('');
        setTriggerKeyword('');
        setTemplateText('');
        setFormError('');
        setShowAddForm(false);
        fetchData();
      } else {
        const errData = await response.json();
        setFormError(errData.error || 'Erro ao salvar a regra.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Falha na comunicação com o servidor.');
    }
  };

  // Toggle active/inactive rule state
  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const response = await fetch(`/api/automation/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete a rule
  const handleDeleteRule = async (id: string) => {
    if (!confirm('Deseja realmente remover esta regra de automação?')) return;
    try {
      const response = await fetch(`/api/automation/rules/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load a test email scenario in the simulator
  const loadTestScenario = (type: 'audiencia' | 'cobranca' | 'geral') => {
    if (type === 'audiencia') {
      setSimSender('marcos.pereira.adv@uol.com.br');
      setSimSubject('Agendamento de audiência trabalhista de Marcos');
      setSimBody(`Olá,

Gostaria de confirmar se a audiência do processo de horas extras nº 0010452-89.2026.5.02.0002 foi agendada para semana que vem. Meu CPF é 112.553.881-22 e o link da sala virtual do Zoom é https://zoom.us/j/9876543210?pwd=TRT2AudienciaVirtual.

Atenciosamente,
Marcos Pereira`);
    } else if (type === 'cobranca') {
      setSimSender('contato@cobrancafast.com.br');
      setSimSubject('Notificação extrajudicial de cobrança - Banco Crédito Rápido');
      setSimBody(`Prezado cliente,

Consta em nosso sistema uma pendência no valor de R$ 3.450,00 relacionada ao contrato do cliente Roberto Silva, CPF 123.456.789-00. Favor realizar o pagamento imediato ou entrar em contato para proposta de acordo.

Setor de Negociação`);
    } else {
      setSimSender('fernanda.familia@gmail.com');
      setSimSubject('Dúvida sobre a audiência de guarda e pensão alimentícia');
      setSimBody(`Olá Dra. Amanda,

Recebi uma notificação informando que nossa audiência presencial da Vara de Família de SP foi marcada na Rua Barra Funda, 930, Sala 402, para o dia 15/07/2026 às 13:30.
Meu CPF é 334.551.992-00 e meu RG é 12.441.551-0. Pode agendar no sistema para eu não esquecer?

Fernanda de Almeida`);
    }
  };

  // Run the live automation simulation using Gemini API
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimulationResult(null);
    setSimSuccessMsg('');

    try {
      const response = await fetch('/api/automation/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: simSender,
          subject: simSubject,
          body: simBody
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSimulationResult(data);
        setSimSuccessMsg('Automação processada com sucesso pela Inteligência Artificial!');
        fetchData(); // Refresh history logs
      } else {
        alert('Erro ao processar a simulação com a IA.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação de simulação.');
    } finally {
      setSimulating(false);
    }
  };

  const handleScheduleHearing = async () => {
    if (!simulationResult || !simulationResult.hearingDetails) return;
    setIsScheduling(true);
    try {
      const caseItem = cases.find(c => c.id === selectedCaseId);
      const response = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCaseId || 'case-1',
          caseNumber: caseItem ? caseItem.number : 'Triagem de E-mail',
          title: simulationResult.hearingDetails.title,
          description: simulationResult.hearingDetails.description,
          dateTime: simulationResult.hearingDetails.dateTime,
          type: simulationResult.hearingDetails.type,
          locationOrLink: simulationResult.hearingDetails.locationOrLink,
          status: 'Agendada'
        })
      });
      if (response.ok) {
        if (onHearingAdded) onHearingAdded();
        setHearingScheduledStatus(true);
        alert('Audiência registrada com absoluto sucesso na Agenda Jurídica!');
      } else {
        alert('Erro ao agendar audiência.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao agendar audiência.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2125] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500/20" size={24} /> Automações de E-mail & Regras de Entrada
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Crie fluxos de trabalho, configure regras de auto-resposta, realize triagens automáticas por setor jurídico e garanta a conformidade regulatória.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#111215] border border-[#1F2125] px-3 py-1.5 rounded-lg text-xs text-slate-300 font-mono">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Filtro de Privacidade & Classificador Ativo</span>
        </div>
      </div>

      {/* Integration Virtual Inbox Row */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="text-amber-500 shrink-0" size={18} />
            <span className="text-sm font-semibold text-white">Endereço de Automação Ativo</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Redirecione os e-mails recebidos do seu tribunal ou site de intimações para este endereço exclusivo. A IA irá analisá-los, executar as regras correspondentes e salvar rascunhos limpos de LGPD automaticamente.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111215] border border-[#1F2125] p-2 rounded-xl w-full md:w-auto justify-between max-w-md shrink-0">
          <span className="text-xs text-amber-400 font-mono select-all px-2">{virtualEmail}</span>
          <button
            onClick={handleCopyEmail}
            className="p-1.5 hover:bg-[#1C1E22] text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            title="Copiar e-mail"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Main Container Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Rules column (Left/Mid) */}
        <div className="lg:col-span-6 bg-[#111215] border border-[#1F2125] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1F2125] pb-3">
            <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} /> Regras Ativas de Fluxo
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Nova Regra
            </button>
          </div>

          {/* Add Rule Form Modal/Container */}
          {showAddForm && (
            <form onSubmit={handleAddRule} className="bg-[#16181C] border border-amber-500/20 p-4 rounded-xl space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Criar Regra de Automação</h4>
              
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Nome da Regra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Confirmação de Audiência Trabalhista"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full text-xs bg-[#111215] border border-[#1F2125] rounded-lg p-2 text-white focus:border-amber-500/40 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Palavra-Gatilho (Trigger)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: audiência, intimação"
                    value={triggerKeyword}
                    onChange={(e) => setTriggerKeyword(e.target.value)}
                    className="w-full text-xs bg-[#111215] border border-[#1F2125] rounded-lg p-2 text-white focus:border-amber-500/40 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Ação do Fluxo</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full text-xs bg-[#111215] border border-[#1F2125] rounded-lg p-2 text-slate-300 focus:border-amber-500/40 outline-none"
                  >
                    <option value="Auto-Resposta">Auto-Resposta Inteligente</option>
                    <option value="Triagem Automatizada">Somente Triagem & Alerta</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Template de E-mail de Resposta</label>
                  <span className="text-[9px] text-amber-500 font-mono">Use {`{client_name}, {case_number}, {hearing_link}`}</span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder={`Prezado(a) {client_name},\nConfirmamos o recebimento sobre a intimação processual nº {case_number}.\n...`}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="w-full text-xs bg-[#111215] border border-[#1F2125] rounded-lg p-2 text-white font-sans focus:border-amber-500/40 outline-none resize-none leading-relaxed"
                />
              </div>

              {formError && <p className="text-[11px] text-red-400">{formError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                  }}
                  className="px-3 py-1.5 bg-transparent hover:bg-[#111215] border border-[#1F2125] text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </form>
          )}

          {/* Rules List */}
          <div className="space-y-3">
            {rules.length > 0 ? (
              rules.map((rule) => (
                <div key={rule.id} className="border border-[#1F2125] bg-[#16181C]/40 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-xs leading-none flex items-center gap-1.5">
                        {rule.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono">
                          Gatilho: "{rule.triggerKeyword}"
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono">
                          {rule.actionType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className="p-1 hover:bg-[#1F2125] rounded transition-colors text-slate-400 hover:text-white cursor-pointer"
                        title={rule.isActive ? 'Desativar Regra' : 'Ativar Regra'}
                      >
                        {rule.isActive ? (
                          <ToggleRight size={22} className="text-amber-500" />
                        ) : (
                          <ToggleLeft size={22} className="text-slate-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 hover:bg-[#1F2125] rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Deletar Regra"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111215]/80 p-2.5 rounded-lg border border-[#1F2125]">
                    <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider block mb-1">Rascunho de Auto-Resposta</span>
                    <p className="text-[11px] text-slate-300 font-mono line-clamp-3 leading-relaxed whitespace-pre-line">
                      {rule.templateText}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs text-center py-8">Nenhuma regra de automação configurada.</p>
            )}
          </div>
        </div>

        {/* Live Simulator (Right Panel) */}
        <div className="lg:col-span-6 bg-[#111215] border border-[#1F2125] rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider flex items-center gap-2 border-b border-[#1F2125] pb-3">
            <Bot size={16} /> Simulador de Automação de E-mail
          </h3>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Cenários de Teste Rápidos</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadTestScenario('audiencia')}
                className="px-2.5 py-1.5 bg-[#16181C] hover:bg-amber-500/10 border border-[#1F2125] hover:border-amber-500/30 text-slate-300 hover:text-amber-400 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <Zap size={10} /> Audiência Trabalho (Zoom)
              </button>
              <button
                type="button"
                onClick={() => loadTestScenario('cobranca')}
                className="px-2.5 py-1.5 bg-[#16181C] hover:bg-amber-500/10 border border-[#1F2125] hover:border-amber-500/30 text-slate-300 hover:text-amber-400 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <Zap size={10} /> Cobrança Civil
              </button>
              <button
                type="button"
                onClick={() => loadTestScenario('geral')}
                className="px-2.5 py-1.5 bg-[#16181C] hover:bg-amber-500/10 border border-[#1F2125] hover:border-amber-500/30 text-slate-300 hover:text-amber-400 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <Zap size={10} /> Audiência Família (Presencial)
              </button>
            </div>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Remetente</label>
              <input
                type="email"
                required
                value={simSender}
                onChange={(e) => setSimSender(e.target.value)}
                className="w-full text-xs bg-[#16181C] border border-[#1F2125] rounded-lg p-2 text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Assunto</label>
              <input
                type="text"
                required
                value={simSubject}
                onChange={(e) => setSimSubject(e.target.value)}
                className="w-full text-xs bg-[#16181C] border border-[#1F2125] rounded-lg p-2 text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Corpo do E-mail Recebido (Simulação)</label>
              <textarea
                rows={4}
                required
                value={simBody}
                onChange={(e) => setSimBody(e.target.value)}
                className="w-full text-xs bg-[#16181C] border border-[#1F2125] rounded-lg p-2 text-white font-mono outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-[#16181C] disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {simulating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Processando Automação IA...
                </>
              ) : (
                <>
                  <Play size={12} className="fill-white" /> Executar Simulação de Automação
                </>
              )}
            </button>
          </form>

          {/* Simulation Output Area */}
          {simulationResult && (
            <div className="space-y-4 border-t border-[#1F2125] pt-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Resultado da Triagem IA</span>
                </div>
                {simulationResult.destinedSector && (
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs font-bold font-mono border border-amber-500/20 uppercase flex items-center gap-1">
                    <Layers size={10} /> Setor: {simulationResult.destinedSector}
                  </span>
                )}
              </div>

              {simulationResult.isLgpdAlert && (
                <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <p className="font-semibold">Filtro LGPD Ativado pela IA</p>
                    <p className="text-red-400/80 text-[11px] mt-0.5">Identificamos dados sensíveis no e-mail recebido. Foram limpos e mascarados automaticamente na resposta final abaixo por segurança.</p>
                  </div>
                </div>
              )}

              {/* Hearing detected inside simulated e-mail */}
              {simulationResult.hasHearing && simulationResult.hearingDetails && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1F2125] pb-2">
                    <h4 className="font-semibold text-amber-400 text-xs font-mono flex items-center gap-1.5">
                      <Calendar size={14} /> Audiência Detectada na Simulação
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[9px] font-bold border border-amber-500/20 font-mono uppercase">
                      {simulationResult.hearingDetails.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 uppercase text-[9px] font-mono">Título</p>
                      <p className="text-slate-200 font-semibold">{simulationResult.hearingDetails.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase text-[9px] font-mono">Data/Hora Estimada</p>
                      <p className="text-slate-200 font-mono">
                        {new Date(simulationResult.hearingDetails.dateTime).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {!hearingScheduledStatus ? (
                    <div className="pt-2 border-t border-[#1F2125] flex flex-col md:flex-row items-stretch md:items-center gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <label className="text-[10px] font-semibold text-slate-400 font-mono shrink-0">Caso:</label>
                        <select
                          value={selectedCaseId}
                          onChange={(e) => setSelectedCaseId(e.target.value)}
                          className="bg-[#111215] border border-[#1F2125] text-xs text-slate-300 rounded-md p-1 outline-none w-full"
                        >
                          <option value="">-- Escolha um Processo --</option>
                          {cases.map(c => (
                            <option key={c.id} value={c.id}>{c.client} - {c.number} ({c.area})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleScheduleHearing}
                        disabled={isScheduling}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-[#16181C] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-center shrink-0"
                      >
                        {isScheduling ? 'Agendando...' : '📅 Confirmar & Agendar'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-center font-semibold font-mono">
                      ✓ Audiência inserida com absoluto sucesso na Agenda da Equipe!
                    </div>
                  )}
                </div>
              )}

              {/* Editable Response Textarea in simulator */}
              <div className="bg-[#16181C] border border-[#1F2125] p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-[#1F2125] pb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Resposta Automatizada (Editável)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono border border-amber-500/20">
                    Regra: {simulationResult.ruleTriggered ? simulationResult.ruleTriggered.name : 'Resposta Geral'}
                  </span>
                </div>
                <textarea
                  value={editedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  rows={8}
                  className="w-full text-xs font-mono bg-[#111215] border border-[#1F2125] rounded-lg p-2 text-slate-300 focus:border-amber-500/40 outline-none resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 text-right">Você pode editar e ajustar o e-mail sugerido acima livremente.</p>
              </div>

              <div className="text-[11px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                Log do Sistema: {simulationResult.log.actionTaken}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Logs Section */}
      <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider flex items-center gap-2 border-b border-[#1F2125] pb-3">
          <Clock size={16} /> Histórico de Execuções das Automações (Auditoria)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-[#1F2125] text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Regra Disparada</th>
                <th className="py-3 px-4">Remetente</th>
                <th className="py-3 px-4">Assunto</th>
                <th className="py-3 px-4">Executado em</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Ação Tomada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2125]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#16181C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{log.ruleName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{log.sender}</td>
                    <td className="py-3.5 px-4 truncate max-w-xs">{log.subject}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(log.executedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${
                        log.status === 'Sucesso'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{log.actionTaken}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Nenhum log de auditoria disponível.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
