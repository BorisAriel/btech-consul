import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT) || 3000;
const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Clé API Gemini manquante sur le serveur. Vérifiez la configuration dans Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return (
    status === 503 ||
    status === 500 ||
    status === 429 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('504') ||
    msg.includes('429') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('OVERLOADED') ||
    msg.includes('high demand') ||
    msg.includes('DEADLINE_EXCEEDED') ||
    msg.includes('fetch failed') ||
    msg.includes('ECONNRESET')
  );
}

interface ResilientGenOptions {
  contents: string;
  systemInstruction: string;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
}

async function generateWithResilience(ai: GoogleGenAI, opts: ResilientGenOptions) {
  const runModel = async (model: string, maxAttempts: number, useThinkingLow: boolean) => {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const config: Record<string, unknown> = {
          systemInstruction: opts.systemInstruction,
        };
        if (opts.responseMimeType) {
          config.responseMimeType = opts.responseMimeType;
        }
        if (opts.responseSchema) {
          config.responseSchema = opts.responseSchema;
        }
        if (useThinkingLow) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
        return await ai.models.generateContent({
          model,
          contents: opts.contents,
          config,
        });
      } catch (err) {
        lastErr = err;
        if (!isTransientError(err) || attempt === maxAttempts) {
          throw err;
        }
        const delayMs = 1200 * attempt + Math.floor(Math.random() * 400);
        console.warn(`[${model}] Transient error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw lastErr;
  };

  try {
    return await runModel(PRIMARY_MODEL, 3, true);
  } catch (primaryErr) {
    if (!isTransientError(primaryErr)) {
      throw primaryErr;
    }
    console.warn(`[${PRIMARY_MODEL}] Unavailable after retries, switching to ${FALLBACK_MODEL}`);
    return await runModel(FALLBACK_MODEL, 2, false);
  }
}

function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('403')) {
    return {
      status: 403,
      message:
        'Accès refusé par l’API Gemini. Vérifiez votre clé API dans le panneau Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message:
        'Quota API temporairement atteint. Patientez quelques instants avant de relancer l’agent.',
    };
  }
  if (
    raw.includes('503') ||
    raw.includes('UNAVAILABLE') ||
    raw.includes('OVERLOADED') ||
    raw.includes('high demand')
  ) {
    return {
      status: 503,
      message:
        'Le service d’analyse est momentanément saturé (erreur 503). Cliquez sur « Reprendre l’étude » dans quelques secondes.',
    };
  }
  return {
    status: 500,
    message: raw || 'Erreur interne lors de l’exécution de l’agent.',
  };
}

interface AgentSystemPersona {
  name: string;
  role: string;
  department: string;
  office: string;
  systemPrompt: string;
}

const AGENT_PERSONAS: Record<string, AgentSystemPersona> = {
  data: {
    name: 'Kouassi Yao',
    role: 'Directeur des Études & Data UEMOA',
    department: 'Études & Intelligence Marché',
    office: 'Abidjan',
    systemPrompt:
      "Tu es Kouassi Yao, Directeur des Études & Data UEMOA chez KORA Études (basé à Abidjan). Tu es un expert en dimensionnement de marché (TAM/SAM/SOM), macroéconomie UEMOA (BCEAO, INS, démographie urbaine, pouvoir d'achat en FCFA/XOF, pénétration Mobile Money Wave/Orange/MTN/Moov). Tu réponds uniquement en français professionnel de cabinet de conseil, de façon chiffrée, concrète, sans jargon creux.",
  },
  field: {
    name: 'Mariama Sow',
    role: 'Cheffe Terrain & Insights Consommateurs',
    department: 'Terrain & Panels Qualitatifs',
    office: 'Dakar',
    systemPrompt:
      "Tu es Mariama Sow, Cheffe Terrain & Insights Consommateurs chez KORA Études (basée à Dakar). Tu connais intimement les habitudes de consommation urbaines et périurbaines d'Afrique de l'Ouest (achats fractionnés, confiance communautaire, WhatsApp Commerce, langues locales, freins culturels, marchés de Sandaga, Yopougon, Dantokpa, Grand Marché de Lomé). Tu produis des insights terrain incarnés avec des verbatims réalistes de consommateurs ou commerçants locaux. Français professionnel uniquement.",
  },
  marketing: {
    name: 'Awa Traoré',
    role: 'Directrice Marketing & Positionnement',
    department: 'Stratégie Marketing & Go-to-Market',
    office: 'Abidjan / Bamako',
    systemPrompt:
      "Tu es Awa Traoré, Directrice Marketing & Positionnement chez KORA Études. Experte en stratégie Go-to-Market UEMOA, mix marketing 4P, pricing psychologique en FCFA, distribution hybride (boutiques de quartier, grossistes, GMS, pharmacies, WhatsApp, radio locale, brigades terrain, influenceurs locaux). Tu proposes des stratégies commerciales ultra-opérationnelles en français.",
  },
  regulatory: {
    name: 'Sébastien Mensah',
    role: 'Directeur Réglementaire, OHADA & Risques',
    department: 'Conformité, Fiscalité & Risques Pays',
    office: 'Cotonou / Lomé',
    systemPrompt:
      "Tu es Sébastien Mensah, Directeur Réglementaire, OHADA & Risques chez KORA Études (Cotonou/Lomé). Expert en droit des affaires OHADA (SARL, SAS), réglementation BCEAO (EME, SFD, interopérabilité PI-SPI), fiscalité UEMOA (TVA 18%, TEC CEDEAO/UEMOA), protection des données (ARTCI, CDP, APDP), agréments sectoriels et logistique des corridors portuaires (Abidjan, Dakar, Lomé, Cotonou). Tu analyses les risques pays et réglementaires avec rigueur en français.",
  },
  finance: {
    name: 'Ibrahima Koné',
    role: 'Directeur Financier & Commercial (DAF)',
    department: 'Finance, Pricing & Rentabilité',
    office: 'Abidjan',
    systemPrompt:
      "Tu es Ibrahima Koné, DAF & Directeur Commercial chez KORA Études (Abidjan). Expert en modélisation financière en FCFA (XOF), unit economics (CAC, LTV, marge brute, point mort, BFR), structuration financière locale (banques UEMOA, SFD, investisseurs impact) et discipline d'allocation budgétaire. Tu challenges les hypothèses optimistes avec pragmatisme en français.",
  },
  ceo: {
    name: 'Aminata Diallo',
    role: 'Directrice Générale (DG) & Associée',
    department: 'Direction Générale & Arbitrage',
    office: 'Dakar',
    systemPrompt:
      "Tu es Aminata Diallo, Directrice Générale et Associée fondatrice de KORA Études (Siège Dakar). Tu synthétises les travaux des 5 départements (Data, Terrain, Marketing, Réglementaire, Finance), arbitres les contradictions, rends un verdict clair (GO, GO SOUS CONDITIONS ou PIVOT RECOMMANDÉ) et bâtis un plan d'action concret à 90 jours. Ton ton est celui d'une associée senior en conseil stratégique en Afrique de l'Ouest.",
  },
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'kora-etudes-uemoa' });
});

app.post('/api/agents/run-step', async (req, res) => {
  try {
    const { agentId, study, simulationMetrics, previousDeliverables } = req.body ?? {};
    const persona = AGENT_PERSONAS[String(agentId)];
    if (!persona) {
      res.status(400).json({ error: 'Département agent inconnu.' });
      return;
    }
    if (!study || !study.title) {
      res.status(400).json({ error: 'Brief d’étude manquant.' });
      return;
    }

    const ai = getAiClient();
    const isCeo = agentId === 'ceo';

    const previousContext = previousDeliverables
      ? Object.entries(previousDeliverables)
          .map(([k, v]: [string, any]) => {
            const name = AGENT_PERSONAS[k]?.department || k;
            return `- [${name}] Synthèse: ${v.summary}\n  Note de passage: ${v.handoffNote}`;
          })
          .join('\n')
      : 'Aucun département précédent exécuté.';

    const prompt = `
MISSION D'ÉTUDE DE MARCHÉ UEMOA — CABINET KORA ÉTUDES

Projet : ${study.title}
Client : ${study.clientName || 'Commanditaire interne'}
Secteur : ${study.sector}
Modèle économique : ${study.businessModel}
Pays UEMOA ciblés : ${(study.targetCountries || []).join(', ')}
Canal de distribution prioritaire : ${study.primaryChannel}
Proposition de valeur : ${study.valueProposition}
Segment cible : ${study.targetSegment}

Hypothèses chiffrées de simulation (FCFA / XOF) :
- Prix unitaire cible : ${study.simulation?.unitPriceXof} FCFA (${study.simulation?.purchasesPerYear} achats/an)
- Marge brute cible : ${study.simulation?.grossMarginPct} %
- Budget marketing mensuel : ${study.simulation?.monthlyMarketingBudgetXof} FCFA
- Capital de lancement : ${study.simulation?.launchCapitalXof} FCFA
- CAC estimé : ${study.simulation?.cacXof} FCFA
- TAM estimé (zone sélectionnée) : ${simulationMetrics?.totalTamXofM ?? 'N/A'} M FCFA
- SAM estimé : ${simulationMetrics?.totalSamXofM ?? 'N/A'} M FCFA
- SOM An 3 estimé : ${simulationMetrics?.totalSomYear3XofM ?? 'N/A'} M FCFA
- CA An 1 / An 3 projeté : ${simulationMetrics?.year1RevenueXofM ?? 'N/A'} M FCFA / ${simulationMetrics?.year3RevenueXofM ?? 'N/A'} M FCFA
- Mois de point mort estimé : ${simulationMetrics?.breakEvenMonth ? `Mois ${simulationMetrics.breakEvenMonth}` : 'Au-delà de 36 mois'}
- Taux d'imposition (IS) : ${simulationMetrics?.corporateTaxRatePct ?? 33} % (norme SYSCOHADA Révisé)
- Flux Nets de Trésorerie (FNT) cumulés sur 3 ans : ${simulationMetrics?.totalFntXof !== undefined ? `${Math.round(simulationMetrics.totalFntXof).toLocaleString('fr-FR')} FCFA` : 'N/A'}
- Valeur Actuelle Nette (VAN à ${simulationMetrics?.discountRatePct ?? 12} %) : ${simulationMetrics?.npvXof !== undefined ? `${Math.round(simulationMetrics.npvXof).toLocaleString('fr-FR')} FCFA` : 'N/A'}
- Durée de Récupération du Capital Investi (DRCI) : ${simulationMetrics?.paybackLabel ?? 'N/A'}

Travaux reçus des départements précédents de KORA Études :
${previousContext}

CONSIGNE POUR TON DÉPARTEMENT (${persona.department}) :
Produis ton livrable structuré en JSON strictement conforme au schéma.
- Sois précis, ancré dans les réalités réelles des pays UEMOA sélectionnés (villes, quartiers, acteurs locaux, devises en FCFA, régulateurs, corridors).
- 3 à 4 constats clés, 3 recommandations concrètes, 2 risques majeurs avec plan d'atténuation, 2 preuves terrain ou verbatims réalistes, 3 KPIs synthétiques.
- Rédige une "handoffNote" courte et directe adressée au collègue du département suivant dans KORA Études.
${isCeo ? '- En tant que DG, fournis obligatoirement le verdict (GO, GO SOUS CONDITIONS ou PIVOT RECOMMANDÉ) et un plan d’action 90 jours en 3 phases (Jours 1-30, Jours 31-60, Jours 61-90) avec un responsable parmi les directeurs de KORA Études.' : ''}
`;

    const baseProperties: Record<string, any> = {
      summary: {
        type: Type.STRING,
        description: 'Synthèse exécutive claire en 2 à 3 phrases.',
      },
      keyFindings: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '3 à 4 constats clés chiffrés et localisés UEMOA.',
      },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '3 recommandations opérationnelles concrètes.',
      },
      risks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            severity: {
              type: Type.STRING,
              description: 'Élevé, Modéré ou Faible',
            },
            mitigation: { type: Type.STRING },
          },
          required: ['title', 'severity', 'mitigation'],
        },
      },
      fieldProofs: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '2 preuves terrain, benchmarks UEMOA ou verbatims consommateurs réalistes.',
      },
      kpis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            value: { type: Type.STRING },
            context: { type: Type.STRING },
          },
          required: ['label', 'value', 'context'],
        },
        description: 'Exactement 3 indicateurs clés courts.',
      },
      handoffNote: {
        type: Type.STRING,
        description: 'Note de transmission interne courte au département suivant.',
      },
    };

    const requiredFields = [
      'summary',
      'keyFindings',
      'recommendations',
      'risks',
      'fieldProofs',
      'kpis',
      'handoffNote',
    ];

    if (isCeo) {
      baseProperties.verdict = {
        type: Type.STRING,
        description: 'Exactement une des valeurs: GO, GO SOUS CONDITIONS, ou PIVOT RECOMMANDÉ',
      };
      baseProperties.actionPlan90Days = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phase: {
              type: Type.STRING,
              description: 'Jours 1-30, Jours 31-60 ou Jours 61-90',
            },
            action: { type: Type.STRING },
            owner: { type: Type.STRING },
            deliverable: { type: Type.STRING },
          },
          required: ['phase', 'action', 'owner', 'deliverable'],
        },
      };
      requiredFields.push('verdict', 'actionPlan90Days');
    }

    const response = await generateWithResilience(ai, {
      contents: prompt,
      systemInstruction: persona.systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: baseProperties,
        required: requiredFields,
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    const normalizedRisks = Array.isArray(parsed.risks)
      ? parsed.risks.map((r: any) => ({
          title: String(r.title || 'Risque opérationnel'),
          severity:
            r.severity === 'Élevé' || r.severity === 'Faible' ? r.severity : 'Modéré',
          mitigation: String(r.mitigation || ''),
        }))
      : [];

    const deliverable = {
      agentId,
      generatedAt: new Date().toISOString().slice(0, 10),
      summary: String(parsed.summary || ''),
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings.map(String) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String)
        : [],
      risks: normalizedRisks,
      fieldProofs: Array.isArray(parsed.fieldProofs) ? parsed.fieldProofs.map(String) : [],
      kpis: Array.isArray(parsed.kpis) ? parsed.kpis.slice(0, 3) : [],
      handoffNote: String(parsed.handoffNote || ''),
      ...(isCeo
        ? {
            verdict:
              parsed.verdict === 'GO' || parsed.verdict === 'PIVOT RECOMMANDÉ'
                ? parsed.verdict
                : 'GO SOUS CONDITIONS',
            actionPlan90Days: Array.isArray(parsed.actionPlan90Days)
              ? parsed.actionPlan90Days
              : [],
          }
        : {}),
    };

    res.json({ deliverable });
  } catch (err) {
    console.error('[run-step error]', err);
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post('/api/agents/chat', async (req, res) => {
  try {
    const { agentId, message, history, study, simulationMetrics } = req.body ?? {};
    const persona = AGENT_PERSONAS[String(agentId)];
    if (!persona) {
      res.status(400).json({ error: 'Agent introuvable.' });
      return;
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message vide.' });
      return;
    }

    const ai = getAiClient();
    const recentHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .map((m: any) => `${m.role === 'user' ? 'Direction Client' : persona.name}: ${m.content}`)
          .join('\n')
      : '';

    const activeDeliverable = study?.deliverables?.[agentId];

    const prompt = `
CONTEXTE DE L'ÉTUDE ACTIVE CHEZ KORA ÉTUDES :
- Projet : ${study?.title || 'Non précisé'}
- Secteur : ${study?.sector || 'Non précisé'} (${study?.businessModel || 'B2C'})
- Pays UEMOA ciblés : ${(study?.targetCountries || []).join(', ')}
- Prix cible : ${study?.simulation?.unitPriceXof ?? 0} FCFA · Marge brute : ${study?.simulation?.grossMarginPct ?? 0} %
- Budget marketing mensuel : ${study?.simulation?.monthlyMarketingBudgetXof ?? 0} FCFA
- SOM An 3 estimé : ${simulationMetrics?.totalSomYear3XofM ?? 'N/A'} M FCFA
- Proposition de valeur : ${study?.valueProposition || ''}
${activeDeliverable ? `- Ton dernier livrable sur ce dossier : ${activeDeliverable.summary}` : ''}

Historique récent de l'échange :
${recentHistory || '(Début de la consultation)'}

Question / Consigne de l'utilisateur :
${message.trim()}

Réponds en incarnant ton rôle chez KORA Études. Sois direct, structuré (paragraphes courts ou points concrets), chiffré en FCFA si pertinent, ancré dans les pays UEMOA concernés, en 120 à 220 mots maximum. Ne mets pas de markdown décoratif excessif.
`;

    const response = await generateWithResilience(ai, {
      contents: prompt,
      systemInstruction: persona.systemPrompt,
    });

    res.json({ reply: (response.text ?? '').trim() });
  } catch (err) {
    console.error('[agent chat error]', err);
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post('/api/boardroom/debate', async (req, res) => {
  try {
    const { topic, study, simulationMetrics } = req.body ?? {};
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({ error: 'Veuillez formuler un sujet ou scénario pour le Comité de Direction.' });
      return;
    }

    const ai = getAiClient();

    const prompt = `
Tu orchestres un COMITÉ DE DIRECTION RÉEL au sein du cabinet KORA Études (études de marché UEMOA).
Les 6 directeurs débattent ensemble d'un dilemme stratégique ou d'un choc de marché concernant l'étude active :

ÉTUDE ACTIVE :
- Projet : ${study?.title || 'Projet UEMOA'}
- Secteur : ${study?.sector || 'Non précisé'} (${study?.businessModel || 'B2C'})
- Pays ciblés : ${(study?.targetCountries || []).join(', ')}
- Prix cible : ${study?.simulation?.unitPriceXof ?? 0} FCFA · Capital : ${study?.simulation?.launchCapitalXof ?? 0} FCFA
- CA An 3 projeté : ${simulationMetrics?.year3RevenueXofM ?? 'N/A'} M FCFA · Point mort : ${simulationMetrics?.breakEvenMonth ? `Mois ${simulationMetrics.breakEvenMonth}` : '> 36 mois'}
- Proposition de valeur : ${study?.valueProposition || ''}

DILEMME / SCÉNARIO SOUMIS AU COMITÉ :
"${topic.trim()}"

MEMBRES DU COMITÉ (utilise exactement leurs agentId) :
1. data — Kouassi Yao (Études & Data UEMOA, Abidjan)
2. field — Mariama Sow (Terrain & Insights Consommateurs, Dakar)
3. marketing — Awa Traoré (Marketing & Go-to-Market, Abidjan/Bamako)
4. regulatory — Sébastien Mensah (Réglementaire, OHADA & Risques, Cotonou/Lomé)
5. finance — Ibrahima Koné (DAF & Finance, Abidjan)
6. ceo — Aminata Diallo (DG & Arbitrage, Dakar)

RÈGLES DU DÉBAT :
- Fais intervenir les 6 directeurs dans un ordre logique, en terminant par Aminata Diallo (ceo) qui arbitre.
- Crée de vraies tensions métiers réalistes (ex. Marketing veut investir/accélérer, Finance protège la trésorerie et le BFR, Réglementaire pointe une contrainte OHADA/BCEAO/douane, Terrain ramène la réalité des consommateurs à Abidjan/Dakar/Cotonou).
- Chaque prise de parole doit répondre ou réagir implicitement aux enjeux posés par les collègues.
- Produis une décision finale tranchée et 3 actions immédiates assignées avec échéance.
- Langue : français professionnel uniquement.
`;

    const response = await generateWithResilience(ai, {
      contents: prompt,
      systemInstruction:
        "Tu es l'orchestrateur du Comité de Direction de KORA Études, cabinet d'études de marché en zone UEMOA. Tu simules un échange réaliste, rigoureux et contradictoire entre 6 cadres dirigeants ouest-africains.",
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          turns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                agentId: {
                  type: Type.STRING,
                  description: 'Un parmi: data, field, marketing, regulatory, finance, ceo',
                },
                stance: {
                  type: Type.STRING,
                  description: 'Favorable, Prudent, Critique ou Arbitrage',
                },
                argument: {
                  type: Type.STRING,
                  description: 'Intervention réaliste en 2 à 3 phrases.',
                },
                evidence: {
                  type: Type.STRING,
                  description: 'Chiffre, référence UEMOA ou fait terrain à l’appui (1 phrase courte).',
                },
              },
              required: ['agentId', 'stance', 'argument', 'evidence'],
            },
          },
          finalDecision: {
            type: Type.STRING,
            description: 'Décision tranchée de la DG en 1 à 2 phrases.',
          },
          rationale: {
            type: Type.STRING,
            description: 'Justification synthétique de l’arbitrage (2 phrases).',
          },
          actionItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                owner: { type: Type.STRING },
                deadline: { type: Type.STRING },
              },
              required: ['action', 'owner', 'deadline'],
            },
          },
        },
        required: ['turns', 'finalDecision', 'rationale', 'actionItems'],
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const validIds = new Set(['data', 'field', 'marketing', 'regulatory', 'finance', 'ceo']);

    const turns = Array.isArray(parsed.turns)
      ? parsed.turns
          .filter((t: any) => validIds.has(String(t.agentId)))
          .map((t: any) => {
            const p = AGENT_PERSONAS[t.agentId];
            const stance =
              t.stance === 'Favorable' ||
              t.stance === 'Prudent' ||
              t.stance === 'Critique' ||
              t.stance === 'Arbitrage'
                ? t.stance
                : t.agentId === 'ceo'
                  ? 'Arbitrage'
                  : 'Prudent';
            return {
              agentId: t.agentId,
              agentName: p.name,
              department: p.department,
              stance,
              argument: String(t.argument || ''),
              evidence: String(t.evidence || ''),
            };
          })
      : [];

    res.json({
      debate: {
        id: `debate-${Date.now()}`,
        studyId: study?.id || 'active',
        topic: topic.trim(),
        createdAt: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        turns,
        finalDecision: String(parsed.finalDecision || ''),
        rationale: String(parsed.rationale || ''),
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      },
    });
  } catch (err) {
    console.error('[boardroom debate error]', err);
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KORA Études server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
