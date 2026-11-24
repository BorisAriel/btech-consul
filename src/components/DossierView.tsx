import { Download, FileSpreadsheet, Play } from 'lucide-react';
import { AGENT_MAP, AGENT_PIPELINE_ORDER } from '../data/agents';
import { SECTOR_LABELS, UEMOA_COUNTRY_MAP } from '../data/uemoaCountries';
import type { MarketStudy, SimulationSummary } from '../types/uemoa';
import { formatMillionsXof, formatXof } from '../utils/simulatorMath';
import { AgentAvatar } from './AgentAvatar';

interface DossierViewProps {
  study: MarketStudy;
  simulation: SimulationSummary;
  onRunFullPipeline: () => void;
  pipelineRunning: boolean;
}

export function DossierView({
  study,
  simulation,
  onRunFullPipeline,
  pipelineRunning,
}: DossierViewProps) {
  const completedCount = Object.keys(study.deliverables).length;

  const downloadMarkdown = () => {
    const lines: string[] = [
      `# DOSSIER D'ÉTUDE DE MARCHÉ UEMOA — KORA ÉTUDES`,
      ``,
      `**Projet :** ${study.title}`,
      `**Client :** ${study.clientName}`,
      `**Secteur :** ${SECTOR_LABELS[study.sector]} (${study.businessModel})`,
      `**Pays UEMOA :** ${study.targetCountries
        .map((c) => UEMOA_COUNTRY_MAP[c]?.name || c)
        .join(', ')}`,
      `**Canal prioritaire :** ${study.primaryChannel}`,
      `**Date de mise à jour :** ${study.updatedAt}`,
      ``,
      `## Synthèse Quantitative & Rentabilité (FCFA · IS ${simulation.corporateTaxRatePct} %)`,
      `- TAM zone sélectionnée : ${formatMillionsXof(simulation.totalTamXofM)}`,
      `- SAM zone sélectionnée : ${formatMillionsXof(simulation.totalSamXofM)}`,
      `- SOM An 3 estimé : ${formatMillionsXof(simulation.totalSomYear3XofM)}`,
      `- CA projeté An 1 / An 2 / An 3 : ${formatMillionsXof(simulation.year1RevenueXofM)} / ${formatMillionsXof(simulation.year2RevenueXofM)} / ${formatMillionsXof(simulation.year3RevenueXofM)}`,
      `- Flux Nets de Trésorerie (FNT) cumulés 3 ans : ${formatXof(simulation.totalFntXof)}`,
      `- Valeur Actuelle Nette (VAN à ${simulation.discountRatePct} %) : ${formatXof(simulation.npvXof)}`,
      `- Durée de Récupération du Capital Investi (DRCI) : ${simulation.paybackLabel}`,
      `- Taux d'imposition (IS) : ${simulation.corporateTaxRatePct} %`,
      `- Total Bilan SYSCOHADA Fin An 1 : ${formatXof(simulation.balanceSheets[0]?.totalAssetsNetXof ?? 0)}`,
      `- Point mort mensuel : ${simulation.breakEvenMonth ? `Mois ${simulation.breakEvenMonth}` : 'Au-delà de 36 mois'}`,
      `- LTV / CAC : ${simulation.ltvCacRatio}x`,
      ``,
    ];

    AGENT_PIPELINE_ORDER.forEach((id) => {
      const agent = AGENT_MAP[id];
      const del = study.deliverables[id];
      if (!del) return;
      lines.push(`## 0${agent.executionOrder}. ${agent.deliverableTitle}`);
      lines.push(`*Responsable : ${agent.name} — ${agent.role} (${agent.office})*`);
      lines.push(``);
      if (del.verdict) {
        lines.push(`**Verdict Direction Générale : ${del.verdict}**`);
        lines.push(``);
      }
      lines.push(del.summary);
      lines.push(``);
      lines.push(`### Constats clés`);
      del.keyFindings.forEach((f) => lines.push(`- ${f}`));
      lines.push(``);
      lines.push(`### Recommandations`);
      del.recommendations.forEach((r) => lines.push(`- ${r}`));
      lines.push(``);
      lines.push(`### Risques & Parades`);
      del.risks.forEach((rk) =>
        lines.push(`- **${rk.title}** (${rk.severity}) : ${rk.mitigation}`)
      );
      lines.push(``);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KORA_Etude_${study.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFinancialCsv = () => {
    const header = [
      'Mois',
      'Clients actifs',
      'CA Mensuel (M FCFA)',
      'Charges Mensuelles (M FCFA)',
      'Cashflow Net (M FCFA)',
      'Trésorerie Cumulée (M FCFA)',
    ];
    const rows = simulation.monthlySeries.map((p) => [
      p.label,
      String(p.activeCustomers),
      p.revenueXofM.toFixed(2),
      p.costsXofM.toFixed(2),
      p.netCashflowXofM.toFixed(2),
      p.cumulativeCashXofM.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KORA_Previsionnel_36M_${study.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#0F5132] font-medium">
              Livrable consolidé KORA Études · {completedCount} / 6 chapitres validés
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 mt-1">{study.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {study.clientName} · {SECTOR_LABELS[study.sector]} · Honoraires mission{' '}
              <span className="font-mono tabular-nums">{formatXof(study.missionFeeXof)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={downloadFinancialCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exporter CSV 36 mois
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter le dossier (.md)
            </button>
          </div>
        </div>

        {/* Summary financial strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-5 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">VAN ({simulation.discountRatePct} %)</p>
            <p
              className={`text-base font-semibold font-mono tabular-nums mt-0.5 ${
                simulation.npvXof >= 0 ? 'text-[#0F5132]' : 'text-red-700'
              }`}
            >
              {formatXof(simulation.npvXof, true)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">DRCI</p>
            <p className="text-base font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {simulation.paybackLabel}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">FNT cumulés (3 ans)</p>
            <p className="text-base font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {formatXof(simulation.totalFntXof, true)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Bilan SYSCOHADA An 1</p>
            <p className="text-base font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {formatXof(simulation.balanceSheets[0]?.totalAssetsNetXof ?? 0, true)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Verdict DG (IS 33 %)</p>
            <p className="text-base font-semibold text-slate-900 mt-0.5">
              {study.deliverables.ceo?.verdict || 'En attente'}
            </p>
          </div>
        </div>
      </section>

      {completedCount === 0 ? (
        <section className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm font-medium text-slate-900">
            Le dossier éditorial est encore vide pour cette mission
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Lancez les 6 agents de KORA Études pour compiler automatiquement le rapport complet
            d’étude de marché UEMOA.
          </p>
          <button
            type="button"
            disabled={pipelineRunning}
            onClick={onRunFullPipeline}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Générer le dossier complet
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          {AGENT_PIPELINE_ORDER.map((id) => {
            const agent = AGENT_MAP[id];
            const del = study.deliverables[id];
            if (!del) return null;

            return (
              <article
                key={id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <AgentAvatar agent={agent} size="sm" />
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        0{agent.executionOrder}. {agent.deliverableTitle}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {agent.name} · {agent.role} · Validé le {del.generatedAt}
                      </p>
                    </div>
                  </div>
                  {del.verdict && (
                    <span className="text-xs font-semibold text-[#0F5132] whitespace-nowrap">
                      {del.verdict}
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-800 leading-relaxed">{del.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 mb-2">Constats clés</h3>
                    <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      {del.keyFindings.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 mb-2">
                      Recommandations prioritaires
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      {del.recommendations.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
