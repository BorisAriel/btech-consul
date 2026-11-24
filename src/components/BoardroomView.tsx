import { useState } from 'react';
import { AlertCircle, Loader2, Play } from 'lucide-react';
import { AGENT_MAP } from '../data/agents';
import type { BoardroomDebate, MarketStudy, SimulationSummary } from '../types/uemoa';
import { AgentAvatar } from './AgentAvatar';

interface BoardroomViewProps {
  study: MarketStudy;
  simulation: SimulationSummary;
  debates: BoardroomDebate[];
  onAddDebate: (debate: BoardroomDebate) => void;
}

const PRESET_SCENARIOS = [
  'Un concurrent bien financé casse ses prix de 25 % à Abidjan et Dakar : faut-il baisser nos tarifs ou différencier par le service ?',
  'Faut-il lancer simultanément dans tous les pays sélectionnés ou concentrer 100 % du capital sur un seul pays pilote pendant 9 mois ?',
  'Les délais logistiques sur le corridor Abidjan–Ouagadougou s’allongent de 12 jours et les coûts de transport augmentent de 18 % : quel plan de riposte ?',
  'Comment structurer un partenariat de distribution B2B2C avec un opérateur Mobile Money sans perdre le contrôle de notre base clients ?',
];

export function BoardroomView({
  study,
  simulation,
  debates,
  onAddDebate,
}: BoardroomViewProps) {
  const [topic, setTopic] = useState(PRESET_SCENARIOS[0]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studyDebates = debates.filter((d) => d.studyId === study.id);
  const latestDebate = studyDebates[0] || null;

  const launchDebate = async (customTopic?: string) => {
    const promptTopic = (customTopic ?? topic).trim();
    if (!promptTopic || running) return;

    setRunning(true);
    setError(null);
    try {
      const response = await fetch('/api/boardroom/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: promptTopic,
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
      let data: { debate?: BoardroomDebate; error?: string } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (!response.ok || !data.debate) {
        throw new Error(
          data.error ||
            (response.status === 503
              ? 'Service momentanément saturé (503). Réessayez dans quelques secondes.'
              : 'Erreur lors de la simulation du Comité de Direction.')
        );
      }
      onAddDebate(data.debate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur inattendue.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <p className="text-xs text-[#0F5132] font-medium">
            Gouvernance multi-agents · Dossier {study.title}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">
            Comité de Direction & Scénarios de Choc UEMOA
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Soumettez un dilemme stratégique, une attaque concurrentielle ou une contrainte terrain.
            Les 6 directeurs confrontent leurs points de vue métier avant l’arbitrage final
            d’Aminata Diallo (DG).
          </p>
        </div>

        <div className="space-y-3">
          <label htmlFor="boardroom-topic" className="block text-xs font-medium text-slate-700">
            Ordre du jour ou scénario de crise à débattre
          </label>
          <textarea
            id="boardroom-topic"
            rows={2}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Décrivez le dilemme stratégique à soumettre aux 6 directeurs..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(preset)}
                  className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Scénario 0{idx + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={running || !topic.trim()}
              onClick={() => launchDebate()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {running ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Délibération en cours...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Convoquer le Comité de Direction
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {running && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
            <Loader2 className="w-4 h-4 animate-spin text-[#0F5132]" />
            Les 6 directions analysent le scénario et préparent leurs positions...
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </section>
      )}

      {!running && latestDebate ? (
        <div className="space-y-6">
          {/* Arbitration Summary */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <p className="text-xs text-[#0F5132] font-medium">
                  Arbitrage de la Direction Générale · {latestDebate.createdAt}
                </p>
                <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                  {latestDebate.topic}
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">{latestDebate.finalDecision}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{latestDebate.rationale}</p>
            </div>

            {latestDebate.actionItems.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 mb-2.5">
                  Décisions actées & responsables
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-4 font-medium">Action</th>
                        <th className="py-2 pr-4 font-medium">Directeur responsable</th>
                        <th className="py-2 font-medium text-right">Échéance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {latestDebate.actionItems.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-4">{item.action}</td>
                          <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                            {item.owner}
                          </td>
                          <td className="py-2.5 text-right font-mono whitespace-nowrap text-slate-600">
                            {item.deadline}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Transcript of all 6 executives */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Compte-rendu intégral des débats
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {latestDebate.turns.map((turn, idx) => {
                const agent = AGENT_MAP[turn.agentId];
                const stanceColor =
                  turn.stance === 'Favorable'
                    ? 'text-[#0F5132]'
                    : turn.stance === 'Critique'
                      ? 'text-red-700'
                      : turn.stance === 'Arbitrage'
                        ? 'text-slate-900'
                        : 'text-amber-700';

                return (
                  <div key={idx} className="p-5 flex items-start gap-4">
                    {agent && <AgentAvatar agent={agent} size="md" />}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm">
                          <span className="font-semibold text-slate-900">{turn.agentName}</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-xs text-slate-500">{turn.department}</span>
                        </div>
                        <span className={`text-xs font-medium ${stanceColor}`}>
                          Position : {turn.stance}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{turn.argument}</p>
                      <p className="text-xs text-slate-500">Appui terrain : {turn.evidence}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        !running && (
          <section className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              Aucun compte-rendu de Comité de Direction pour ce dossier
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Choisissez un scénario de choc ci-dessus ou rédigez votre propre question stratégique
              pour réunir les 6 directeurs de KORA Études.
            </p>
          </section>
        )
      )}
    </div>
  );
}
