export type UemoaCountryCode =
  | 'CI'
  | 'SN'
  | 'BJ'
  | 'TG'
  | 'ML'
  | 'BF'
  | 'NE'
  | 'GW';

export type SectorId =
  | 'fintech'
  | 'agritech'
  | 'energy'
  | 'fmcg'
  | 'health'
  | 'logistics'
  | 'edtech'
  | 'real_estate';

export type BusinessModelType = 'B2C' | 'B2B' | 'B2B2C';

export type DistributionChannel =
  | 'Mobile Money & Digital'
  | 'Boutiques de quartier & Grossistes'
  | 'GMS, Pharmacies & Réseaux structurés'
  | 'Force de vente directe B2B';

export type AgentId =
  | 'data'
  | 'field'
  | 'marketing'
  | 'regulatory'
  | 'finance'
  | 'ceo';

export interface UemoaCountryProfile {
  code: UemoaCountryCode;
  name: string;
  capital: string;
  economicHub: string;
  populationM: number; // Millions
  urbanRatePct: number; // %
  gdpPerCapitaXof: number; // FCFA / an
  mobileMoneyPenetrationPct: number; // % adultes actifs
  internetPenetrationPct: number; // %
  vatRatePct: number; // TVA harmonisée UEMOA
  corridorProfile: string;
  marketMaturity: 'Leader régional' | 'Hub en croissance' | 'Marché émergent';
  sectorFit: Record<SectorId, number>; // 0.60 - 1.30 multiplier
}

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  department: string;
  office: string;
  avatarUrl: string;
  initials: string;
  executionOrder: number;
  monthlyBudgetXof: number;
  shortBio: string;
  deliverableTitle: string;
  specialties: string[];
}

export interface AgentDeliverableKpi {
  label: string;
  value: string;
  context: string;
}

export interface AgentDeliverableRisk {
  title: string;
  severity: 'Élevé' | 'Modéré' | 'Faible';
  mitigation: string;
}

export interface ActionItem90Days {
  phase: 'Jours 1-30' | 'Jours 31-60' | 'Jours 61-90';
  action: string;
  owner: string;
  deliverable: string;
}

export interface AgentDeliverable {
  agentId: AgentId;
  generatedAt: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  risks: AgentDeliverableRisk[];
  fieldProofs: string[]; // verbatims consommateurs ou preuves terrain
  kpis: AgentDeliverableKpi[];
  handoffNote: string;
  verdict?: 'GO' | 'GO SOUS CONDITIONS' | 'PIVOT RECOMMANDÉ';
  actionPlan90Days?: ActionItem90Days[];
}

export interface SimulationParams {
  unitPriceXof: number;
  grossMarginPct: number;
  monthlyMarketingBudgetXof: number;
  targetPenetrationPct: number; // % du SAM visé à l'An 3
  launchCapitalXof: number;
  cacXof: number;
  purchasesPerYear: number;
  discountRatePct?: number; // Taux d'actualisation (CMPC / WACC) en %
  corporateTaxRatePct?: number; // Taux d'imposition IS (33 % par défaut)
}

export interface MarketStudy {
  id: string;
  title: string;
  clientName: string;
  sector: SectorId;
  businessModel: BusinessModelType;
  targetCountries: UemoaCountryCode[];
  primaryChannel: DistributionChannel;
  valueProposition: string;
  targetSegment: string;
  createdAt: string;
  updatedAt: string;
  status: 'Brouillon' | 'En cours' | 'Finalisée';
  missionFeeXof: number; // Honoraires facturés par KORA Études
  simulation: SimulationParams;
  deliverables: Partial<Record<AgentId, AgentDeliverable>>;
}

export interface BoardroomTurn {
  agentId: AgentId;
  agentName: string;
  department: string;
  stance: 'Favorable' | 'Prudent' | 'Critique' | 'Arbitrage';
  argument: string;
  evidence: string;
}

export interface BoardroomDebate {
  id: string;
  studyId: string;
  topic: string;
  createdAt: string;
  turns: BoardroomTurn[];
  finalDecision: string;
  rationale: string;
  actionItems: {
    action: string;
    owner: string;
    deadline: string;
  }[];
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'agent';
  agentId: AgentId;
  content: string;
  timestamp: string;
}

export interface CountrySimulationRow {
  code: UemoaCountryCode;
  name: string;
  hub: string;
  populationM: number;
  urbanPopM: number;
  mobileMoneyPct: number;
  tamXofM: number; // Millions FCFA
  samXofM: number;
  somYear3XofM: number;
  addressableCustomers: number;
  attractivenessIndex: number; // 0 - 100
  selected: boolean;
}

export interface MonthlyProjectionPoint {
  month: number;
  label: string;
  revenueXofM: number;
  costsXofM: number;
  netCashflowXofM: number;
  cumulativeCashXofM: number;
  activeCustomers: number;
}

export interface AnnualCashflowRow {
  year: 1 | 2 | 3;
  label: string;
  revenueXof: number;
  operatingCostsXof: number;
  ebitdaXof: number; // EBE
  depreciationXof: number; // Dotations aux amortissements
  ebitXof: number; // Résultat avant impôt (RAI)
  corporateTaxXof: number; // Impôt sur les Sociétés (33 %)
  netIncomeXof: number; // Résultat net de l'exercice
  cafXof: number; // Capacité d'Autofinancement
  bfrXof: number; // Besoin en Fonds de Roulement
  deltaBfrXof: number; // Variation de BFR
  fntXof: number; // Flux Net de Trésorerie (FNT)
  discountedFntXof: number; // FNT actualisé
  cumulativeFntXof: number; // Cumul FNT après investissement initial (-I0)
  cumulativeDiscountedFntXof: number; // Cumul FNT actualisé (-I0)
}

export interface SyscohadaAssetLine {
  ref: string;
  label: string;
  grossXof: number;
  amortXof: number;
  netXof: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

export interface SyscohadaLiabilityLine {
  ref: string;
  label: string;
  netXof: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

export interface SyscohadaBalanceSheet {
  year: 1 | 2 | 3;
  fiscalLabel: string;
  assets: SyscohadaAssetLine[];
  liabilities: SyscohadaLiabilityLine[];
  totalAssetsNetXof: number;
  totalLiabilitiesNetXof: number;
  isBalanced: boolean;
  frngXof: number; // Fonds de Roulement Net Global
  bfrXof: number; // Besoin en Fonds de Roulement
  netTreasuryXof: number; // Trésorerie Nette (FRNG - BFR)
}

export interface SimulationSummary {
  totalTamXofM: number;
  totalSamXofM: number;
  totalSomYear3XofM: number;
  year1RevenueXofM: number;
  year2RevenueXofM: number;
  year3RevenueXofM: number;
  breakEvenMonth: number | null;
  ltvXof: number;
  ltvCacRatio: number;
  peakCashNeedXofM: number;
  corporateTaxRatePct: number; // 33 %
  discountRatePct: number;
  initialInvestmentXof: number;
  totalFntXof: number;
  npvXof: number; // Valeur Actuelle Nette (VAN)
  profitabilityIndex: number; // Indice de Profitabilité (IP)
  paybackYears: number | null; // DRCI simple (années)
  paybackLabel: string;
  discountedPaybackLabel: string;
  annualCashflows: AnnualCashflowRow[];
  balanceSheets: SyscohadaBalanceSheet[];
  countryBreakdown: CountrySimulationRow[];
  monthlySeries: MonthlyProjectionPoint[];
}
