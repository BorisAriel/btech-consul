import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AGENT_MAP, AGENT_PIPELINE_ORDER, KORA_AGENTS } from '../data/agents';
import { SECTOR_LABELS, UEMOA_COUNTRIES } from '../data/uemoaCountries';
import type {
  AgentId,
  MarketStudy,
  SimulationParams,
  SimulationSummary,
  UemoaCountryCode,
} from '../types/uemoa';
import { formatMillionsXof, formatXof } from '../utils/simulatorMath';
import { AgentAvatar } from './AgentAvatar';

interface SimulatorViewProps {
  study: MarketStudy;
  simulation: SimulationSummary;
  runningAgentId: AgentId | null;
  pipelineRunning: boolean;
  pipelineError: string | null;
  onUpdateStudy: (updated: MarketStudy) => void;
  onRunFullPipeline: () => void;
  onRunSingleAgent: (agentId: AgentId) => void;
  onOpenFinance: () => void;
}

export function SimulatorView({
  study,
  simulation,
  runningAgentId,
  pipelineRunning,
  pipelineError,
  onUpdateStudy,
  onRunFullPipeline,
  onRunSingleAgent,
  onOpenFinance,
}: SimulatorViewProps) {
  const [selectedAgentTab, setSelectedAgentTab] = useState<AgentId>('data');

  const updateSim = (patch: Partial<SimulationParams>) => {
    onUpdateStudy({
      ...study,
      updatedAt: new Date().toISOString().slice(0, 10),
      simulation: {
        ...study.simulation,
        ...patch,
      },
    });
  };

  const toggleCountry = (code: UemoaCountryCode) => {
    const exists = study.targetCountries.includes(code);
    if (exists && study.targetCountries.length === 1) return;
    const next = exists
      ? study.targetCountries.filter((c) => c !== code)
      : [...study.targetCountries, code];
    onUpdateStudy({
      ...study,
      targetCountries: next,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  const selectedCountriesData = simulation.countryBreakdown.filter((c) => c.selected);
  const completedCount = Object.keys(study.deliverables).length;
  const activeAgentDeliverable = study.deliverables[selectedAgentTab];
  const activeAgent = AGENT_MAP[selectedAgentTab];

  return (
    <div className="space-y-8">
      {/* Header bar for active simulation */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">
              {SECTOR_LABELS[study.sector]} · {study.businessModel} · {study.primaryChannel}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 mt-1">{study.title}</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">{study.valueProposition}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={pipelineRunning || runningAgentId !== null}
              onClick={onRunFullPipeline}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {pipelineRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exécution en cours ({completedCount}/6)
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {completedCount === 6
                    ? 'Relancer les 6 agents'
                    : completedCount > 0
                      ? `Reprendre l’étude (${completedCount}/6)`
                      : 'Lancer l’étude multi-agents'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Country selector strip */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-medium text-slate-700">
              Périmètre géographique UEMOA ({study.targetCountries.length} pays actifs)
            </span>
            <span className="text-xs text-slate-500">
              Cliquez sur un pays pour recalculer immédiatement le TAM, SAM, SOM et le point mort
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {UEMOA_COUNTRIES.map((c) => {
              const active = study.targetCountries.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleCountry(c.code)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0F5132] text-white border-[#0F5132]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Error banner if API fails */}
      {pipelineError && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="font-medium">Interruption de l’agent</p>
              <p className="text-xs text-red-700 mt-0.5">{pipelineError}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={pipelineRunning || runningAgentId !== null}
            onClick={onRunFullPipeline}
            className="px-3.5 py-1.5 text-xs font-medium text-red-900 bg-white border border-red-300 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            Reprendre l’étude
          </button>
        </div>
      )}

      {/* Quantitative Sliders + Live KPI Strip */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Interactive Hypothesis Controls */}
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <SlidersHorizontal className="w-4 h-4 text-[#0F5132]" />
            <h2 className="text-sm font-semibold text-slate-900">
              Paramètres de simulation (FCFA)
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Prix unitaire moyen</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatXof(study.simulation.unitPriceXof)}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={200000}
                step={500}
                value={study.simulation.unitPriceXof}
                onChange={(e) => updateSim({ unitPriceXof: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Fréquence d’achat / an</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {study.simulation.purchasesPerYear}x / an
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                step={1}
                value={study.simulation.purchasesPerYear}
                onChange={(e) => updateSim({ purchasesPerYear: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Marge brute cible</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {study.simulation.grossMarginPct} %
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={85}
                step={1}
                value={study.simulation.grossMarginPct}
                onChange={(e) => updateSim({ grossMarginPct: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Part du SAM visée à l’An 3</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {study.simulation.targetPenetrationPct.toFixed(1).replace('.', ',')} %
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.1}
                value={study.simulation.targetPenetrationPct}
                onChange={(e) => updateSim({ targetPenetrationPct: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Budget marketing mensuel</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatXof(study.simulation.monthlyMarketingBudgetXof, true)}
                </span>
              </div>
              <input
                type="range"
                min={500000}
                max={15000000}
                step={250000}
                value={study.simulation.monthlyMarketingBudgetXof}
                onChange={(e) => updateSim({ monthlyMarketingBudgetXof: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Coût d’acquisition client (CAC)</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatXof(study.simulation.cacXof)}
                </span>
              </div>
              <input
                type="range"
                min={2000}
                max={200000}
                step={2000}
                value={study.simulation.cacXof}
                onChange={(e) => updateSim({ cacXof: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Capital de lancement (I₀)</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatXof(study.simulation.launchCapitalXof, true)}
                </span>
              </div>
              <input
                type="range"
                min={10000000}
                max={300000000}
                step={5000000}
                value={study.simulation.launchCapitalXof}
                onChange={(e) => updateSim({ launchCapitalXof: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Taux d’actualisation (CMPC)</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {simulation.discountRatePct} % · IS {simulation.corporateTaxRatePct} %
                </span>
              </div>
              <input
                type="range"
                min={6}
                max={24}
                step={0.5}
                value={simulation.discountRatePct}
                onChange={(e) => updateSim({ discountRatePct: Number(e.target.value) })}
                className="w-full accent-[#0F5132]"
              />
            </div>
          </div>
        </section>

        {/* Charts & Financial Readout */}
        <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-5 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Marché adressable (SAM)</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {formatMillionsXof(simulation.totalSamXofM)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">CA projeté An 3</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-[#0F5132] mt-0.5">
                {formatMillionsXof(simulation.year3RevenueXofM)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Valeur Actuelle Nette (VAN)</p>
              <p
                className={`text-lg font-semibold font-mono tabular-nums mt-0.5 ${
                  simulation.npvXof >= 0 ? 'text-[#0F5132]' : 'text-red-700'
                }`}
              >
                {formatXof(simulation.npvXof, true)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Récupération capital (DRCI)</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {simulation.paybackLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                FNT cumulés 3 ans :{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {formatXof(simulation.totalFntXof, true)}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>
                IS appliqué :{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {simulation.corporateTaxRatePct} %
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>
                LTV / CAC :{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {simulation.ltvCacRatio}x
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenFinance}
              className="font-medium text-[#0F5132] hover:underline whitespace-nowrap shrink-0"
            >
              Voir le Bilan SYSCOHADA & Tableau FNT
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 mb-3">
                Trajectoire CA mensuel vs Charges (M FCFA · 36 mois)
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={simulation.monthlySeries}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      interval={5}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(value) => [`${Number(value ?? 0).toFixed(1)} M FCFA`, '']}
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenueXofM"
                      name="Chiffre d'affaires"
                      stroke="#0F5132"
                      fill="#0F5132"
                      fillOpacity={0.14}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="costsXofM"
                      name="Charges totales"
                      stroke="#B45309"
                      fill="#B45309"
                      fillOpacity={0.07}
                      strokeWidth={1.75}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-800 mb-3">
                Potentiel SOM An 3 par pays sélectionné (M FCFA)
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedCountriesData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(value) => [`${Number(value ?? 0).toFixed(1)} M FCFA`, 'SOM An 3']}
                      labelFormatter={(code) =>
                        selectedCountriesData.find((c) => c.code === code)?.name || String(code)
                      }
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                      }}
                    />
                    <Bar dataKey="somYear3XofM" fill="#0F5132" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Multi-Agent Execution Chain & Deliverables Inspector */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Chaîne d’exécution des 6 agents de KORA Études
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspectez le livrable de chaque direction ou relancez un département après ajustement
              de vos hypothèses.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {completedCount} / 6 livrables prêts
          </span>
        </div>

        {/* Agent pipeline step selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-b border-slate-200 bg-slate-50/60">
          {AGENT_PIPELINE_ORDER.map((id) => {
            const agent = AGENT_MAP[id];
            const isSelected = selectedAgentTab === id;
            const isDone = Boolean(study.deliverables[id]);
            const isRunning = runningAgentId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedAgentTab(id)}
                className={`px-4 py-3.5 text-left border-b-2 transition-colors ${
                  isSelected
                    ? 'border-[#0F5132] bg-white'
                    : 'border-transparent hover:bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    0{agent.executionOrder}
                  </span>
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5132]" />
                  ) : (
                    <span className="text-[11px] text-slate-400">À faire</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1 truncate">{agent.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{agent.department}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Agent Deliverable Content */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <AgentAvatar agent={activeAgent} size="md" />
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {activeAgent.deliverableTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeAgent.name} · {activeAgent.role} · {activeAgent.office}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={pipelineRunning || runningAgentId !== null}
              onClick={() => onRunSingleAgent(activeAgent.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {runningAgentId === activeAgent.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Rédaction en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  {activeAgentDeliverable
                    ? 'Recalculer ce département'
                    : 'Exécuter ce département'}
                </>
              )}
            </button>
          </div>

          {runningAgentId === activeAgent.id ? (
            <div className="py-10 space-y-3">
              <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 pt-2">
                {activeAgent.name} analyse les données des pays sélectionnés ({study.targetCountries.join(', ')}) et rédige son livrable...
              </p>
            </div>
          ) : activeAgentDeliverable ? (
            <div className="pt-5 space-y-6">
              {/* Executive summary + optional CEO verdict */}
              <div className="space-y-2">
                {activeAgentDeliverable.verdict && (
                  <p className="text-xs font-semibold text-[#0F5132]">
                    Verdict Direction Générale : {activeAgentDeliverable.verdict}
                  </p>
                )}
                <p className="text-sm text-slate-800 leading-relaxed">
                  {activeAgentDeliverable.summary}
                </p>
              </div>

              {/* 3 KPIs */}
              {activeAgentDeliverable.kpis.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-slate-100">
                  {activeAgentDeliverable.kpis.map((kpi, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-slate-500">{kpi.label}</p>
                      <p className="text-base font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                        {kpi.value}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{kpi.context}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Findings & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2.5">
                    Constats clés UEMOA
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {activeAgentDeliverable.keyFindings.map((item, i) => (
                      <li key={i} className="leading-relaxed">
                        <span className="font-mono text-xs text-slate-400 mr-2">0{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2.5">
                    Recommandations opérationnelles
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {activeAgentDeliverable.recommendations.map((rec, i) => (
                      <li key={i} className="leading-relaxed">
                        <span className="font-mono text-xs text-[#0F5132] mr-2">0{i + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Risks & Field Proofs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2.5">
                    Risques identifiés & parades
                  </h4>
                  <div className="space-y-3">
                    {activeAgentDeliverable.risks.map((risk, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">{risk.title}</span>
                          <span
                            className={`text-xs font-medium shrink-0 ${
                              risk.severity === 'Élevé'
                                ? 'text-red-700'
                                : risk.severity === 'Modéré'
                                  ? 'text-amber-700'
                                  : 'text-slate-600'
                            }`}
                          >
                            Risque {risk.severity.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          Parade : {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2.5">
                    Preuves terrain & verbatims
                  </h4>
                  <div className="space-y-2.5">
                    {activeAgentDeliverable.fieldProofs.map((proof, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-lg p-3"
                      >
                        {proof}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* CEO 90-day plan if present */}
              {activeAgentDeliverable.actionPlan90Days &&
                activeAgentDeliverable.actionPlan90Days.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-900 mb-3">
                      Feuille de route 90 jours arbitrée
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 pr-4 font-medium">Horizon</th>
                            <th className="py-2 pr-4 font-medium">Action prioritaire</th>
                            <th className="py-2 pr-4 font-medium">Responsable</th>
                            <th className="py-2 font-medium">Livrable attendu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {activeAgentDeliverable.actionPlan90Days.map((step, i) => (
                            <tr key={i}>
                              <td className="py-2.5 pr-4 font-mono whitespace-nowrap text-slate-900">
                                {step.phase}
                              </td>
                              <td className="py-2.5 pr-4">{step.action}</td>
                              <td className="py-2.5 pr-4 whitespace-nowrap font-medium">
                                {step.owner}
                              </td>
                              <td className="py-2.5 text-slate-600">{step.deliverable}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Internal handoff memo */}
              {activeAgentDeliverable.handoffNote && (
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">
                    Note de transmission interne :{' '}
                  </span>
                  {activeAgentDeliverable.handoffNote}
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center max-w-md mx-auto space-y-3">
              <p className="text-sm font-medium text-slate-900">
                Ce département n’a pas encore produit son livrable
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Exécutez {activeAgent.name} individuellement ou lancez la chaîne complète des 6
                agents pour simuler le travail du cabinet sur ce projet.
              </p>
              <button
                type="button"
                disabled={pipelineRunning || runningAgentId !== null}
                onClick={() => onRunSingleAgent(activeAgent.id)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Lancer {activeAgent.name}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Full 8-country UEMOA comparative matrix */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Matrice comparative des 8 pays de l’UEMOA
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimations basées sur la démographie urbaine, la pénétration Mobile Money et
            l’adéquation sectorielle ({SECTOR_LABELS[study.sector]}).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                <th className="py-3 px-6">Pays & Hub</th>
                <th className="py-3 px-4 text-right">Population</th>
                <th className="py-3 px-4 text-right">Mobile Money</th>
                <th className="py-3 px-4 text-right">SAM estimé</th>
                <th className="py-3 px-4 text-right">SOM An 3</th>
                <th className="py-3 px-4 text-right">Attractivité</th>
                <th className="py-3 px-6 text-right">Périmètre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulation.countryBreakdown.map((row) => (
                <tr
                  key={row.code}
                  className={row.selected ? 'bg-[#0F5132]/[0.03]' : 'hover:bg-slate-50'}
                >
                  <td className="py-3 px-6">
                    <span className="font-medium text-slate-900">{row.name}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-500">{row.hub}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {row.populationM.toFixed(1).replace('.', ',')} M
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {row.mobileMoneyPct} %
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatMillionsXof(row.samXofM)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                    {formatMillionsXof(row.somYear3XofM)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {row.attractivenessIndex} / 100
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => toggleCountry(row.code)}
                      className={`text-xs font-medium whitespace-nowrap ${
                        row.selected
                          ? 'text-[#0F5132] hover:underline'
                          : 'text-slate-500 hover:text-slate-900 hover:underline'
                      }`}
                    >
                      {row.selected ? 'Inclus' : 'Ajouter'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
