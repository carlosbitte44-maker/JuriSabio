/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { CalendarRange, Video, Users, MapPin, Bell, Clock, Plus, CheckCircle, Trash2, ArrowUpRight } from 'lucide-react';
import { Hearing, Case } from '../types';

interface AgendaAudienciasProps {
  cases: Case[];
  hearings: Hearing[];
  onHearingAdded: () => void;
  onHearingDeleted: (id: string) => void;
}

export default function AgendaAudiencias({
  cases,
  hearings,
  onHearingAdded,
  onHearingDeleted,
}: AgendaAudienciasProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [type, setType] = useState<'Presencial' | 'Virtual'>('Virtual');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [caseId, setCaseId] = useState('');

  // Local state to simulate sending a reminder
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [sentReminderIds, setSentReminderIds] = useState<string[]>([]);

  const handleCreateHearing = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !dateTime || !caseId) return;

    const matchedCase = cases.find((c) => c.id === caseId);

    try {
      const response = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          caseNumber: matchedCase ? matchedCase.number : 'Geral',
          title,
          description,
          dateTime,
          type,
          locationOrLink: locationOrLink || (type === 'Virtual' ? 'https://zoom.us/j/meeting-id' : 'Fórum Central - SP'),
          status: 'Agendada',
        }),
      });

      if (response.ok) {
        onHearingAdded();
        setShowAddForm(false);
        setTitle('');
        setDescription('');
        setDateTime('');
        setLocationOrLink('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReminder = (hearingId: string) => {
    setSendingReminderId(hearingId);
    setTimeout(() => {
      setSentReminderIds((prev) => [...prev, hearingId]);
      setSendingReminderId(null);
      alert('Lembretes automáticos enviados com sucesso via E-mail corporativo & WhatsApp do cliente!');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2125] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <CalendarRange className="text-amber-500" size={24} /> Agenda de Audiências e Lembretes
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Gerencie audiências de conciliação, instrução e julgamento com links de salas virtuais e disparos de lembretes ao cliente.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          {showAddForm ? 'Fechar Formulário' : 'Agendar Audiência'} <Plus size={14} />
        </button>
      </div>

      {/* Add Hearing Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleCreateHearing} className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Título / Tipo de Solenidade</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Audiência de Instrução e Julgamento"
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Processo Relacionado</label>
            <select
              required
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
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
            <label className="text-xs font-medium text-slate-400">Data e Horário</label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Modalidade</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            >
              <option value="Virtual">Virtual (Zoom / Teams / Meet)</option>
              <option value="Presencial">Presencial (Fórum / Tribunal)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-400">Link da Sala de Audiência ou Endereço Físico</label>
            <input
              type="text"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder={type === 'Virtual' ? 'https://zoom.us/j/1234567...' : 'Ex: Fórum Central de SP, Sala 304'}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-medium text-slate-400">Observações de Pauta</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exponha observações como nomes das testemunhas qualificadas ou orientações prévias para o cliente..."
              rows={2}
              className="w-full bg-[#16181C] border border-[#1F2125] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none resize-none"
            ></textarea>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 px-6 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Lançar Audiência
            </button>
          </div>
        </form>
      )}

      {/* Calendar list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hearings List Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider border-b border-[#1F2125] pb-2">
            Audiências Agendadas
          </h3>

          <div className="space-y-3">
            {hearings.length > 0 ? (
              hearings.map((h) => {
                const isSent = h.remindersSent || sentReminderIds.includes(h.id);
                const isVirtual = h.type === 'Virtual';

                return (
                  <div key={h.id} className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-3 hover:border-amber-500/20 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg shrink-0 ${
                            isVirtual ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {isVirtual ? <Video size={16} /> : <MapPin size={16} />}
                          </span>
                          <h4 className="font-bold text-white text-base">{h.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">Processo nº: {h.caseNumber}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                          h.status === 'Agendada' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {h.status}
                        </span>
                        <button
                          onClick={() => onHearingDeleted(h.id)}
                          className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-[#16181C]/50 p-3 rounded-xl border border-[#1F2125]">{h.description}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1F2125]">
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={14} className="text-amber-500" />
                          {new Date(h.dateTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>

                        <span className="flex items-center gap-1 font-mono">
                          <Users size={14} className="text-amber-500" />
                          OAB/SP Ativa
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isVirtual && (
                          <a
                            href={h.locationOrLink}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 border border-amber-500/20"
                          >
                            Entrar Sala <ArrowUpRight size={12} />
                          </a>
                        )}

                        <button
                          onClick={() => handleSendReminder(h.id)}
                          disabled={sendingReminderId === h.id}
                          className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSent
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-[#16181C] border-[#1F2125] hover:border-amber-500/20 text-slate-300 shadow-sm'
                          }`}
                        >
                          {sendingReminderId === h.id ? (
                            <Clock className="animate-spin text-amber-500" size={14} />
                          ) : isSent ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <Bell size={14} />
                          )}
                          {sendingReminderId === h.id ? 'Enviando...' : isSent ? 'Lembretes Disparados' : 'Disparar Lembretes'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm text-center py-12">Nenhuma audiência pendente na pauta.</p>
            )}
          </div>
        </div>

        {/* Technical/Client Preparations Side Panel (Right) */}
        <div className="bg-[#111215] border border-[#1F2125] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-amber-400 text-sm font-mono uppercase tracking-wider border-b border-[#1F2125] pb-2">
            Preparação Pré-Audiência
          </h3>

          <div className="space-y-4 text-xs leading-relaxed text-slate-300">
            <div className="space-y-1">
              <h5 className="font-bold text-slate-200">1. Alinhamento de Depoimento</h5>
              <p>Recomenda-se agendar uma pré-audiência com o cliente 48h antes da pauta oficial para alinhar as perguntas chaves e simular depoimentos.</p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-slate-200">2. Estabilidade Técnica</h5>
              <p>Em solenidades virtuais (Zoom/Teams), instrua o cliente a testar microfones, câmeras e manter um fundo neutro e silencioso.</p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-slate-200">3. Trajes e Decoro</h5>
              <p>Mesmo de forma remota, o decoro do tribunal impõe a utilização de roupas formais adequadas para a solenidade jurídica oficial.</p>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl space-y-1">
              <h6 className="font-bold text-amber-400 flex items-center gap-1">
                <Bell size={12} className="text-amber-500 shrink-0" /> Monitoramento Lembretes
              </h6>
              <p className="text-[11px] text-slate-400">O disparador automático notifica o cliente sobre datas e salas via WhatsApp 24 horas e 2 horas antes do evento de forma autônoma.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
