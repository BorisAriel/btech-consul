import type { AgentId, AgentProfile } from '../types/uemoa';

export const KORA_AGENTS: AgentProfile[] = [
  {
    id: 'data',
    name: 'Kouassi Yao',
    role: 'Directeur des Études & Data UEMOA',
    department: 'Études & Intelligence Marché',
    office: 'Bureau Abidjan',
    avatarUrl: '/src/assets/images/agent_kouassi_yao_1795548039651.jpg',
    initials: 'KY',
    executionOrder: 1,
    monthlyBudgetXof: 2450000,
    shortBio:
      'Dimensionne les marchés (TAM/SAM/SOM), croise les séries BCEAO/INS et hiérarchise les pays prioritaires de déploiement.',
    deliverableTitle: 'Dimensionnement & Cartographie UEMOA',
    specialties: ['TAM/SAM/SOM', 'Pouvoir d’achat XOF', 'Scoring pays UEMOA'],
  },
  {
    id: 'field',
    name: 'Mariama Sow',
    role: 'Cheffe Terrain & Insights Consommateurs',
    department: 'Terrain & Panels Qualitatifs',
    office: 'Bureau Dakar',
    avatarUrl: '/src/assets/images/agent_mariama_sow_1795548040149.jpg',
    initials: 'MS',
    executionOrder: 2,
    monthlyBudgetXof: 1950000,
    shortBio:
      'Pilote les focus groups urbains et périurbains, analyse les arbitrages quotidiens des ménages et les freins d’adoption culturelle.',
    deliverableTitle: 'Synthèse Panels & Insights Terrain',
    specialties: ['Focus groups urbains', 'Usages Mobile Money', 'Freins d’adoption'],
  },
  {
    id: 'marketing',
    name: 'Awa Traoré',
    role: 'Directrice Marketing & Positionnement',
    department: 'Stratégie Marketing & Go-to-Market',
    office: 'Bureau Abidjan / Bamako',
    avatarUrl: '/src/assets/images/agent_awa_traore_1795548039768.jpg',
    initials: 'AT',
    executionOrder: 3,
    monthlyBudgetXof: 2300000,
    shortBio:
      'Conçoit le mix marketing 4P, la politique prix en FCFA, l’architecture de distribution (boutiques, GMS, WhatsApp) et le plan de lancement.',
    deliverableTitle: 'Stratégie Marketing 4P & Go-to-Market',
    specialties: ['Pricing psychologique FCFA', 'Distribution hybride', 'Acquisition locale'],
  },
  {
    id: 'regulatory',
    name: 'Sébastien Mensah',
    role: 'Directeur Réglementaire, OHADA & Risques',
    department: 'Conformité, Fiscalité & Risques Pays',
    office: 'Bureau Cotonou / Lomé',
    avatarUrl: '/src/assets/images/agent_sebastien_mensah_1795548039832.jpg',
    initials: 'SM',
    executionOrder: 4,
    monthlyBudgetXof: 2150000,
    shortBio:
      'Sécurise la structuration OHADA, la conformité BCEAO/TVA/douanes TEC, les agréments sectoriels et les risques logistiques de corridors.',
    deliverableTitle: 'Audit Réglementaire OHADA & Risques',
    specialties: ['Droit OHADA', 'Agrément BCEAO', 'Douanes & Corridors'],
  },
  {
    id: 'finance',
    name: 'Ibrahima Koné',
    role: 'Directeur Financier & Commercial (DAF)',
    department: 'Finance, Pricing & Rentabilité',
    office: 'Bureau Abidjan',
    avatarUrl: '/src/assets/images/agent_ibrahima_kone_1795548039600.jpg',
    initials: 'IK',
    executionOrder: 5,
    monthlyBudgetXof: 2550000,
    shortBio:
      'Modélise la rentabilité sur 36 mois en FCFA, les ratios LTV/CAC, le besoin en fonds de roulement (BFR) et la structure tarifaire.',
    deliverableTitle: 'Modèle Financier 36 Mois & Rentabilité',
    specialties: ['P&L en FCFA', 'Point mort & BFR', 'Unit Economics'],
  },
  {
    id: 'ceo',
    name: 'Aminata Diallo',
    role: 'Directrice Générale (DG) & Associée',
    department: 'Direction Générale & Arbitrage',
    office: 'Siège Dakar',
    avatarUrl: '/src/assets/images/agent_aminata_diallo_1795548041319.jpg',
    initials: 'AD',
    executionOrder: 6,
    monthlyBudgetXof: 3100000,
    shortBio:
      'Arbitre les recommandations inter-départements, rend le verdict final Go / No-Go et structure la feuille de route d’exécution à 90 jours.',
    deliverableTitle: 'Note de Direction & Feuille de Route 90j',
    specialties: ['Arbitrage stratégique', 'Go / No-Go', 'Gouvernance UEMOA'],
  },
];

export const AGENT_MAP: Record<AgentId, AgentProfile> = Object.fromEntries(
  KORA_AGENTS.map((a) => [a.id, a])
) as Record<AgentId, AgentProfile>;

export const AGENT_PIPELINE_ORDER: AgentId[] = [
  'data',
  'field',
  'marketing',
  'regulatory',
  'finance',
  'ceo',
];
