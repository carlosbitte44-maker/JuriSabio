/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Send, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle, 
  EyeOff, 
  Lock,
  Calendar,
  Briefcase,
  Layers
} from 'lucide-react';
import { LegalEmail, Case } from '../types';

interface EmailsComunicacoesProps {
  emails: LegalEmail[];
  onEmailUpdated: () => void;
  onHearingAdded?: () => void;
  cases?: Case[];
}

export default function EmailsComunicacoes({ 
  emails, 
  onEmailUpdated, 
  onHearingAdded, 
  cases = [] 
}: EmailsComunicacoesProps) {
  const [selectedEmail, setSelectedEmail] = useState<LegalEmail | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'reply' | 'lgpd'>('reply');
  
  // Custom states for edit and schedule
  const [editedReply, setEditedReply] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [hearingScheduledStatus, setHearingScheduledStatus] = useState<boolean>(false);

  // Initialize edit fields when selected email changes
  useEffect(() => {
    if (selectedEmail) {
      setEditedReply(selectedEmail.aiSuggestedReply || '');
      setSelectedCaseId(selectedEmail.caseId || (cases && cases.length > 0 ? cases[0].id : ''));
      setHearingScheduledStatus(false);
    } else {
      setEditedReply('');
      setSelectedCaseId('');
    }
  }, [selectedEmail, cases]);

  // Sync state if selectedEmail's reply is updated by IA processing
  useEffect(() => {
    if (selectedEmail) {
      const refreshed = emails.find(e => e.id === selectedEmail.id);
      if (refreshed && refreshed.aiSuggestedReply && !editedReply) {
        setEditedReply(refreshed.aiSuggestedReply);
      }
    }
  }, [emails, selectedEmail]);

  // Trigger Gemini to analyze email for LGPD and suggest draft reply
  const handleTriggerLgpdAudit = async (id: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/emails/${id}/reply`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.error) {
        alert(`Erro na análise segura: ${data.error}`);
      } else {
        onEmailUpdated();
        // Update local selected email view
        const updated = emails.find((e) => e.id === id);
        if (updated) {
          const updatedWithData = {
            ...updated,
            aiSuggestedReply: data.replyDraft,
            lgpdSensitive: true,
            lgpdReport: data.lgpdReport,
            destinedSector: data.destinedSector,
            hasHearing: data.hasHearing,
            hearingDetails: data.hearingDetails,
            status: 'Lido' as const,
          };
          setSelectedEmail(updatedWithData);
          setEditedReply(data.replyDraft);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao conectar à IA de auditoria segura.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectEmail = (email: LegalEmail) => {
    setSelectedEmail(email);
    // Mark as read in server
    if (email.status === 'Não Lido') {
      fetch(`/api/emails/${email.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Lido' }),
      }).then(() => onEmailUpdated());
    }
  };

  const handleSendSecureReply = async (emailId: string) => {
    if (!selectedEmail) return;
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Respondido',
          aiSuggestedReply: editedReply // Save the user's edits!
        }),
      });
      if (response.ok) {
        onEmailUpdated();
        setSelectedEmail({ 
          ...selectedEmail, 
          status: 'Respondido', 
          aiSuggestedReply: editedReply 
        });
        alert('Resposta segura enviada com criptografia de ponta a ponta!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverrideSector = async (sector: any) => {
    if (!selectedEmail) return;
    try {
      const response = await fetch(`/api/emails/${selectedEmail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinedSector: sector })
      });
      if (response.ok) {
        onEmailUpdated();
        setSelectedEmail({ ...selectedEmail, destinedSector: sector });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleHearing = async () => {
    if (!selectedEmail || !selectedEmail.hearingDetails) return;
    setIsScheduling(true);
    try {
      const caseItem = cases.find(c => c.id === selectedCaseId);
      const response = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCaseId || 'case-1',
          caseNumber: caseItem ? caseItem.number : 'Triagem de E-mail',
          title: selectedEmail.hearingDetails.title,
          description: selectedEmail.hearingDetails.description,
          dateTime: selectedEmail.hearingDetails.dateTime,
          type: selectedEmail.hearingDetails.type,
          locationOrLink: selectedEmail.hearingDetails.locationOrLink,
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
    <div id="emails-governance-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2125] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="text-amber-500" size={24} /> Controle de E-mails & Governança LGPD
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Comunicações criptografadas de ponta a ponta com triagem automática por setor jurídico e segurança sob a Lei Geral de Proteção de Dados.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111215] border border-[#1F2125] px-3 py-1.5 rounded-lg text-xs text-slate-300 font-mono">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Servidor de Triagem e Criptografia Ativo</span>
        </div>
      </div>

      {/* Main Mail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Inbox Column (Left) */}
        <div className="lg:col-span-5 bg-[#111215] border border-[#1F2125] rounded-2xl shadow-sm p-4 h-[650px] flex flex-col space-y-3">
          <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider border-b border-[#1F2125] pb-2">
            Caixa de Entrada Segura
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {emails.length > 0 ? (
              emails.map((e) => {
                const isSelected = selectedEmail?.id === e.id;
                const isUnread = e.status === 'Não Lido';

                return (
                  <div
                    key={e.id}
                    onClick={() => handleSelectEmail(e)}
                    className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-2 relative ${
                      isSelected
                        ? 'border-amber-500/30 bg-amber-500/5 shadow-sm'
                        : 'border-[#1F2125] bg-[#16181C]/40 hover:border-amber-500/20'
                    }`}
                  >
                    {isUnread && (
                      <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-amber-500" />
                    )}

                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-white' : 'text-slate-400'}`}>
                          {e.sender}
                        </p>
                        {e.destinedSector && (
                          <span className="px-1.5 py-0.2 text-[9px] rounded font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                            {e.destinedSector}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-1 ${isUnread ? 'font-semibold text-white' : 'text-slate-300'}`}>
                        {e.subject}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1 border-t border-[#1F2125]/50 pt-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                        e.category === 'Urgente' || e.category === 'Prazo'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-[#16181C] text-slate-300 border border-[#1F2125]'
                      }`}>
                        {e.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {e.hasHearing && (
                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded px-1.5 py-0.5">
                            📅 AUDIÊNCIA
                          </span>
                        )}
                        {e.lgpdSensitive ? (
                          <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 flex items-center gap-1">
                            <ShieldAlert size={10} /> LGPD Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(e.receivedAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-sm text-center py-12">Nenhum e-mail ou notificação processada.</p>
            )}
          </div>
        </div>

        {/* Selected Email Panel (Right) */}
        <div className="lg:col-span-7 bg-[#111215] border border-[#1F2125] rounded-2xl shadow-sm overflow-hidden h-[650px] flex flex-col">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Email Content Header */}
              <div className="p-4 bg-[#16181C] border-b border-[#1F2125] flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-semibold text-white text-sm truncate">{selectedEmail.subject}</h4>
                  <p className="text-xs text-slate-400">
                    De: <span className="font-mono text-slate-300">{selectedEmail.sender}</span>
                  </p>
                  
                  {/* Destined Sector Selector */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Layers size={12} className="text-amber-500" /> Setor Destinatário:
                    </span>
                    <select
                      value={selectedEmail.destinedSector || 'Geral'}
                      onChange={(e) => handleOverrideSector(e.target.value)}
                      className="bg-[#111215] border border-[#1F2125] text-xs text-amber-400 font-semibold px-2 py-1 rounded-md outline-none cursor-pointer hover:border-amber-500/30 transition-all"
                    >
                      <option value="Civil">Civil / Contratos</option>
                      <option value="Trabalhista">Direito Trabalhista</option>
                      <option value="Penal">Direito Penal / Criminal</option>
                      <option value="Família">Vara de Família & Sucessões</option>
                      <option value="Tributário">Tributário / Fiscal</option>
                      <option value="Geral">Atendimento Geral</option>
                    </select>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                    selectedEmail.status === 'Respondido'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {selectedEmail.status}
                  </span>
                </div>
              </div>

              {/* Email Body & AI response tabs */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Original Email Card */}
                <div className="bg-[#16181C]/50 border border-[#1F2125] p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Mensagem Original</span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{selectedEmail.body}</p>
                </div>

                {/* Secure Compliance AI trigger button */}
                {!selectedEmail.aiSuggestedReply && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-amber-400 text-xs font-mono">Análise de Setor, Audiência & Redação Seguro</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        A IA irá classificar a área jurídica, verificar datas de audiências para a agenda e redigir uma auto-resposta editável.
                      </p>
                    </div>
                    <button
                      onClick={() => handleTriggerLgpdAudit(selectedEmail.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin" size={12} /> Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} /> Processar com IA
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Hearing Scheduler Section if detected */}
                {selectedEmail.hasHearing && selectedEmail.hearingDetails && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1F2125] pb-2">
                      <h4 className="font-semibold text-amber-400 text-xs font-mono flex items-center gap-1.5">
                        <Calendar size={14} /> Audiência Identificada pela Triagem
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[9px] font-bold border border-amber-500/20 font-mono uppercase">
                        {selectedEmail.hearingDetails.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500 uppercase text-[9px] font-mono">Título do Evento</p>
                        <p className="text-slate-200 font-semibold">{selectedEmail.hearingDetails.title}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-[9px] font-mono">Data e Hora</p>
                        <p className="text-slate-200 font-mono">
                          {new Date(selectedEmail.hearingDetails.dateTime).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-slate-500 uppercase text-[9px] font-mono">Link / Endereço</p>
                        <p className="text-slate-300 font-mono truncate">{selectedEmail.hearingDetails.locationOrLink}</p>
                      </div>
                    </div>

                    {!hearingScheduledStatus ? (
                      <div className="pt-2 border-t border-[#1F2125] flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <label className="text-[10px] font-semibold text-slate-400 font-mono shrink-0">Associar ao Caso:</label>
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
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-[#16181C] disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-center shrink-0"
                        >
                          {isScheduling ? 'Agendando...' : 'Confirmar & Agendar'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-center font-semibold font-mono">
                        ✓ Audiência devidamente agendada e salva na agenda da equipe!
                      </div>
                    )}
                  </div>
                )}

                {/* AI Outputs (Reply / LGPD analysis) */}
                {selectedEmail.aiSuggestedReply && (
                  <div className="border border-[#1F2125] rounded-xl overflow-hidden flex flex-col shadow-sm">
                    {/* Inner Tabs */}
                    <div className="bg-[#16181C] border-b border-[#1F2125] p-1 flex">
                      <button
                        onClick={() => setActiveSubTab('reply')}
                        className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          activeSubTab === 'reply' ? 'bg-[#111215] text-amber-400 shadow-sm border border-[#1F2125]' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Lock size={12} /> Auto-Resposta Segura (Editável)
                      </button>
                      <button
                        onClick={() => setActiveSubTab('lgpd')}
                        className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          activeSubTab === 'lgpd' ? 'bg-[#111215] text-amber-400 shadow-sm border border-[#1F2125]' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <ShieldCheck size={12} /> Relatório de Governança LGPD
                      </button>
                    </div>

                    {/* Tab contents */}
                    <div className="p-4 bg-[#111215]">
                      {activeSubTab === 'reply' ? (
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider block mb-1">
                            Edite o texto do e-mail abaixo antes de enviar:
                          </label>
                          <textarea
                            value={editedReply}
                            onChange={(e) => setEditedReply(e.target.value)}
                            rows={12}
                            className="w-full text-xs font-mono bg-[#16181C]/50 border border-[#1F2125] rounded-lg p-3 text-slate-200 focus:border-amber-500/40 outline-none resize-none leading-relaxed"
                          />
                          
                          {selectedEmail.status !== 'Respondido' && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => handleSendSecureReply(selectedEmail.id)}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Send size={12} /> Confirmar & Enviar Resposta Criptografada
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs">
                            <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
                            <div>
                              <p className="font-semibold">Vazamento de dados prévio identificado no texto do remetente.</p>
                              <p className="text-red-400/80 mt-0.5">Dados expostos externamente foram devidamente isolados do rascunho de resposta por segurança jurídica.</p>
                            </div>
                          </div>
                          <div className="prose prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-line p-3 border border-[#1F2125] rounded-lg bg-[#16181C]/30">
                            {selectedEmail.lgpdReport}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <Mail size={48} className="text-amber-500/20 stroke-[1.5]" />
              <p className="text-sm font-semibold">Nenhuma mensagem selecionada.</p>
              <p className="text-xs">Escolha um e-mail na caixa de entrada à esquerda para realizar triagens jurídicas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
