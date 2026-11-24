import { useState } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { AGENT_MAP, KORA_AGENTS } from '../data/agents';
import type {
  AgentChatMessage,
  AgentId,
  MarketStudy,
  SimulationSummary,
} from '../types/uemoa';
import { formatXof } from '../utils/simulatorMath';
import { AgentAvatar } from './AgentAvatar';

interface AgentsViewProps {
  study: MarketStudy;
  simulation: SimulationSummary;
  chatHistory: Record<AgentId, AgentChatMessage[]>;
  onAddChatMessage: (agentId: AgentId, msg: AgentChatMessage) => void;
}

const SUGGESTED_PROMPTS: Record<AgentId, string[]> = {
  data: [
    'Quel pays prioriser entre Côte d’Ivoire, Sénégal et Bénin pour démarrer ?',
    'Comment réviser le SAM si on cible uniquement les capitales économiques ?',
  ],
  field: [
    'Quels sont les principaux freins psychologiques des clients à l’adoption ?',
    'Comment adapter notre parcours client aux usages WhatsApp et langues locales ?',
  ],
  marketing: [
    'Propose un plan de lancement 30 jours à Abidjan avec un budget serré.',
    'Comment structurer un pricing psychologique en FCFA pour limiter le churn ?',
  ],
  regulatory: [
    'Quelle forme juridique OHADA choisir et quels agréments prévoir avant lancement ?',
    'Quelles obligations fiscales (TVA, douanes, données personnelles) anticiper ?',
  ],
  finance: [
    'Comment réduire notre besoin en fonds de roulement (BFR) la première année ?',
    'À partir de quel volume de clients atteignons-nous réellement l’équilibre ?',
  ],
  ceo: [
    'Fais-moi une synthèse critique : quel est le point faible majeur de ce projet ?',
    'Quels 3 jalons devons-nous valider avant de lever des fonds en zone UEMOA ?',
  ],
};

export function AgentsView({
  study,
  simulation,
  chatHistory,
  onAddChatMessage,
}: AgentsViewProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('marketing');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAgent = AGENT_MAP[selectedAgentId];
  const messages = chatHistory[selectedAgentId] || [];

  const sendMessage = async (textOverride?: string) => {
    const content = (textOverride ?? input).trim();
    if (!content || sending) return;

    setError(null);
    setInput('');

    const userMsg: AgentChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      agentId: selectedAgentId,
      content,
      timestamp: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    onAddChatMessage(selectedAgentId, userMsg);
    setSending(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          message: content,
          history: [...messages, userMsg],
          study,
          simulationMetrics: {
            totalTamXofM: simulation.totalTamXofM,
            totalSamXofM: simulation.totalSamXofM,
            totalSomYear3XofM: simulation.totalSomYear3XofM,
            year1RevenueXofM: simulation.year1RevenueXofM,
            year3RevenueXofM: simulation.year3RevenueXofM,
            breakEvenMonth: simulation.breakEvenMonth,
          },
        }),
      });
      const rawText = await response.text();
      let data: { reply?: string; error?: string } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (!response.ok || !data.reply) {
        throw new Error(
          data.error ||
            (response.status === 503
              ? 'Service momentanément saturé (503). Réessayez dans quelques secondes.'
              : 'Échec de la réponse de l’agent.')
        );
      }

      onAddChatMessage(selectedAgentId, {
        id: `msg-a-${Date.now()}`,
        role: 'agent',
        agentId: selectedAgentId,
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de communication serveur.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">
          Organigramme & Consultation des 6 Agents
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Sélectionnez un directeur de KORA Études pour lui donner une consigne ou challenger un
          point précis du dossier « {study.title} ».
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: 6 Executive Roster */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {KORA_AGENTS.map((agent) => {
            const active = agent.id === selectedAgentId;
            const hasDeliverable = Boolean(study.deliverables[agent.id]);
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setError(null);
                }}
                className={`w-full text-left p-4 flex items-start gap-3.5 transition-colors ${
                  active ? 'bg-[#0F5132]/[0.05]' : 'hover:bg-slate-50'
                }`}
              >
                <AgentAvatar agent={agent} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {agent.name}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                      {formatXof(agent.monthlyBudgetXof, true)}/mois
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{agent.role}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {agent.office} ·{' '}
                    <span className={hasDeliverable ? 'text-[#0F5132] font-medium' : ''}>
                      {hasDeliverable ? 'Livrable produit' : 'En attente'}
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {/* Right: Direct Executive Consultation Panel */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl flex flex-col min-h-[560px]">
          {/* Selected agent profile bar */}
          <div className="p-5 border-b border-slate-200 flex items-start gap-4">
            <AgentAvatar agent={selectedAgent} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900">{selectedAgent.name}</h2>
              <p className="text-xs text-[#0F5132] font-medium">
                {selectedAgent.role} · {selectedAgent.office}
              </p>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {selectedAgent.shortBio}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Expertises : {selectedAgent.specialties.join(' · ')}
              </p>
            </div>
          </div>

          {/* Messages viewport */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[400px]">
            {messages.length === 0 ? (
              <div className="py-6 space-y-4">
                <p className="text-xs text-slate-500">
                  Démarrez un échange direct avec {selectedAgent.name} sur le projet actif (
                  {study.targetCountries.join(', ')}). Exemples de consignes :
                </p>
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS[selectedAgentId].map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(promptText)}
                      className="block w-full text-left px-3.5 py-2.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[11px] text-slate-400 mb-1">
                    {m.role === 'user' ? 'Vous (Direction)' : selectedAgent.name} · {m.timestamp}
                  </div>
                  <div
                    className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-[#0F5132] text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F5132]" />
                {selectedAgent.name} prépare sa réponse...
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Input composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 border-t border-slate-200 flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              placeholder={`Poser une question ou donner une consigne à ${selectedAgent.name}...`}
              className="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Envoyer
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
