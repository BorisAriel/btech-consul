import { UEMOA_COUNTRIES } from '../data/uemoaCountries';
import type {
  AnnualCashflowRow,
  CountrySimulationRow,
  MarketStudy,
  MonthlyProjectionPoint,
  SimulationSummary,
  SyscohadaAssetLine,
  SyscohadaBalanceSheet,
  SyscohadaLiabilityLine,
} from '../types/uemoa';

export const CORPORATE_TAX_RATE_PCT = 33;

export function formatXof(amount: number, compact = false): string {
  if (!Number.isFinite(amount)) return '0 FCFA';
  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1_000_000_000) {
      return `${sign}${(abs / 1_000_000_000).toFixed(2).replace('.', ',')} Md FCFA`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`;
    }
    if (abs >= 1_000) {
      return `${sign}${Math.round(abs / 1_000).toLocaleString('fr-FR')} k FCFA`;
    }
  }
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

export function formatMillionsXof(millions: number): string {
  if (!Number.isFinite(millions)) return '0 M FCFA';
  if (Math.abs(millions) >= 1000) {
    return `${(millions / 1000).toFixed(2).replace('.', ',')} Md FCFA`;
  }
  return `${millions.toFixed(1).replace('.', ',')} M FCFA`;
}

function formatDurationYears(years: number | null): string {
  if (years === null || !Number.isFinite(years)) {
    return '> 3 ans (non récupéré)';
  }
  const totalMonths = Math.max(1, Math.round(years * 12));
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m} mois`;
  if (m === 0) return `${y} an${y > 1 ? 's' : ''}`;
  return `${y} an${y > 1 ? 's' : ''} et ${m} mois`;
}

function computePaybackYears(
  initialInvestmentXof: number,
  annualFlows: number[]
): number | null {
  let cumulative = -initialInvestmentXof;
  if (cumulative >= 0) return 0;

  for (let i = 0; i < annualFlows.length; i++) {
    const prevCum = cumulative;
    const flow = annualFlows[i];
    cumulative += flow;
    if (cumulative >= 0 && flow > 0) {
      const fraction = Math.abs(prevCum) / flow;
      return Number((i + fraction).toFixed(2));
    }
  }
  return null;
}

export function computeMarketSimulation(study: MarketStudy): SimulationSummary {
  const { simulation, sector, businessModel, targetCountries } = study;
  const selectedSet = new Set(targetCountries);
  const corporateTaxRatePct = CORPORATE_TAX_RATE_PCT;
  const discountRatePct = simulation.discountRatePct ?? 12;

  const modelBaseRate =
    businessModel === 'B2C' ? 0.14 : businessModel === 'B2B2C' ? 0.055 : 0.012;

  const annualRevenuePerCustomer =
    simulation.unitPriceXof * Math.max(1, simulation.purchasesPerYear);

  const countryBreakdown: CountrySimulationRow[] = UEMOA_COUNTRIES.map((c) => {
    const urbanPopM = Number(((c.populationM * c.urbanRatePct) / 100).toFixed(2));
    const sectorFit = c.sectorFit[sector] ?? 1.0;

    const affordabilityRatio = Math.min(
      1.45,
      Math.max(0.45, c.gdpPerCapitaXof / 850000)
    );
    const priceFriction =
      simulation.unitPriceXof > 75000
        ? Math.max(0.45, 1 - (simulation.unitPriceXof - 75000) / 450000)
        : 1.0;

    const digitalBoost =
      study.primaryChannel === 'Mobile Money & Digital'
        ? 0.55 + (c.mobileMoneyPenetrationPct / 100) * 0.75
        : 0.78 + (c.urbanRatePct / 100) * 0.45;

    const adultPopulation = c.populationM * 1_000_000 * 0.56;
    const tamCustomers = Math.round(adultPopulation * modelBaseRate * sectorFit);
    const samCustomers = Math.round(
      tamCustomers *
        (c.urbanRatePct / 100 + 0.18) *
        Math.min(1.1, affordabilityRatio * priceFriction * digitalBoost)
    );
    const somYear3Customers = Math.round(
      samCustomers * (simulation.targetPenetrationPct / 100)
    );

    const tamXofM = Number(
      ((tamCustomers * annualRevenuePerCustomer) / 1_000_000).toFixed(1)
    );
    const samXofM = Number(
      ((samCustomers * annualRevenuePerCustomer) / 1_000_000).toFixed(1)
    );
    const somYear3XofM = Number(
      ((somYear3Customers * annualRevenuePerCustomer) / 1_000_000).toFixed(1)
    );

    const attractivenessRaw =
      (sectorFit / 1.32) * 34 +
      (c.mobileMoneyPenetrationPct / 85) * 24 +
      (c.urbanRatePct / 55) * 18 +
      Math.min(1, c.gdpPerCapitaXof / 1680000) * 24;

    return {
      code: c.code,
      name: c.name,
      hub: c.economicHub,
      populationM: c.populationM,
      urbanPopM,
      mobileMoneyPct: c.mobileMoneyPenetrationPct,
      tamXofM,
      samXofM,
      somYear3XofM,
      addressableCustomers: samCustomers,
      attractivenessIndex: Math.min(98, Math.max(38, Math.round(attractivenessRaw))),
      selected: selectedSet.has(c.code),
    };
  });

  const activeRows = countryBreakdown.filter((r) => r.selected);
  const rowsForTotals = activeRows.length > 0 ? activeRows : countryBreakdown.slice(0, 2);

  const totalTamXofM = Number(
    rowsForTotals.reduce((acc, r) => acc + r.tamXofM, 0).toFixed(1)
  );
  const totalSamXofM = Number(
    rowsForTotals.reduce((acc, r) => acc + r.samXofM, 0).toFixed(1)
  );
  const totalSomYear3XofM = Number(
    rowsForTotals.reduce((acc, r) => acc + r.somYear3XofM, 0).toFixed(1)
  );

  const targetMonthlyCustomersYear3 =
    totalSomYear3XofM > 0
      ? (totalSomYear3XofM * 1_000_000) / Math.max(1, annualRevenuePerCustomer)
      : 500;

  const countryCount = Math.max(1, rowsForTotals.length);
  const fixedMonthlyOpexXof = 2_400_000 + (countryCount - 1) * 1_150_000;

  let cumulativeCashXof = simulation.launchCapitalXof;
  let minCashXof = simulation.launchCapitalXof;
  let breakEvenMonth: number | null = null;
  let prevCustomers = 0;

  const monthlySeries: MonthlyProjectionPoint[] = [];
  const rawMonthlyRevs: number[] = [];
  const rawMonthlyCogs: number[] = [];
  const rawMonthlyOpex: number[] = [];
  const rawMonthlyTotalCosts: number[] = [];

  for (let m = 1; m <= 36; m++) {
    const progress = 1 / (1 + Math.exp(-0.19 * (m - 17)));
    const marketingLift = Math.min(
      1.35,
      Math.max(0.6, simulation.monthlyMarketingBudgetXof / 3_500_000)
    );
    const activeCustomers = Math.max(
      12,
      Math.round(targetMonthlyCustomersYear3 * progress * marketingLift)
    );
    const newCustomers = Math.max(0, activeCustomers - prevCustomers);
    prevCustomers = activeCustomers;

    const monthlyRevXof = Math.round((activeCustomers * annualRevenuePerCustomer) / 12);
    const cogsXof = Math.round(monthlyRevXof * (1 - simulation.grossMarginPct / 100));
    const acquisitionSpendXof = Math.round(
      Math.max(simulation.monthlyMarketingBudgetXof, newCustomers * simulation.cacXof * 0.45)
    );
    const opexAndAcqXof = fixedMonthlyOpexXof + acquisitionSpendXof;
    const totalCostsXof = cogsXof + opexAndAcqXof;
    const netCashflowXof = monthlyRevXof - totalCostsXof;

    rawMonthlyRevs.push(monthlyRevXof);
    rawMonthlyCogs.push(cogsXof);
    rawMonthlyOpex.push(opexAndAcqXof);
    rawMonthlyTotalCosts.push(totalCostsXof);

    cumulativeCashXof += netCashflowXof;
    if (cumulativeCashXof < minCashXof) {
      minCashXof = cumulativeCashXof;
    }
    if (breakEvenMonth === null && netCashflowXof > 0 && m >= 4) {
      breakEvenMonth = m;
    }

    monthlySeries.push({
      month: m,
      label: `M${m}`,
      revenueXofM: Number((monthlyRevXof / 1_000_000).toFixed(2)),
      costsXofM: Number((totalCostsXof / 1_000_000).toFixed(2)),
      netCashflowXofM: Number((netCashflowXof / 1_000_000).toFixed(2)),
      cumulativeCashXofM: Number((cumulativeCashXof / 1_000_000).toFixed(2)),
      activeCustomers,
    });
  }

  const sumSlice = (arr: number[], startIdx: number, endIdx: number) =>
    arr.slice(startIdx, endIdx).reduce((acc, v) => acc + v, 0);

  // =========================================================================
  // CORPORATE FINANCE (FNT, VAN, DRCI, IS 33 %) & BILAN COMPTABLE SYSCOHADA
  // =========================================================================
  const initialInvestmentXof = Math.round(simulation.launchCapitalXof);

  // Allocation of initial capital into SYSCOHADA Class 2 fixed assets (45%) & opening cash (55%)
  const totalCapexXof = Math.round(initialInvestmentXof * 0.45);
  const intangibleGrossXof = Math.round(totalCapexXof * 0.35); // Logiciels, plateforme, licences (3 ans)
  const tangibleGrossXof = Math.round(totalCapexXof * 0.55); // Matériel, équipements, agencements (5 ans)
  const financialAssetsGrossXof = totalCapexXof - intangibleGrossXof - tangibleGrossXof; // Dépôts & cautions (non amort.)

  const annualIntangibleDepXof = Math.round(intangibleGrossXof / 3);
  const annualTangibleDepXof = Math.round(tangibleGrossXof / 5);

  const stockDays =
    sector === 'fintech' || sector === 'edtech' ? 0 : sector === 'logistics' ? 10 : 28;
  const receivableDays = businessModel === 'B2B' ? 35 : 18;
  const payableDays = 30;

  const annualCashflows: AnnualCashflowRow[] = [];
  const balanceSheets: SyscohadaBalanceSheet[] = [];

  let prevBfrXof = 0;
  let runningTreasuryXof = initialInvestmentXof - totalCapexXof;
  let retainedEarningsXof = 0; // Report à nouveau (CJ)
  let cumIntangibleAmort = 0;
  let cumTangibleAmort = 0;
  let cumFntAfterI0 = -initialInvestmentXof;
  let cumDiscFntAfterI0 = -initialInvestmentXof;

  const years: (1 | 2 | 3)[] = [1, 2, 3];

  for (const year of years) {
    const startIdx = (year - 1) * 12;
    const endIdx = year * 12;

    const revenueXof = sumSlice(rawMonthlyRevs, startIdx, endIdx);
    const cogsXof = sumSlice(rawMonthlyCogs, startIdx, endIdx);
    const opexXof = sumSlice(rawMonthlyOpex, startIdx, endIdx);
    const operatingCostsXof = sumSlice(rawMonthlyTotalCosts, startIdx, endIdx);

    const ebitdaXof = revenueXof - operatingCostsXof;

    // Exact depreciation capped at gross value
    const depIntangible = Math.min(annualIntangibleDepXof, intangibleGrossXof - cumIntangibleAmort);
    const depTangible = Math.min(annualTangibleDepXof, tangibleGrossXof - cumTangibleAmort);
    const depreciationXof = depIntangible + depTangible;

    cumIntangibleAmort += depIntangible;
    cumTangibleAmort += depTangible;

    const ebitXof = ebitdaXof - depreciationXof;
    const corporateTaxXof =
      ebitXof > 0 ? Math.round(ebitXof * (corporateTaxRatePct / 100)) : 0;
    const netIncomeXof = ebitXof - corporateTaxXof;

    // CAF = Résultat Net + Dotations aux amortissements
    const cafXof = netIncomeXof + depreciationXof;

    // SYSCOHADA Working Capital items at fiscal year-end
    const stocksXof = Math.round((cogsXof * stockDays) / 365);
    const receivablesXof = Math.round((revenueXof * receivableDays) / 365);
    const supplierPayablesXof = Math.round((cogsXof * payableDays) / 365);
    const taxAndSocialPayablesXof = corporateTaxXof + Math.round(opexXof * 0.06);

    const bfrXof = stocksXof + receivablesXof - (supplierPayablesXof + taxAndSocialPayablesXof);
    const deltaBfrXof = bfrXof - prevBfrXof;
    prevBfrXof = bfrXof;

    // Flux Net de Trésorerie (FNT) = CAF - Variation BFR
    const fntXof = cafXof - deltaBfrXof;
    const discountFactor = Math.pow(1 + discountRatePct / 100, year);
    const discountedFntXof = Math.round(fntXof / discountFactor);

    cumFntAfterI0 += fntXof;
    cumDiscFntAfterI0 += discountedFntXof;

    annualCashflows.push({
      year,
      label: `Exercice An ${year}`,
      revenueXof,
      operatingCostsXof,
      ebitdaXof,
      depreciationXof,
      ebitXof,
      corporateTaxXof,
      netIncomeXof,
      cafXof,
      bfrXof,
      deltaBfrXof,
      fntXof,
      discountedFntXof,
      cumulativeFntXof: cumFntAfterI0,
      cumulativeDiscountedFntXof: cumDiscFntAfterI0,
    });

    // Update exact double-entry treasury balance
    runningTreasuryXof += fntXof;

    const treasuryAssetXof = Math.max(0, runningTreasuryXof);
    const treasuryLiabilityXof = Math.max(0, -runningTreasuryXof);

    const intangibleNetXof = intangibleGrossXof - cumIntangibleAmort;
    const tangibleNetXof = tangibleGrossXof - cumTangibleAmort;
    const totalFixedGrossXof = intangibleGrossXof + tangibleGrossXof + financialAssetsGrossXof;
    const totalFixedAmortXof = cumIntangibleAmort + cumTangibleAmort;
    const totalFixedNetXof = intangibleNetXof + tangibleNetXof + financialAssetsGrossXof;

    const totalCurrentAssetsXof = stocksXof + receivablesXof;
    const totalAssetsGrossXof = totalFixedGrossXof + totalCurrentAssetsXof + treasuryAssetXof;
    const totalAssetsNetXof = totalFixedNetXof + totalCurrentAssetsXof + treasuryAssetXof;

    const totalEquityXof = initialInvestmentXof + retainedEarningsXof + netIncomeXof;
    const totalCurrentLiabilitiesXof = supplierPayablesXof + taxAndSocialPayablesXof;
    const totalLiabilitiesNetXof =
      totalEquityXof + totalCurrentLiabilitiesXof + treasuryLiabilityXof;

    const assets: SyscohadaAssetLine[] = [
      {
        ref: 'AD',
        label: 'Immobilisations incorporelles (plateforme, licences)',
        grossXof: intangibleGrossXof,
        amortXof: cumIntangibleAmort,
        netXof: intangibleNetXof,
      },
      {
        ref: 'AI',
        label: 'Immobilisations corporelles (matériel, agencements)',
        grossXof: tangibleGrossXof,
        amortXof: cumTangibleAmort,
        netXof: tangibleNetXof,
      },
      {
        ref: 'AQ',
        label: 'Immobilisations financières (dépôts & cautions)',
        grossXof: financialAssetsGrossXof,
        amortXof: 0,
        netXof: financialAssetsGrossXof,
      },
      {
        ref: 'AZ',
        label: 'TOTAL ACTIF IMMOBILISÉ',
        grossXof: totalFixedGrossXof,
        amortXof: totalFixedAmortXof,
        netXof: totalFixedNetXof,
        isSubtotal: true,
      },
      {
        ref: 'BB',
        label: 'Stocks et en-cours',
        grossXof: stocksXof,
        amortXof: 0,
        netXof: stocksXof,
      },
      {
        ref: 'BG',
        label: 'Créances clients et comptes rattachés',
        grossXof: receivablesXof,
        amortXof: 0,
        netXof: receivablesXof,
      },
      {
        ref: 'BK',
        label: 'TOTAL ACTIF CIRCULANT',
        grossXof: totalCurrentAssetsXof,
        amortXof: 0,
        netXof: totalCurrentAssetsXof,
        isSubtotal: true,
      },
      {
        ref: 'BQ',
        label: 'Banques, caisse et comptes Mobile Money',
        grossXof: treasuryAssetXof,
        amortXof: 0,
        netXof: treasuryAssetXof,
      },
      {
        ref: 'BT',
        label: 'TOTAL TRÉSORERIE-ACTIF',
        grossXof: treasuryAssetXof,
        amortXof: 0,
        netXof: treasuryAssetXof,
        isSubtotal: true,
      },
      {
        ref: 'BZ',
        label: 'TOTAL GÉNÉRAL ACTIF',
        grossXof: totalAssetsGrossXof,
        amortXof: totalFixedAmortXof,
        netXof: totalAssetsNetXof,
        isTotal: true,
      },
    ];

    const liabilities: SyscohadaLiabilityLine[] = [
      {
        ref: 'CA',
        label: 'Capital social (apport initial investi)',
        netXof: initialInvestmentXof,
      },
      {
        ref: 'CJ',
        label: 'Report à nouveau (exercices antérieurs)',
        netXof: retainedEarningsXof,
      },
      {
        ref: 'CK',
        label: `Résultat net de l'exercice (après IS ${corporateTaxRatePct} %)`,
        netXof: netIncomeXof,
      },
      {
        ref: 'CP',
        label: 'TOTAL CAPITAUX PROPRES & RESSOURCES STABLES',
        netXof: totalEquityXof,
        isSubtotal: true,
      },
      {
        ref: 'DJ',
        label: 'Dettes fournisseurs et comptes rattachés',
        netXof: supplierPayablesXof,
      },
      {
        ref: 'DK',
        label: `Dettes fiscales et sociales (dont IS ${corporateTaxRatePct} %)`,
        netXof: taxAndSocialPayablesXof,
      },
      {
        ref: 'DP',
        label: 'TOTAL PASSIF CIRCULANT',
        netXof: totalCurrentLiabilitiesXof,
        isSubtotal: true,
      },
      {
        ref: 'DQ',
        label: 'Banques, concours et découverts de trésorerie',
        netXof: treasuryLiabilityXof,
      },
      {
        ref: 'DT',
        label: 'TOTAL TRÉSORERIE-PASSIF',
        netXof: treasuryLiabilityXof,
        isSubtotal: true,
      },
      {
        ref: 'DZ',
        label: 'TOTAL GÉNÉRAL PASSIF',
        netXof: totalLiabilitiesNetXof,
        isTotal: true,
      },
    ];

    const frngXof = totalEquityXof - totalFixedNetXof;
    const netTreasuryXof = treasuryAssetXof - treasuryLiabilityXof;

    balanceSheets.push({
      year,
      fiscalLabel: `Clôture Exercice An ${year} (31/12/N+${year})`,
      assets,
      liabilities,
      totalAssetsNetXof,
      totalLiabilitiesNetXof,
      isBalanced: Math.abs(totalAssetsNetXof - totalLiabilitiesNetXof) === 0,
      frngXof,
      bfrXof,
      netTreasuryXof,
    });

    // Roll net income into retained earnings for the next fiscal year
    retainedEarningsXof += netIncomeXof;
  }

  const totalFntXof = annualCashflows.reduce((acc, r) => acc + r.fntXof, 0);
  const totalDiscountedFntXof = annualCashflows.reduce(
    (acc, r) => acc + r.discountedFntXof,
    0
  );
  const npvXof = totalDiscountedFntXof - initialInvestmentXof;
  const profitabilityIndex =
    initialInvestmentXof > 0
      ? Number((totalDiscountedFntXof / initialInvestmentXof).toFixed(2))
      : 0;

  const paybackYears = computePaybackYears(
    initialInvestmentXof,
    annualCashflows.map((r) => r.fntXof)
  );
  const discountedPaybackYears = computePaybackYears(
    initialInvestmentXof,
    annualCashflows.map((r) => r.discountedFntXof)
  );

  const year1RevenueXofM = Number((annualCashflows[0].revenueXof / 1_000_000).toFixed(1));
  const year2RevenueXofM = Number((annualCashflows[1].revenueXof / 1_000_000).toFixed(1));
  const year3RevenueXofM = Number((annualCashflows[2].revenueXof / 1_000_000).toFixed(1));

  const ltvXof = Math.round(
    annualRevenuePerCustomer * (simulation.grossMarginPct / 100) * 2.2
  );
  const ltvCacRatio =
    simulation.cacXof > 0 ? Number((ltvXof / simulation.cacXof).toFixed(1)) : 0;

  const peakCashNeedXofM = Number(
    Math.max(0, (simulation.launchCapitalXof - minCashXof) / 1_000_000).toFixed(1)
  );

  return {
    totalTamXofM,
    totalSamXofM,
    totalSomYear3XofM,
    year1RevenueXofM,
    year2RevenueXofM,
    year3RevenueXofM,
    breakEvenMonth,
    ltvXof,
    ltvCacRatio,
    peakCashNeedXofM,
    corporateTaxRatePct,
    discountRatePct,
    initialInvestmentXof,
    totalFntXof,
    npvXof,
    profitabilityIndex,
    paybackYears,
    paybackLabel: formatDurationYears(paybackYears),
    discountedPaybackLabel: formatDurationYears(discountedPaybackYears),
    annualCashflows,
    balanceSheets,
    countryBreakdown,
    monthlySeries,
  };
}
