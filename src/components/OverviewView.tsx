import { ArrowRight, Play, Plus, Trash2 } from 'lucide-react';
import { KORA_AGENTS } from '../data/agents';
import { SECTOR_LABELS, UEMOA_COUNTRY_MAP } from '../data/uemoaCountries';
import type { AgentId, MarketStudy, SimulationSummary } from '../types/uemoa';
import { formatMillionsXof, formatXof } from '../utils/simulatorMath';
import { AgentAvatar } from './AgentAvatar';

interface OverviewViewProps {
  studies: MarketStudy[];
  activeStudy: MarketStudy;
  simulation: SimulationSummary;
  runningAgentId: AgentId | null;
  onSelectStudy: (studyId: string) => void;
  onDeleteStudy: (studyId: string) => void;
  onOpenNewStudy: () => void;
  onNavigate: (tab: 'simulator' | 'finance' | 'agents' | 'boardroom' | 'dossier') => void;
  onRunFullPipeline: () => void;
}

export function OverviewView({
  studies,
  activeStudy,
  simulation,
  runningAgentId,
  onSelectStudy,
  onDeleteStudy,
  onOpenNewStudy,
  onNavigate,
  onRunFullPipeline,
}: OverviewViewProps) {
  const totalFeePortfolio = studies.reduce((acc, s) => acc + s.missionFeeXof, 0);
  const monthlyPayrollXof = KORA_AGENTS.reduce((acc, a) => acc + a.monthlyBudgetXof, 0);
  const completedDeliverablesCount = Object.keys(activeStudy.deliverables).length;
  const totalDeliverablesProduced = studies.reduce(
    (acc, s) => acc + Object.keys(s.deliverables).length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Executive hero header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-[#0F5132] mb-2">
              Cabinet autonome d’études de marché · Zone UEMOA (8 pays · Franc CFA)
            </p>
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">
              Pilotez KORA Études comme un cabinet conseil réel
            </h1>
            <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
              Six directeurs métiers basés à Dakar, Abidjan, Bamako et Cotonou collaborent sur vos
              projets : dimensionnement TAM/SAM/SOM, panels consommateurs, mix marketing 4P, audit
              OHADA/BCEAO, rentabilité 36 mois et arbitrage de direction générale.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenNewStudy}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nouvelle mission
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('simulator');
                if (completedDeliverablesCount < 6 && !runningAgentId) {
                  onRunFullPipeline();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4" />
              Ouvrir le simulateur actif
            </button>
          </div>
        </div>

        {/* 4-column company KPI strip below hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-6 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Carnet d’honoraires cabinet</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
              {formatXof(totalFeePortfolio, true)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {studies.length} mission{studies.length > 1 ? 's' : ''} en portefeuille
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Masse opérationnelle mensuelle</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
              {formatXof(monthlyPayrollXof, true)}
            </p>
            <p className="text-xs text-slate-500 mt-1">6 directions · 4 bureaux UEMOA</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">SOM An 3 (mission active)</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-[#0F5132] mt-1">
              {formatMillionsXof(simulation.totalSomYear3XofM)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeStudy.targetCountries.length} pays UEMOA sélectionnés
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Livrables produits</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
              {completedDeliverablesCount} / 6
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {totalDeliverablesProduced} livrables cumulés au cabinet
            </p>
          </div>
        </div>
      </section>

      {/* Main 2-column grid: Missions portfolio + Active boardroom summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Missions Table */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Portefeuille des études clients
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez un dossier pour inspecter ou simuler son déploiement UEMOA.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewStudy}
              className="text-xs font-medium text-[#0F5132] hover:underline whitespace-nowrap shrink-0"
            >
              + Ajouter un dossier
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500 font-medium">
                  <th className="py-3 px-6">Mission & Secteur</th>
                  <th className="py-3 px-4">Pays UEMOA</th>
                  <th className="py-3 px-4 text-right">Honoraires</th>
                  <th className="py-3 px-4">Avancement</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {studies.map((s) => {
                  const isSelected = s.id === activeStudy.id;
                  const doneCount = Object.keys(s.deliverables).length;
                  const verdict = s.deliverables.ceo?.verdict;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectStudy(s.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#0F5132]/[0.04]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-900">
                          {s.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {SECTOR_LABELS[s.sector]} · {s.businessModel}
                          {isSelected ? ' · Dossier actif' : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                        {s.targetCountries.join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-800">
                        {formatXof(s.missionFeeXof, true)}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className={
                            doneCount === 6
                              ? 'text-[#0F5132] font-medium'
                              : doneCount > 0
                                ? 'text-amber-700 font-medium'
                                : 'text-slate-500'
                          }
                        >
                          {doneCount}/6 départements
                        </span>
                        {verdict && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{verdict}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudy(s.id);
                              onNavigate('simulator');
                            }}
                            className="text-xs font-medium text-[#0F5132] hover:underline whitespace-nowrap"
                          >
                            Simuler
                          </button>
                          {studies.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteStudy(s.id);
                              }}
                              aria-label={`Supprimer ${s.title}`}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Active study executive snapshot */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Dossier sélectionné</p>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                {activeStudy.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeStudy.clientName} ·{' '}
                {activeStudy.targetCountries
                  .map((c) => UEMOA_COUNTRY_MAP[c]?.name || c)
                  .join(', ')}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {activeStudy.valueProposition}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">VAN ({simulation.discountRatePct} %)</p>
              <p
                className={`text-sm font-semibold font-mono tabular-nums mt-0.5 ${
                  simulation.npvXof >= 0 ? 'text-[#0F5132]' : 'text-red-700'
                }`}
              >
                {formatXof(simulation.npvXof, true)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">DRCI</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {simulation.paybackLabel}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">IS appliqué</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {simulation.corporateTaxRatePct} %
              </p>
            </div>
          </div>

          {activeStudy.deliverables.ceo ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Verdict Direction Générale</span>
                <span className="font-semibold text-[#0F5132]">
                  {activeStudy.deliverables.ceo.verdict}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeStudy.deliverables.ceo.summary}
              </p>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-600">
                Ce dossier n’a pas encore été analysé par les 6 agents. Lancez le moteur
                d’étude pour générer les livrables de chaque direction.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F5132] hover:underline whitespace-nowrap"
            >
              Bilan SYSCOHADA & VAN
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() => onNavigate('dossier')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline whitespace-nowrap"
            >
              Dossier complet
            </button>
          </div>
        </section>
      </div>

      {/* The 6 Autonomous Departments Strip */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Les 6 directions opérationnelles de KORA Études
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chaque agent exécute sa mission en chaîne et transmet ses conclusions au département
              suivant.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('agents')}
            className="text-xs font-medium text-[#0F5132] hover:underline whitespace-nowrap shrink-0"
          >
            Consulter les agents en direct
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:gap-px bg-slate-200">
          {KORA_AGENTS.map((agent) => {
            const hasDeliverable = Boolean(activeStudy.deliverables[agent.id]);
            const isRunning = runningAgentId === agent.id;
            return (
              <div
                key={agent.id}
                className="bg-white p-5 flex items-start gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <AgentAvatar agent={agent} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{agent.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      0{agent.executionOrder}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{agent.department}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {agent.office} ·{' '}
                    <span
                      className={
                        isRunning
                          ? 'text-amber-700 font-medium'
                          : hasDeliverable
                            ? 'text-[#0F5132] font-medium'
                            : 'text-slate-500'
                      }
                    >
                      {isRunning
                        ? 'Analyse en cours'
                        : hasDeliverable
                          ? 'Livrable validé'
                          : 'En attente de brief'}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
