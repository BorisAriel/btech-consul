import { useState } from 'react';
import { X } from 'lucide-react';
import { SECTOR_LABELS, UEMOA_COUNTRIES } from '../data/uemoaCountries';
import type {
  BusinessModelType,
  DistributionChannel,
  MarketStudy,
  SectorId,
  UemoaCountryCode,
} from '../types/uemoa';

interface NewStudyModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (study: MarketStudy, autoRun: boolean) => void;
}

const CHANNELS: DistributionChannel[] = [
  'Mobile Money & Digital',
  'Boutiques de quartier & Grossistes',
  'GMS, Pharmacies & Réseaux structurés',
  'Force de vente directe B2B',
];

export function NewStudyModal({ open, onClose, onCreate }: NewStudyModalProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [sector, setSector] = useState<SectorId>('agritech');
  const [businessModel, setBusinessModel] = useState<BusinessModelType>('B2C');
  const [primaryChannel, setPrimaryChannel] = useState<DistributionChannel>(
    'Boutiques de quartier & Grossistes'
  );
  const [targetCountries, setTargetCountries] = useState<UemoaCountryCode[]>(['CI', 'SN', 'BJ']);
  const [valueProposition, setValueProposition] = useState('');
  const [targetSegment, setTargetSegment] = useState('');
  const [unitPriceXof, setUnitPriceXof] = useState(12500);
  const [launchCapitalXof, setLaunchCapitalXof] = useState(50000000);
  const [error, setError] = useState('');

  if (!open) return null;

  const toggleCountry = (code: UemoaCountryCode) => {
    setTargetCountries((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((c) => c !== code)
          : prev
        : [...prev, code]
    );
  };

  const handleSubmit = (autoRun: boolean) => {
    if (!title.trim() || !valueProposition.trim()) {
      setError('Veuillez renseigner le nom du projet et la proposition de valeur.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const newStudy: MarketStudy = {
      id: `study-${Date.now()}`,
      title: title.trim(),
      clientName: clientName.trim() || 'Direction Stratégique Client',
      sector,
      businessModel,
      targetCountries,
      primaryChannel,
      valueProposition: valueProposition.trim(),
      targetSegment:
        targetSegment.trim() || 'Ménages urbains actifs et PME des capitales économiques UEMOA.',
      createdAt: today,
      updatedAt: today,
      status: autoRun ? 'En cours' : 'Brouillon',
      missionFeeXof: 8500000 + targetCountries.length * 1400000,
      simulation: {
        unitPriceXof: Math.max(500, unitPriceXof),
        grossMarginPct: businessModel === 'B2B' ? 52 : 60,
        monthlyMarketingBudgetXof: 3000000,
        targetPenetrationPct: 2.5,
        launchCapitalXof: Math.max(5000000, launchCapitalXof),
        cacXof: businessModel === 'B2B' ? 75000 : 18000,
        purchasesPerYear: businessModel === 'B2B' ? 10 : 8,
      },
      deliverables: {},
    };

    onCreate(newStudy, autoRun);
    setTitle('');
    setClientName('');
    setValueProposition('');
    setTargetSegment('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-study-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 id="new-study-title" className="text-lg font-semibold text-slate-900">
              Ouvrir une nouvelle mission d’étude UEMOA
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Le brief est transmis simultanément aux 6 directions de KORA Études.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nom du projet ou produit
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Yelen Santé — Livraison pharmacie express"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Entreprise commanditaire
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex. Groupe Faso Logistics (Ouagadougou)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Secteur</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorId)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0F5132]"
              >
                {Object.entries(SECTOR_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Modèle économique
              </label>
              <select
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value as BusinessModelType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0F5132]"
              >
                <option value="B2C">B2C (Grand public)</option>
                <option value="B2B">B2B (Entreprises / PME)</option>
                <option value="B2B2C">B2B2C (Via marchands / réseaux)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Canal prioritaire
              </label>
              <select
                value={primaryChannel}
                onChange={(e) => setPrimaryChannel(e.target.value as DistributionChannel)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0F5132]"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Pays cibles UEMOA ({targetCountries.length} sélectionné{targetCountries.length > 1 ? 's' : ''})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {UEMOA_COUNTRIES.map((c) => {
                const active = targetCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCountry(c.code)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors whitespace-nowrap truncate ${
                      active
                        ? 'bg-[#0F5132] text-white border-[#0F5132]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Proposition de valeur & offre
            </label>
            <textarea
              rows={3}
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              placeholder="Décrivez le problème résolu, le produit/service et ce qui le distingue des offres locales actuelles..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Segment de clientèle visé
            </label>
            <input
              type="text"
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              placeholder="Ex. Jeunes cadres urbains 25-40 ans, ou PME industrielles de la zone portuaire..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Prix unitaire cible (FCFA)
              </label>
              <input
                type="number"
                min={500}
                step={500}
                value={unitPriceXof}
                onChange={(e) => setUnitPriceXof(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Capital de lancement (FCFA)
              </label>
              <input
                type="number"
                min={5000000}
                step={5000000}
                value={launchCapitalXof}
                onChange={(e) => setLaunchCapitalXof(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F5132]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Créer en brouillon
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Créer et lancer les 6 agents
          </button>
        </div>
      </div>
    </div>
  );
}
