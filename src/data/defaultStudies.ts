import type { MarketStudy } from '../types/uemoa';

export const INITIAL_STUDIES: MarketStudy[] = [
  {
    id: 'study-kobapay-uemoa',
    title: 'KobaPay — Encaissement & Crédit Stock Micro-Marchands',
    clientName: 'Koba Financial Technologies (Abidjan)',
    sector: 'fintech',
    businessModel: 'B2B2C',
    targetCountries: ['CI', 'SN', 'BJ'],
    primaryChannel: 'Mobile Money & Digital',
    valueProposition:
      'Agrégateur de paiement QR interopérable (Wave, Orange Money, MTN MoMo) couplé à une avance de trésorerie instantanée pour réapprovisionner les boutiques de quartier.',
    targetSegment:
      'Gérants de supérettes, dépôts de boissons, pharmacies et boutiques de quartier réalisant entre 1,5 M et 15 M FCFA de chiffre d’affaires mensuel.',
    createdAt: '2026-11-10',
    updatedAt: '2026-11-22',
    status: 'Finalisée',
    missionFeeXof: 14500000,
    simulation: {
      unitPriceXof: 18500,
      grossMarginPct: 68,
      monthlyMarketingBudgetXof: 4200000,
      targetPenetrationPct: 3.2,
      launchCapitalXof: 85000000,
      cacXof: 28000,
      purchasesPerYear: 12,
      discountRatePct: 12,
      corporateTaxRatePct: 33,
    },
    deliverables: {
      data: {
        agentId: 'data',
        generatedAt: '2026-11-22',
        summary:
          'Le corridor Abidjan–Dakar–Cotonou concentre plus de 64 % du volume marchand digitalisé de l’UEMOA. La forte adoption du Mobile Money (74 % en Côte d’Ivoire, 81 % au Sénégal) crée un terreau immédiat pour la réconciliation de caisse et le micro-crédit stock.',
        keyFindings: [
          'Côte d’Ivoire et Sénégal représentent à eux seuls 79 % du SAM adressable à court terme grâce à la densité des boutiques urbaines.',
          'Au Sénégal, la compression des frais marchands imposée par Wave oblige à monétiser par le crédit stock et les services de gestion plutôt que par la seule commission de transaction.',
          'Cotonou offre un coût d’acquisition terrain inférieur de 28 % à Abidjan avec une adoption rapide chez les grossistes import-export.',
        ],
        recommendations: [
          'Séquencer le lancement : Phase 1 Abidjan (Marcory, Yopougon, Cocody) et Dakar (Sandaga, Pikine), puis Cotonou au trimestre 3.',
          'Cibler prioritairement les points de vente à rotation stock hebdomadaire (boissons, riz, huile, cosmétiques).',
          'Suivre le volume mensuel encaissé (GMV) par boutique comme indicateur avancé d’éligibilité au crédit stock.',
        ],
        risks: [
          {
            title: 'Guerre tarifaire sur les commissions marchandes',
            severity: 'Élevé',
            mitigation:
              'Maintenir le QR d’encaissement à 0,5 % maximum et générer 70 % de la marge nette sur le financement de stock B2B.',
          },
          {
            title: 'Multi-équipement informel des commerçants',
            severity: 'Modéré',
            mitigation:
              'Unifier les historiques Wave, Orange Money et MTN MoMo dans un seul relevé quotidien WhatsApp.',
          },
        ],
        fieldProofs: [
          'BCEAO : progression annuelle à deux chiffres de la valeur des paiements marchands numériques dans l’espace UEMOA.',
          'Densité moyenne estimée à 145 000 boutiques structurées et semi-structurées sur Abidjan, Dakar et Cotonou.',
        ],
        kpis: [
          { label: 'Priorité N°1', value: "Côte d'Ivoire", context: 'Volume marchand le plus élevé' },
          { label: 'Maturité digitale', value: '81 %', context: 'Taux Mobile Money actif au Sénégal' },
          { label: 'Panier crédit cible', value: '350 k FCFA', context: 'Cycle de rotation moyen 14 jours' },
        ],
        handoffNote:
          'Mariama, valide sur le terrain à Abidjan et Dakar si les gérants acceptent de partager leur journal de caisse numérique en échange d’un crédit stock à 14 jours.',
      },
      field: {
        agentId: 'field',
        generatedAt: '2026-11-22',
        summary:
          'Les panels menés auprès de 60 commerçants urbains confirment un point de douleur majeur : le rapprochement manuel entre 3 téléphones Mobile Money en fin de journée et les ruptures de stock faute de trésorerie en milieu de mois.',
        keyFindings: [
          '82 % des boutiquiers utilisent encore un cahier papier pour suivre les dettes clients et les entrées fournisseurs.',
          'La méfiance vis-à-vis du fisc freine l’adoption d’outils perçus comme reliés à l’administration ; le positionnement doit rester strictement axé sur le gain de marge et la trésorerie.',
          'Les commerçants préfèrent un accompagnement vocal sur WhatsApp (français simple, wolof ou dioula) plutôt qu’un support par e-mail.',
        ],
        recommendations: [
          'Proposer un mode d’onboarding assisté en 15 minutes en boutique via des ambassadeurs de quartier.',
          'Intégrer des résumés vocaux quotidiens sur WhatsApp pour les gérants peu à l’aise avec les tableaux complexes.',
          'Démarrer le crédit stock dès le 30e jour d’historique de caisse avec un premier palier rassurant de 150 000 FCFA.',
        ],
        risks: [
          {
            title: 'Crainte de traçabilité fiscale excessive',
            severity: 'Élevé',
            mitigation:
              'Garantir contractuellement la confidentialité des données commerciales et communiquer autour du "Cahier de caisse intelligent".',
          },
          {
            title: 'Défaut de remboursement en fin de mois',
            severity: 'Modéré',
            mitigation:
              'Prélèvement fractionné quotidien automatique de 8 % sur les encaissements QR.',
          },
        ],
        fieldProofs: [
          '« Chaque soir je perds 45 minutes à vérifier trois téléphones pour savoir combien mes vendeurs ont encaissé. » — Moussa K., dépôt boissons, Yopougon.',
          '« Si mon grossiste me livre à crédit seulement 7 jours, je rate les ventes du week-end. Une avance rapide me sauve la marge. » — Fatou N., supérette, Parcelles Assainies, Dakar.',
        ],
        kpis: [
          { label: 'Intention d’essai', value: '74 %', context: 'Panel 60 boutiques Abidjan & Dakar' },
          { label: 'Temps perdu caisse', value: '42 min/j', context: 'Réconciliation multi-opérateurs' },
          { label: 'Canal support #1', value: 'WhatsApp', context: '96 % d’usage quotidien marchand' },
        ],
        handoffNote:
          'Awa, positionne l’offre comme un accélérateur de stock et de tranquillité de caisse, jamais comme un logiciel comptable lourd.',
      },
      marketing: {
        agentId: 'marketing',
        generatedAt: '2026-11-22',
        summary:
          'La stratégie Go-to-Market repose sur un modèle hybride : acquisition terrain par brigades commerciales de quartier couplée à un partenariat direct avec 5 grands grossistes FMCG qui co-financent l’équipement de leurs détaillants.',
        keyFindings: [
          'Un abonnement mensuel affiché à 18 500 FCFA (soit ~615 FCFA/jour) franchit le seuil psychologique d’acceptabilité s’il inclut un premier mois gratuit.',
          'Les grossistes distributeurs sont les meilleurs prescripteurs car le crédit stock KobaPay augmente directement leur panier de commande de 18 à 25 %.',
          'La preuve sociale locale (autocollant comptoir + témoignage vidéo de commerçants du même marché) surpasse la publicité digitale générique.',
        ],
        recommendations: [
          'Lancer l’offre en deux paliers : Koba Caisse (10 000 FCFA/mois) et Koba Croissance avec crédit stock (18 500 FCFA/mois + frais d’avance 2,5 %).',
          'Déployer des brigades terrain rémunérées à l’activation réelle (minimum 20 transactions encaissées dans les 15 jours).',
          'Nouer des accords B2B2C avec les distributeurs de boissons, riz et produits d’entretien à Abidjan et Dakar.',
        ],
        risks: [
          {
            title: 'Churn élevé après le mois gratuit',
            severity: 'Modéré',
            mitigation:
              'Conditionner la prime des commerciaux terrain à la rétention M+2 et déclencher la première avance de stock au jour 25.',
          },
          {
            title: 'Confusion de marque avec les opérateurs télécoms',
            severity: 'Faible',
            mitigation:
              'Identité visuelle neutre et multiréseaux mettant en avant "Tous vos paiements, une seule caisse".',
          },
        ],
        fieldProofs: [
          'Coût d’acquisition terrain estimé à 22 000–30 000 FCFA par boutique activée via brigades locales.',
          'Taux de parrainage naturel observé de 1,4 boutique recrutée par commerçant satisfait sur le même axe commercial.',
        ],
        kpis: [
          { label: 'Prix pivot', value: '18 500 FCFA', context: 'Abonnement mensuel Koba Croissance' },
          { label: 'CAC cible', value: '28 000 FCFA', context: 'Brigades terrain + parrainage grossiste' },
          { label: 'Rétention M6 visée', value: '78 %', context: 'Ancrée par le renouvellement stock' },
        ],
        handoffNote:
          'Sébastien, précise le montage juridique exact avec un Établissement de Monnaie Électronique (EME) ou une banque partenaire pour éviter les blocages BCEAO sur le crédit stock.',
      },
      regulatory: {
        agentId: 'regulatory',
        generatedAt: '2026-11-22',
        summary:
          'En zone UEMOA, l’agrégation de paiement et le financement de stock relèvent du cadre strict de la BCEAO. Le chemin le plus rapide (4 à 6 mois) consiste à opérer comme prestataire technique adossé à une banque ou un SFD agréé plutôt que de demander une licence EME en propre dès le jour 1.',
        keyFindings: [
          'La création d’une SAS de droit OHADA à Abidjan permet une gouvernance souple adaptée aux investisseurs et des succursales rapides à Dakar et Cotonou.',
          'L’octroi direct de crédit sans agrément bancaire ou SFD expose à une requalification pour exercice illégal ; le partenariat avec un SFD local ou le paiement direct au grossiste sécurise l’opération.',
          'Les lois sur la protection des données personnelles (ARTCI en CI, CDP au Sénégal, APDP au Bénin) imposent une déclaration préalable avant déploiement commercial.',
        ],
        recommendations: [
          'Signer une convention de partenariat technique avec un EME / établissement bancaire partenaire pour le cantonnement des fonds.',
          'Structurer l’avance de stock sous forme de règlement direct au fournisseur grossiste (supply-chain financing) adossé à un SFD agréé.',
          'Déposer les dossiers de conformité données personnelles (ARTCI & CDP) dès le premier mois de préparation.',
        ],
        risks: [
          {
            title: 'Délai d’intégration API avec les opérateurs télécoms',
            severity: 'Élevé',
            mitigation:
              'Passer par un agrégateur déjà homologué BCEAO pour la phase pilote afin de lancer sous 60 jours.',
          },
          {
            title: 'Non-conformité KYC/AML sur les marchands',
            severity: 'Modéré',
            mitigation:
              'Mettre en place un KYC progressif (CNI + photo boutique + géolocalisation) aligné sur les seuils BCEAO.',
          },
        ],
        fieldProofs: [
          'Acte Uniforme OHADA révisé : immatriculation SAS en 5 à 10 jours ouvrés via CEPICI (Abidjan) ou APIX (Dakar).',
          'Directive BCEAO sur l’interopérabilité régionale (PI-SPI) : opportunité majeure de réduction des coûts de routage.',
        ],
        kpis: [
          { label: 'Structure optimale', value: 'SAS OHADA', context: 'Holding Abidjan + filiales SN/BJ' },
          { label: 'Délai mise en conformité', value: '90 jours', context: 'Via partenariat EME/SFD agréé' },
          { label: 'TVA applicable', value: '18 %', context: 'Taux harmonisé UEMOA sur services' },
        ],
        handoffNote:
          'Ibrahima, intègre dans ton modèle financier le partage de revenus de 25 % avec le SFD partenaire sur la marge de crédit stock et 6 M FCFA de frais juridiques de démarrage.',
      },
      finance: {
        agentId: 'finance',
        generatedAt: '2026-11-22',
        summary:
          'Avec un capital de lancement de 85 M FCFA et un abonnement moyen de 18 500 FCFA/mois, l’équilibre opérationnel mensuel est atteignable autour du mois 18–20, sous réserve de maîtriser le taux de défaut crédit sous 3,5 % et le CAC sous 30 000 FCFA.',
        keyFindings: [
          'La marge brute cible de 68 % offre un ratio LTV/CAC sain supérieur à 10x si la durée de rétention dépasse 24 mois.',
          'Le principal levier de besoin en fonds de roulement (BFR) provient du financement de stock : la ligne de refinancement SFD est indispensable pour ne pas consommer les fonds propres.',
          'Le déploiement simultané dans 3 pays doublerait les charges fixes trop tôt ; un décalage de 6 mois sur le Bénin économise 16 M FCFA de cash burn en année 1.',
        ],
        recommendations: [
          'Allouer 45 % du capital initial au produit/conformité, 35 % à l’acquisition terrain CI/SN et 20 % en réserve de liquidité.',
          'Négocier une ligne de crédit dédiée de 150 M FCFA avec une banque ou un SFD partenaire pour porter l’encours stock hors bilan.',
          'Piloter chaque semaine le taux de récupération J+14 et le coût d’activation net par brigade commerciale.',
        ],
        risks: [
          {
            title: 'Dérive du taux de défaut au-delà de 5 %',
            severity: 'Élevé',
            mitigation:
              'Plafonner le crédit à 30 % du GMV encaissé sur les 30 derniers jours et bloquer automatiquement le réapprovisionnement en cas de retard.',
          },
          {
            title: 'Tension de trésorerie entre M9 et M15',
            severity: 'Modéré',
            mitigation:
              'Facturer des frais de mise en service matérielle (QR + support) de 10 000 FCFA à l’inscription pour amortir 35 % du CAC dès J1.',
          },
        ],
        fieldProofs: [
          'Benchmark FinTech B2B UEMOA : payback CAC optimal situé entre 3 et 5 mois sur les micro-marchands urbains.',
          'Point mort estimé autour de 620 boutiques actives payantes pour couvrir les charges fixes du socle CI + SN.',
        ],
        kpis: [
          { label: 'Seuil d’équilibre', value: '620 boutiques', context: 'Couverture OPEX CI + SN' },
          { label: 'Payback CAC', value: '3,1 mois', context: 'Sur marge brute abonnement seule' },
          { label: 'Capital requis An 1', value: '85 M FCFA', context: 'Hors ligne crédit SFD refinancée' },
        ],
        handoffNote:
          'Aminata, l’équation économique est solide à condition de séquencer CI puis SN avant le Bénin et de ne jamais financer le crédit stock sur fonds propres.',
      },
      ceo: {
        agentId: 'ceo',
        generatedAt: '2026-11-22',
        summary:
          'Verdict KORA Études : GO SOUS CONDITIONS. Le besoin terrain est vérifié et la rentabilité unitaire est attractive, mais le succès exige une discipline stricte : partenariat EME/SFD dès le départ, lancement concentré sur Abidjan et Dakar avant Cotonou, et ancrage via les grossistes FMCG.',
        keyFindings: [
          'Alignement fort entre demande terrain (réconciliation multi-wallets + trésorerie stock) et viabilité financière (payback CAC < 4 mois).',
          'Le principal facteur différenciant face aux wallets télécoms est l’interopérabilité neutre et le crédit fournisseur intégré.',
          'L’exécution réglementaire (convention SFD + déclarations ARTCI/CDP) constitue le chemin critique des 90 premiers jours.',
        ],
        recommendations: [
          'Valider la convention de partenariat EME/SFD avant tout recrutement massif de brigades commerciales.',
          'Lancer un pilote contrôlé de 150 boutiques à Abidjan (Marcory/Yopougon) pendant 60 jours pour calibrer le scoring crédit.',
          'Différer l’ouverture du bureau de Cotonou au trimestre 3 une fois le taux de défaut stabilisé sous 3 %.',
        ],
        risks: [
          {
            title: 'Dispersion géographique prématurée',
            severity: 'Élevé',
            mitigation:
              'Geler l’expansion au Bénin tant que 300 boutiques actives rentables ne sont pas atteintes en CI et au SN.',
          },
          {
            title: 'Copie rapide par un acteur Mobile Money établi',
            severity: 'Modéré',
            mitigation:
              'Verrouiller l’exclusivité opérationnelle avec 3 grossistes majeurs et capitaliser sur le multi-opérateurs.',
          },
        ],
        fieldProofs: [
          'Consensus des 5 directions KORA Études sur la viabilité du modèle B2B2C adossé aux grossistes.',
        ],
        kpis: [
          { label: 'Verdict Cabinet', value: 'GO CONDITIONNEL', context: 'Conditionné à l’accord SFD/EME' },
          { label: 'Objectif Pilote 90j', value: '150 boutiques', context: 'Abidjan + pré-lancement Dakar' },
          { label: 'Horizon Rentabilité', value: 'Mois 18–20', context: 'Avec discipline OPEX & BFR' },
        ],
        handoffNote:
          'Dossier complet prêt pour présentation au comité d’investissement du client et lancement de la phase pilote.',
        verdict: 'GO SOUS CONDITIONS',
        actionPlan90Days: [
          {
            phase: 'Jours 1-30',
            action:
              'Immatriculer la SAS OHADA à Abidjan, signer le protocole EME/SFD et déposer les déclarations ARTCI/CDP.',
            owner: 'Sébastien Mensah (Réglementaire)',
            deliverable: 'Convention SFD & dossiers conformité',
          },
          {
            phase: 'Jours 31-60',
            action:
              'Signer 2 grossistes FMCG partenaires et déployer le pilote sur 150 boutiques à Abidjan avec onboarding WhatsApp.',
            owner: 'Awa Traoré (Marketing) & Mariama Sow (Terrain)',
            deliverable: '150 boutiques actives & NPS pilote',
          },
          {
            phase: 'Jours 61-90',
            action:
              'Auditer le taux de défaut crédit J+14, ajuster le pricing définitif et ouvrir la cohorte Dakar.',
            owner: 'Ibrahima Koné (Finance) & Aminata Diallo (DG)',
            deliverable: 'Go expansion Dakar & reporting investisseurs',
          },
        ],
      },
    },
  },
  {
    id: 'study-solakits-sahel',
    title: 'SolaFroid — Chambres Froides Solaires Pay-As-You-Go',
    clientName: 'Teranga Agri-Énergie (Dakar)',
    sector: 'energy',
    businessModel: 'B2B',
    targetCountries: ['SN', 'ML', 'BF', 'TG'],
    primaryChannel: 'Force de vente directe B2B',
    valueProposition:
      'Location-vente (Pay-As-You-Go via Mobile Money) de modules de conservation frigorifique solaire pour coopératives maraîchères et mareyeurs afin de réduire de 40 % les pertes post-récolte.',
    targetSegment:
      'Coopératives agricoles (oignon, mangue, tomate), groupements de femmes transformatrices et marchés de gros périurbains.',
    createdAt: '2026-11-18',
    updatedAt: '2026-11-18',
    status: 'Brouillon',
    missionFeeXof: 11800000,
    simulation: {
      unitPriceXof: 95000,
      grossMarginPct: 48,
      monthlyMarketingBudgetXof: 2800000,
      targetPenetrationPct: 2.1,
      launchCapitalXof: 120000000,
      cacXof: 115000,
      purchasesPerYear: 12,
      discountRatePct: 12,
      corporateTaxRatePct: 33,
    },
    deliverables: {},
  },
];
