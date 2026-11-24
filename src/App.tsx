import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Plus,
  Scale,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { AGENT_PIPELINE_ORDER } from './data/agents';
import { INITIAL_STUDIES } from './data/defaultStudies';
import type {
  AgentChatMessage,
  AgentDeliverable,
  AgentId,
  BoardroomDebate,
  MarketStudy,
} from './types/uemoa';
import { computeMarketSimulation } from './utils/simulatorMath';
import { AgentsView } from './components/AgentsView';
import { BoardroomView } from './components/BoardroomView';
import { DossierView } from './components/DossierView';
import { FinanceSyscohadaView } from './components/FinanceSyscohadaView';
import { NewStudyModal } from './components/NewStudyModal';
import { OverviewView } from './components/OverviewView';
import { SimulatorView } from './components/SimulatorView';

type TabId = 'overview' | 'simulator' | 'finance' | 'agents' | 'boardroom' | 'dossier';

const STORAGE_KEY_STUDIES = 'kora_uemoa_studies_v1';
const STORAGE_KEY_DEBATES = 'kora_uemoa_debates_v1';

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Pilotage Cabinet', icon: LayoutDashboard },
  { id: 'simulator', label: 'Simulateur UEMOA', icon: SlidersHorizontal },
  { id: 'finance', label: 'Finance & SYSCOHADA', icon: Scale },
  { id: 'agents', label: 'Les 6 Agents', icon: Users },
  { id: 'boardroom', label: 'Comité Direction', icon: MessagesSquare },
  { id: 'dossier', label: 'Dossier & Exports', icon: FileText },
];

export default function App() {
  const [studies, setStudies] = useState<MarketStudy[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_STUDIES;
  });

  const [debates, setDebates] = useState<BoardroomDebate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEBATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const [activeStudyId, setActiveStudyId] = useState<string>(() => studies[0]?.id || INITIAL_STUDIES[0].id);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newStudyOpen, setNewStudyOpen] = useState(false);

  const [runningAgentId, setRunningAgentId] = useState<AgentId | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<Record<AgentId, AgentChatMessage[]>>({
    data: [],
    field: [],
    marketing: [],
    regulatory: [],
    finance: [],
    ceo: [],
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDIES, JSON.stringify(studies));
    } catch {
      // Ignore quota errors
    }
  }, [studies]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DEBATES, JSON.stringify(debates));
    } catch {
      // Ignore quota errors
    }
  }, [debates]);

  const activeStudy = useMemo(
    () => studies.find((s) => s.id === activeStudyId) || studies[0],
    [studies, activeStudyId]
  );

  const simulation = useMemo(() => computeMarketSimulation(activeStudy), [activeStudy]);

  const updateStudy = (updated: MarketStudy) => {
    setStudies((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const executeAgentStep = async (
    targetStudy: MarketStudy,
    agentId: AgentId,
    accumulatedDeliverables: Partial<Record<AgentId, AgentDeliverable>>
  ): Promise<AgentDeliverable> => {
    const sim = computeMarketSimulation(targetStudy);
    const payload = JSON.stringify({
      agentId,
      study: targetStudy,
      simulationMetrics: {
        totalTamXofM: sim.totalTamXofM,
        totalSamXofM: sim.totalSamXofM,
        totalSomYear3XofM: sim.totalSomYear3XofM,
        year1RevenueXofM: sim.year1RevenueXofM,
        year3RevenueXofM: sim.year3RevenueXofM,
        breakEvenMonth: sim.breakEvenMonth,
        corporateTaxRatePct: sim.corporateTaxRatePct,
        discountRatePct: sim.discountRatePct,
        npvXof: sim.npvXof,
        totalFntXof: sim.totalFntXof,
        paybackLabel: sim.paybackLabel,
      },
      previousDeliverables: accumulatedDeliverables,
    });

    const maxClientAttempts = 2;
    let lastError = 'Échec de communication avec le serveur.';

    for (let attempt = 1; attempt <= maxClientAttempts; attempt++) {
      try {
        const response = await fetch('/api/agents/run-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });

        const rawText = await response.text();
        let data: { deliverable?: AgentDeliverable; error?: string } = {};
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          data = {};
        }

        if (response.ok && data.deliverable) {
          return data.deliverable;
        }

        const isRetryableStatus =
          response.status === 502 || response.status === 503 || response.status === 504;
        lastError =
          data.error ||
          (isRetryableStatus
            ? 'Le service est momentanément saturé (erreur 503). Réessayez dans quelques instants.'
            : `Échec d’exécution pour le département ${agentId}.`);

        if (!isRetryableStatus || attempt === maxClientAttempts) {
          throw new Error(lastError);
        }
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        lastError = err instanceof Error ? err.message : lastError;
        if (attempt === maxClientAttempts) {
          throw new Error(lastError);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    throw new Error(lastError);
  };

  const runSingleAgent = async (agentId: AgentId, studyOverride?: MarketStudy) => {
    const target = studyOverride || activeStudy;
    setPipelineError(null);
    setRunningAgentId(agentId);
    try {
      const deliverable = await executeAgentStep(target, agentId, target.deliverables);
      setStudies((prev) =>
        prev.map((s) => {
          if (s.id !== target.id) return s;
          const nextDeliverables = { ...s.deliverables, [agentId]: deliverable };
          const count = Object.keys(nextDeliverables).length;
          return {
            ...s,
            updatedAt: new Date().toISOString().slice(0, 10),
            status: count === 6 ? 'Finalisée' : 'En cours',
            deliverables: nextDeliverables,
          };
        })
      );
    } catch (err) {
      setPipelineError(
        err instanceof Error ? err.message : 'Erreur lors de l’exécution de l’agent.'
      );
    } finally {
      setRunningAgentId(null);
    }
  };

  const runFullPipeline = async (studyOverride?: MarketStudy) => {
    const target = studyOverride || activeStudy;
    if (pipelineRunning) return;

    setPipelineError(null);
    setPipelineRunning(true);

    // Resume from existing deliverables if partially completed; otherwise start fresh
    const existingKeys = Object.keys(target.deliverables || {});
    const isResuming =
      existingKeys.length > 0 && existingKeys.length < AGENT_PIPELINE_ORDER.length;
    let workingDeliverables: Partial<Record<AgentId, AgentDeliverable>> = isResuming
      ? { ...target.deliverables }
      : {};

    try {
      for (const agentId of AGENT_PIPELINE_ORDER) {
        if (isResuming && workingDeliverables[agentId]) {
          continue;
        }
        setRunningAgentId(agentId);
        const deliverable = await executeAgentStep(target, agentId, workingDeliverables);
        workingDeliverables = { ...workingDeliverables, [agentId]: deliverable };

        const snapshot = { ...workingDeliverables };
        setStudies((prev) =>
          prev.map((s) => {
            if (s.id !== target.id) return s;
            const count = Object.keys(snapshot).length;
            return {
              ...s,
              updatedAt: new Date().toISOString().slice(0, 10),
              status: count === 6 ? 'Finalisée' : 'En cours',
              deliverables: snapshot,
            };
          })
        );
        await new Promise((r) => setTimeout(r, 350));
      }
    } catch (err) {
      setPipelineError(
        err instanceof Error ? err.message : 'Erreur lors de la chaîne multi-agents.'
      );
    } finally {
      setRunningAgentId(null);
      setPipelineRunning(false);
    }
  };

  const handleCreateStudy = (newStudy: MarketStudy, autoRun: boolean) => {
    setStudies((prev) => [newStudy, ...prev]);
    setActiveStudyId(newStudy.id);
    setActiveTab('simulator');
    if (autoRun) {
      void runFullPipeline(newStudy);
    }
  };

  const handleDeleteStudy = (studyId: string) => {
    setStudies((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((s) => s.id !== studyId);
      if (activeStudyId === studyId) {
        setActiveStudyId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleAddChatMessage = (agentId: AgentId, msg: AgentChatMessage) => {
    setChatHistory((prev) => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), msg],
    }));
  };

  const handleAddDebate = (debate: BoardroomDebate) => {
    setDebates((prev) => [debate, ...prev]);
  };

  const activeNavLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Pilotage Cabinet';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-[var(--font-display)]"
          >
            KORA Études
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0F5132] text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active study selector footer inside sidebar */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Dossier actif</span>
          </div>
          <select
            aria-label="Changer de dossier actif"
            value={activeStudy.id}
            onChange={(e) => setActiveStudyId(e.target.value)}
            className="w-full px-2.5 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F5132]"
          >
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Siège Dakar · Bureaux Abidjan, Bamako, Cotonou
          </p>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-[var(--font-display)]">
                KORA Études
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fermer le menu"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#0F5132] text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on left, 1 primary action on right */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center gap-2 text-xs sm:text-sm min-w-0"
            >
              <span className="text-slate-500 whitespace-nowrap shrink-0 hidden sm:inline">
                KORA Études
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-slate-900 whitespace-nowrap shrink-0">
                {activeNavLabel}
              </span>
              <span className="text-slate-300 hidden md:inline" aria-hidden="true">
                /
              </span>
              <span className="text-slate-500 truncate hidden md:inline max-w-[280px]">
                {activeStudy.title}
              </span>
            </nav>
          </div>

          <button
            type="button"
            onClick={() => setNewStudyOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle étude
          </button>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1320px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              studies={studies}
              activeStudy={activeStudy}
              simulation={simulation}
              runningAgentId={runningAgentId}
              onSelectStudy={(id) => setActiveStudyId(id)}
              onDeleteStudy={handleDeleteStudy}
              onOpenNewStudy={() => setNewStudyOpen(true)}
              onNavigate={(tab) => setActiveTab(tab)}
              onRunFullPipeline={() => void runFullPipeline()}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView
              study={activeStudy}
              simulation={simulation}
              runningAgentId={runningAgentId}
              pipelineRunning={pipelineRunning}
              pipelineError={pipelineError}
              onUpdateStudy={updateStudy}
              onRunFullPipeline={() => void runFullPipeline()}
              onRunSingleAgent={(agentId) => void runSingleAgent(agentId)}
              onOpenFinance={() => setActiveTab('finance')}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceSyscohadaView
              study={activeStudy}
              simulation={simulation}
              onUpdateStudy={updateStudy}
            />
          )}

          {activeTab === 'agents' && (
            <AgentsView
              study={activeStudy}
              simulation={simulation}
              chatHistory={chatHistory}
              onAddChatMessage={handleAddChatMessage}
            />
          )}

          {activeTab === 'boardroom' && (
            <BoardroomView
              study={activeStudy}
              simulation={simulation}
              debates={debates}
              onAddDebate={handleAddDebate}
            />
          )}

          {activeTab === 'dossier' && (
            <DossierView
              study={activeStudy}
              simulation={simulation}
              pipelineRunning={pipelineRunning}
              onRunFullPipeline={() => void runFullPipeline()}
            />
          )}
        </main>
      </div>

      <NewStudyModal
        open={newStudyOpen}
        onClose={() => setNewStudyOpen(false)}
        onCreate={handleCreateStudy}
      />
    </div>
  );
}
