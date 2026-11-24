import { useState } from 'react';
import { CheckCircle2, FileSpreadsheet } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MarketStudy, SimulationParams, SimulationSummary } from '../types/uemoa';
import { formatXof } from '../utils/simulatorMath';

interface FinanceSyscohadaViewProps {
  study: MarketStudy;
  simulation: SimulationSummary;
  onUpdateStudy: (updated: MarketStudy) => void;
}

export function FinanceSyscohadaView({
  study,
  simulation,
  onUpdateStudy,
}: FinanceSyscohadaViewProps) {
  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3>(1);

  const activeBalanceSheet =
    simulation.balanceSheets.find((b) => b.year === selectedYear) ||
    simulation.balanceSheets[0];

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

  const fntChartData = [
    {
      label: 'An 0 (Invest.)',
      fntM: Number((-simulation.initialInvestmentXof / 1_000_000).toFixed(2)),
      cumulM: Number((-simulation.initialInvestmentXof / 1_000_000).toFixed(2)),
    },
    ...simulation.annualCashflows.map((row) => ({
      label: `An ${row.year}`,
      fntM: Number((row.fntXof / 1_000_000).toFixed(2)),
      cumulM: Number((row.cumulativeFntXof / 1_000_000).toFixed(2)),
    })),
  ];

  const exportSyscohadaCsv = () => {
    const lines: string[] = [
      `BILAN COMPTABLE SYSCOHADA REVISE - ${activeBalanceSheet.fiscalLabel}`,
      `Projet;${study.title}`,
      `Taux IS;${simulation.corporateTaxRatePct}%`,
      `VAN (${simulation.discountRatePct}%);${simulation.npvXof}`,
      `DRCI;${simulation.paybackLabel}`,
      '',
      'ACTIF;Ref;Brut (FCFA);Amortissements (FCFA);Net (FCFA)',
      ...activeBalanceSheet.assets.map(
        (a) => `${a.label};${a.ref};${a.grossXof};${a.amortXof};${a.netXof}`
      ),
      '',
      'PASSIF;Ref;Net (FCFA)',
      ...activeBalanceSheet.liabilities.map((l) => `${l.label};${l.ref};${l.netXof}`),
      '',
      'FLUX NETS DE TRESORERIE (FCFA);An 1;An 2;An 3',
      `Chiffre d'affaires;${simulation.annualCashflows.map((r) => r.revenueXof).join(';')}`,
      `EBE;${simulation.annualCashflows.map((r) => r.ebitdaXof).join(';')}`,
      `Resultat avant impot;${simulation.annualCashflows.map((r) => r.ebitXof).join(';')}`,
      `Impot sur les Societes (33%);${simulation.annualCashflows.map((r) => r.corporateTaxXof).join(';')}`,
      `Resultat Net;${simulation.annualCashflows.map((r) => r.netIncomeXof).join(';')}`,
      `CAF;${simulation.annualCashflows.map((r) => r.cafXof).join(';')}`,
      `Variation BFR;${simulation.annualCashflows.map((r) => r.deltaBfrXof).join(';')}`,
      `Flux Net de Tresorerie (FNT);${simulation.annualCashflows.map((r) => r.fntXof).join(';')}`,
      `FNT Actualise;${simulation.annualCashflows.map((r) => r.discountedFntXof).join(';')}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KORA_Bilan_SYSCOHADA_An${selectedYear}_${study.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header & Financial Indicators Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#0F5132]">
              Direction Financière · Norme SYSCOHADA Révisé · Impôt sur les Sociétés (IS) :{' '}
              {simulation.corporateTaxRatePct} %
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 mt-1">
              Rentabilité (FNT, VAN, DRCI) & Bilan Comptable SYSCOHADA
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Évaluation financière du projet « {study.title} » avec fiscalité IS à 33 % et états
              de synthèse annuels en Francs CFA.
            </p>
          </div>
          <button
            type="button"
            onClick={exportSyscohadaCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exporter Bilan & FNT (.csv)
          </button>
        </div>

        {/* 4 Primary Corporate Finance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Valeur Actuelle Nette (VAN)</p>
            <p
              className={`text-xl font-semibold font-mono tabular-nums mt-1 ${
                simulation.npvXof >= 0 ? 'text-[#0F5132]' : 'text-red-700'
              }`}
            >
              {formatXof(simulation.npvXof, true)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Actualisée à {simulation.discountRatePct} % · IP :{' '}
              <span className="font-mono tabular-nums">{simulation.profitabilityIndex}</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Durée de Récupération (DRCI)</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
              {simulation.paybackLabel}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              DRCI actualisé : {simulation.discountedPaybackLabel}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Flux Nets de Trésorerie (FNT 3 ans)</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
              {formatXof(simulation.totalFntXof, true)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Capital investi (I₀) : {formatXof(simulation.initialInvestmentXof, true)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Taux d’imposition (IS) & Fiscalité</p>
            <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
              {simulation.corporateTaxRatePct} %
            </p>
            <p className="text-xs text-slate-500 mt-1">
              IS cumulé 3 ans :{' '}
              <span className="font-mono tabular-nums">
                {formatXof(
                  simulation.annualCashflows.reduce((a, r) => a + r.corporateTaxXof, 0),
                  true
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Discount rate (WACC) interactive calibration */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">
                Taux d’actualisation (CMPC / Coût du capital UEMOA)
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {simulation.discountRatePct} %
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
          <p className="text-xs text-slate-500 leading-relaxed">
            La VAN actualise les Flux Nets de Trésorerie après Impôt sur les Sociétés (33 %) et
            variation du BFR. Un projet est financièrement créateur de valeur lorsque la VAN est
            strictement positive et l’Indice de Profitabilité supérieur à 1.
          </p>
        </div>
      </section>

      {/* FNT Table & Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Tableau des Flux Nets de Trésorerie (FNT) & Calcul de la VAN
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Montants exprimés en Francs CFA · Impôt sur les Sociétés (IS) appliqué au taux de 33 %
              sur le résultat bénéficiaire.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-3 px-5">Rubriques (FCFA)</th>
                  <th className="py-3 px-4 text-right">An 0 (T₀)</th>
                  <th className="py-3 px-4 text-right">Exercice An 1</th>
                  <th className="py-3 px-4 text-right">Exercice An 2</th>
                  <th className="py-3 px-5 text-right">Exercice An 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">Chiffre d’affaires (CA)</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                      {Math.round(r.revenueXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">Charges d’exploitation décaissables</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      -{Math.round(r.operatingCostsXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50 font-medium">
                  <td className="py-2.5 px-5 text-slate-900">Excédent Brut d’Exploitation (EBE)</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {Math.round(r.ebitdaXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">Dotations aux amortissements</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      -{Math.round(r.depreciationXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">Résultat avant impôt (RAI)</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                      {Math.round(r.ebitXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700 font-medium">
                    Impôt sur les Sociétés (IS · 33 %)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-800">
                      {r.corporateTaxXof > 0
                        ? `-${Math.round(r.corporateTaxXof).toLocaleString('fr-FR')}`
                        : '0'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50 font-medium">
                  <td className="py-2.5 px-5 text-slate-900">Résultat net de l’exercice</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td
                      key={r.year}
                      className={`py-2.5 px-4 text-right font-mono tabular-nums ${
                        r.netIncomeXof >= 0 ? 'text-[#0F5132]' : 'text-red-700'
                      }`}
                    >
                      {Math.round(r.netIncomeXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">
                    Capacité d’Autofinancement (CAF = RN + Amort.)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                      {Math.round(r.cafXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">Variation du BFR (− ΔBFR)</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">—</td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {Math.round(-r.deltaBfrXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#0F5132]/[0.05] font-semibold">
                  <td className="py-3 px-5 text-slate-900">Flux Net de Trésorerie (FNT)</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-red-700">
                    -{Math.round(simulation.initialInvestmentXof).toLocaleString('fr-FR')}
                  </td>
                  {simulation.annualCashflows.map((r) => (
                    <td
                      key={r.year}
                      className={`py-3 px-4 text-right font-mono tabular-nums ${
                        r.fntXof >= 0 ? 'text-[#0F5132]' : 'text-red-700'
                      }`}
                    >
                      {Math.round(r.fntXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">
                    FNT actualisé ({simulation.discountRatePct} %)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-red-700">
                    -{Math.round(simulation.initialInvestmentXof).toLocaleString('fr-FR')}
                  </td>
                  {simulation.annualCashflows.map((r) => (
                    <td key={r.year} className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                      {Math.round(r.discountedFntXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-5 text-slate-700">
                    Cumul FNT (suivi récupération capital)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-red-700">
                    -{Math.round(simulation.initialInvestmentXof).toLocaleString('fr-FR')}
                  </td>
                  {simulation.annualCashflows.map((r) => (
                    <td
                      key={r.year}
                      className={`py-2.5 px-4 text-right font-mono tabular-nums font-medium ${
                        r.cumulativeFntXof >= 0 ? 'text-[#0F5132]' : 'text-slate-700'
                      }`}
                    >
                      {Math.round(r.cumulativeFntXof).toLocaleString('fr-FR')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Chart: Annual FNT & Cumulative Payback */}
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Profil FNT & Récupération du capital
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Flux annuels (barres) et cumul (ligne) en millions FCFA. Le croisement de zéro marque
              la DRCI.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={fntChartData}
                margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <ReferenceLine y={0} stroke="#64748B" strokeWidth={1} />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0).toFixed(1)} M FCFA`, '']}
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Bar dataKey="fntM" name="FNT annuel" fill="#0F5132" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="cumulM"
                  name="Cumul FNT"
                  stroke="#B45309"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">DRCI (délai simple)</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {simulation.paybackLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">DRCI actualisé ({simulation.discountRatePct} %)</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {simulation.discountedPaybackLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Indice de Profitabilité (IP)</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {simulation.profitabilityIndex}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Bilan Comptable SYSCOHADA Révisé */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Bilan Comptable Prévisionnel — Norme SYSCOHADA Révisé
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeBalanceSheet.fiscalLabel} · Monnaie légale : Franc CFA (XOF) · IS calculé à 33 %
            </p>
          </div>

          {/* Interactive Exercise Year Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            {([1, 2, 3] as const).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedYear === y
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exercice An {y}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column SYSCOHADA Actif / Passif Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ACTIF */}
          <div className="overflow-x-auto">
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-800">
              ACTIF (Emplois en FCFA)
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-4 w-12">Réf.</th>
                  <th className="py-2.5 px-2">Postes de l’Actif</th>
                  <th className="py-2.5 px-3 text-right">Brut</th>
                  <th className="py-2.5 px-3 text-right">Amort.</th>
                  <th className="py-2.5 px-4 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBalanceSheet.assets.map((line) => (
                  <tr
                    key={line.ref}
                    className={
                      line.isTotal
                        ? 'bg-[#0F5132]/[0.06] font-semibold text-slate-900'
                        : line.isSubtotal
                          ? 'bg-slate-50/70 font-medium text-slate-900'
                          : 'text-slate-700'
                    }
                  >
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{line.ref}</td>
                    <td className="py-2.5 px-2">{line.label}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {Math.round(line.grossXof).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                      {line.amortXof > 0
                        ? `-${Math.round(line.amortXof).toLocaleString('fr-FR')}`
                        : '0'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {Math.round(line.netXof).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PASSIF */}
          <div className="overflow-x-auto">
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-800">
              PASSIF (Ressources en FCFA)
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-4 w-12">Réf.</th>
                  <th className="py-2.5 px-2">Postes du Passif</th>
                  <th className="py-2.5 px-4 text-right">Net (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBalanceSheet.liabilities.map((line) => (
                  <tr
                    key={line.ref}
                    className={
                      line.isTotal
                        ? 'bg-[#0F5132]/[0.06] font-semibold text-slate-900'
                        : line.isSubtotal
                          ? 'bg-slate-50/70 font-medium text-slate-900'
                          : 'text-slate-700'
                    }
                  >
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{line.ref}</td>
                    <td className="py-2.5 px-2">{line.label}</td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono tabular-nums ${
                        line.ref === 'CK' && line.netXof < 0 ? 'text-red-700' : ''
                      }`}
                    >
                      {Math.round(line.netXof).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SYSCOHADA Financial Structure Equilibrium Footer (FRNG / BFR / TN) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-500">Fonds de Roulement (FRNG)</p>
            <p className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
              {formatXof(activeBalanceSheet.frngXof)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Besoin en Fonds de Roulement (BFR)</p>
            <p className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
              {formatXof(activeBalanceSheet.bfrXof)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Trésorerie Nette (FRNG − BFR)</p>
            <p
              className={`font-mono tabular-nums font-semibold mt-0.5 ${
                activeBalanceSheet.netTreasuryXof >= 0 ? 'text-[#0F5132]' : 'text-red-700'
              }`}
            >
              {formatXof(activeBalanceSheet.netTreasuryXof)}
            </p>
          </div>
          <div className="flex items-center sm:justify-end gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" />
            <span className="font-medium text-[#0F5132]">
              {activeBalanceSheet.isBalanced
                ? 'Équilibre vérifié : ACTIF = PASSIF'
                : 'Écart détecté'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
