'use client';

import { useState, useMemo } from 'react';
import {
  calculateZorgtoeslag,
  calculateHuurtoeslag,
  calculateKinderopvangtoeslag,
  calculateKinderbijslag,
  ZORG_MAX_TOESLAG_ENKEL,
  ZORG_INKOMENSGRENS_ENKEL,
  HUUR_LIBERALISATIEGRENS,
  KOT_MAX_UURPRIJS_DAGOPVANG,
  KOT_MAX_UURPRIJS_BSO,
  type ZorgtoeslagInput,
  type HuurtoeslagInput,
  type KinderopvangInput,
  type KindOpvang,
  type KinderopvangType,
} from '@/lib/toeslagen';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmt2 = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

type ToeslagTab = 'zorgtoeslag' | 'huurtoeslag' | 'kinderopvang' | 'kinderbijslag';

export function ToelagenCalculator() {
  const [tab, setTab] = useState<ToeslagTab>('zorgtoeslag');

  const tabs: { id: ToeslagTab; label: string; icon: string }[] = [
    { id: 'zorgtoeslag',  label: 'Zorgtoeslag',       icon: '🏥' },
    { id: 'huurtoeslag',  label: 'Huurtoeslag',        icon: '🏡' },
    { id: 'kinderopvang', label: 'Kinderopvangtoeslag', icon: '👶' },
    { id: 'kinderbijslag',label: 'Kinderbijslag',      icon: '🧒' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Toeslagen 2026</h2>
        <p className="text-sm text-gray-500 mt-0.5">Bereken uw recht op zorgtoeslag, huurtoeslag, kinderopvangtoeslag en kinderbijslag</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'zorgtoeslag'  && <ZorgtoeslagPanel />}
      {tab === 'huurtoeslag'  && <HuurtoeslagPanel />}
      {tab === 'kinderopvang' && <KinderopvangPanel />}
      {tab === 'kinderbijslag'&& <KinderbijslagPanel />}
    </div>
  );
}

// ─── Zorgtoeslag ────────────────────────────────────────────
function ZorgtoeslagPanel() {
  const [inkomen, setInkomen] = useState(28000);
  const [heeftPartner, setHeeftPartner] = useState(false);
  const [partnerInkomen, setPartnerInkomen] = useState(0);

  const result = useMemo(() =>
    calculateZorgtoeslag({ toetsingsinkomen: inkomen, partnerInkomen, heeftPartner }),
    [inkomen, heeftPartner, partnerInkomen]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Gegevens</h3>

        <SliderField
          label="Toetsingsinkomen"
          value={inkomen}
          onChange={setInkomen}
          min={0} max={80000} step={500}
          sub={`Max voor toeslag: €${ZORG_INKOMENSGRENS_ENKEL.toLocaleString('nl-NL')} (alleenstaand)`}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={heeftPartner}
            onChange={e => setHeeftPartner(e.target.checked)} className="rounded" />
          <span className="text-sm text-gray-700">Fiscale partner</span>
        </label>

        {heeftPartner && (
          <SliderField
            label="Inkomen partner"
            value={partnerInkomen}
            onChange={setPartnerInkomen}
            min={0} max={80000} step={500}
          />
        )}
      </div>

      <div className="space-y-3">
        <ResultHeader
          recht={result.recht}
          title={result.recht ? 'Recht op zorgtoeslag' : 'Geen recht op zorgtoeslag'}
          reden={result.redenGeenRecht}
        />

        {result.recht && (
          <div className="grid grid-cols-2 gap-3">
            <ToeslagCard label="Maandtoeslag" value={fmt(result.maandToeslag)} highlight color="green" />
            <ToeslagCard label="Jaartoeslag" value={fmt(result.jaarToeslag)} />
            <ToeslagCard label="Netto zorgpremie" value={fmt(result.nettoPremie)} sub="per maand na toeslag" />
            <ToeslagCard
              label="Dekking"
              value={`${Math.round((result.jaarToeslag / (1962)) * 100)}%`}
              sub="van standaard premie"
            />
          </div>
        )}

        {/* Inkomensvisualisatie */}
        <IncomeBar
          label="Inkomen t.o.v. grens"
          value={inkomen + (heeftPartner ? partnerInkomen : 0)}
          max={heeftPartner ? 53130 : 35941}
          color="green"
        />

        <InfoList items={result.toelichting} />
      </div>
    </div>
  );
}

// ─── Huurtoeslag ────────────────────────────────────────────
function HuurtoeslagPanel() {
  const [maandHuur, setMaandHuur] = useState(750);
  const [inkomen, setInkomen] = useState(22000);
  const [aantalPersonen, setAantalPersonen] = useState(1);

  const result = useMemo(() =>
    calculateHuurtoeslag({
      maandHuur, toetsingsinkomen: inkomen,
      aantalPersonen, leeftijdsCategorie: 'oud', heeftAow: false,
    }),
    [maandHuur, inkomen, aantalPersonen]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Gegevens</h3>

        <SliderField
          label={`Maandhuur: ${fmt(maandHuur)}`}
          value={maandHuur}
          onChange={setMaandHuur}
          min={200} max={1000} step={10}
          sub={`Max voor toeslag: €${HUUR_LIBERALISATIEGRENS}/mnd (liberalisatiegrens)`}
        />

        <SliderField
          label="Toetsingsinkomen (gezamenlijk)"
          value={inkomen}
          onChange={setInkomen}
          min={0} max={50000} step={500}
        />

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Huishoudgrootte</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button key={n}
                onClick={() => setAantalPersonen(n)}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                  aantalPersonen === n ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}{n === 4 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <ResultHeader
          recht={result.recht}
          title={result.recht ? 'Recht op huurtoeslag' : 'Geen recht op huurtoeslag'}
          reden={result.redenGeenRecht}
        />

        {result.recht && (
          <div className="grid grid-cols-2 gap-3">
            <ToeslagCard label="Maandtoeslag" value={fmt(result.maandToeslag)} highlight color="green" />
            <ToeslagCard label="Jaartoeslag" value={fmt(result.jaarToeslag)} />
            <ToeslagCard label="Netto huur" value={fmt(result.nettoHuur)} sub="per maand na toeslag" />
            <ToeslagCard
              label="Besparing"
              value={`${maandHuur > 0 ? Math.round((result.maandToeslag / maandHuur) * 100) : 0}%`}
              sub="van huur vergoed"
            />
          </div>
        )}

        <IncomeBar
          label="Huur t.o.v. liberalisatiegrens"
          value={maandHuur}
          max={HUUR_LIBERALISATIEGRENS}
          color="green"
          alert={maandHuur > HUUR_LIBERALISATIEGRENS}
        />

        <InfoList items={result.toelichting} />
      </div>
    </div>
  );
}

// ─── Kinderopvangtoeslag ─────────────────────────────────────
function KinderopvangPanel() {
  const [inkomen, setInkomen] = useState(55000);
  const [kinderen, setKinderen] = useState<KindOpvang[]>([
    { type: 'dagopvang', urenPerMaand: 180, werkelijkeUurprijs: KOT_MAX_UURPRIJS_DAGOPVANG, isEersteKind: true },
  ]);

  const input: KinderopvangInput = { toetsingsinkomen: inkomen, kinderen };
  const result = useMemo(() => calculateKinderopvangtoeslag(input), [input]);

  const addKind = () => {
    setKinderen(prev => [
      ...prev,
      { type: 'dagopvang', urenPerMaand: 130, werkelijkeUurprijs: KOT_MAX_UURPRIJS_DAGOPVANG, isEersteKind: false },
    ]);
  };

  const removeKind = (i: number) => setKinderen(prev => prev.filter((_, idx) => idx !== i));

  const updateKind = (i: number, updates: Partial<KindOpvang>) => {
    setKinderen(prev => prev.map((k, idx) => idx === i ? { ...k, ...updates } : k));
  };

  const typeLabels: Record<KinderopvangType, string> = {
    dagopvang: 'Dagopvang',
    bso: 'BSO',
    gastouder: 'Gastouder',
  };

  return (
    <div className="space-y-4">
      <SliderField
        label="Gezamenlijk toetsingsinkomen"
        value={inkomen}
        onChange={setInkomen}
        min={0} max={150000} step={1000}
      />

      {/* Kinderen */}
      {kinderen.map((kind, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Kind {i + 1} — {result.kinderen[i] ? `${result.kinderen[i].vergoedinsgPercentage}% vergoeding` : ''}
            </h4>
            {i > 0 && (
              <button onClick={() => removeKind(i)}
                className="text-red-500 text-xs hover:text-red-700">Verwijderen</button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={kind.type}
                onChange={e => updateKind(i, { type: e.target.value as KinderopvangType })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {(Object.keys(typeLabels) as KinderopvangType[]).map(t => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Uren/maand</label>
              <input type="number" value={kind.urenPerMaand}
                onChange={e => updateKind(i, { urenPerMaand: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Uurprijs (€)</label>
              <input type="number" step="0.01" value={kind.werkelijkeUurprijs}
                onChange={e => updateKind(i, { werkelijkeUurprijs: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex flex-col justify-end">
              {result.kinderen[i] && (
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-green-600">Toeslag</p>
                  <p className="text-base font-bold text-green-700">{fmt(result.kinderen[i].maandToeslag)}</p>
                  <p className="text-xs text-green-500">Eigen: {fmt(result.kinderen[i].eigenBijdrage)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <button onClick={addKind}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition">
        + Kind toevoegen
      </button>

      {/* Totaal */}
      <div className="border border-green-200 rounded-xl overflow-hidden">
        <div className="bg-green-600 px-4 py-3">
          <h3 className="text-white font-semibold text-sm">Totaaloverzicht</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <ToeslagCard label="Totale kosten" value={fmt(result.totaalMaandKosten)} sub="per maand" />
            <ToeslagCard label="Totale toeslag" value={fmt(result.totaalMaandToeslag)} highlight color="green" />
            <ToeslagCard label="Eigen bijdrage" value={fmt(result.totaalEigenBijdrage)} sub="per maand" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">Jaartoeslag</p>
              <p className="font-bold text-gray-800">{fmt(result.totaalMaandToeslag * 12)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">Jaarlijkse eigen bijdrage</p>
              <p className="font-bold text-gray-800">{fmt(result.totaalEigenBijdrage * 12)}</p>
            </div>
          </div>
        </div>
      </div>

      <InfoList items={result.toelichting} />
    </div>
  );
}

// ─── Kinderbijslag ───────────────────────────────────────────
function KinderbijslagPanel() {
  const [kinderen, setKinderen] = useState([{ leeftijd: 4 }, { leeftijd: 8 }]);

  const result = useMemo(() => calculateKinderbijslag(kinderen), [kinderen]);

  const addKind = () => setKinderen(prev => [...prev, { leeftijd: 6 }]);
  const removeKind = (i: number) => setKinderen(prev => prev.filter((_, idx) => idx !== i));
  const updateLeeftijd = (i: number, leeftijd: number) =>
    setKinderen(prev => prev.map((k, idx) => idx === i ? { leeftijd } : k));

  const leeftijdLabel = (l: number) =>
    l < 6 ? '0–5 jaar' : l < 12 ? '6–11 jaar' : l < 18 ? '12–17 jaar' : '18+ (geen AKW)';

  const getBedrag = (l: number) =>
    l < 6 ? 308.18 : l < 12 ? 373.36 : l < 18 ? 438.55 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Kinderen</h3>
        <p className="text-xs text-gray-500">Kinderbijslag wordt per kwartaal uitbetaald voor kinderen t/m 17 jaar.</p>

        {kinderen.map((kind, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Leeftijd kind {i + 1}</label>
              <input
                type="number" min={0} max={25} value={kind.leeftijd}
                onChange={e => updateLeeftijd(i, Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">{leeftijdLabel(kind.leeftijd)}</p>
              <p className="text-sm font-bold text-green-700">{fmt2(getBedrag(kind.leeftijd))}</p>
              <p className="text-xs text-gray-400">per kwartaal</p>
            </div>
            {kinderen.length > 1 && (
              <button onClick={() => removeKind(i)} className="text-red-400 hover:text-red-600 text-sm">×</button>
            )}
          </div>
        ))}

        <button onClick={addKind}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition">
          + Kind toevoegen
        </button>
      </div>

      <div className="space-y-3">
        <div className="border border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-600 px-4 py-3">
            <h3 className="text-white font-semibold text-sm">Kinderbijslag (AKW) 2026</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <ToeslagCard label="Per kwartaal" value={fmt2(result.kwartaalbedrag)} highlight color="green" />
              <ToeslagCard label="Per maand" value={fmt2(result.maandbedrag)} sub="indicatief" />
              <ToeslagCard label="Per jaar" value={fmt2(result.kwartaalbedrag * 4)} />
              <ToeslagCard label="Aantal kinderen" value={`${result.aantalKinderen}`} sub="met recht op AKW" />
            </div>

            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-800 space-y-1">
              <p className="font-medium">Uitbetalingsdata 2026</p>
              <p>1e kwartaal: april | 2e: juli | 3e: oktober | 4e: januari 2027</p>
              <p className="text-green-600 mt-1">Kinderbijslag is inkomensOnafhankelijk — iedereen heeft hier recht op</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tarieventabel AKW 2026</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-500 pb-1">Leeftijd</th>
                <th className="text-right text-xs text-gray-500 pb-1">Per kwartaal</th>
                <th className="text-right text-xs text-gray-500 pb-1">Per jaar</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              {[
                { groep: '0–5 jaar',   bedrag: 308.18 },
                { groep: '6–11 jaar',  bedrag: 373.36 },
                { groep: '12–17 jaar', bedrag: 438.55 },
              ].map(r => (
                <tr key={r.groep} className="border-b border-gray-50">
                  <td className="py-1 text-gray-700">{r.groep}</td>
                  <td className="py-1 text-right font-medium">{fmt2(r.bedrag)}</td>
                  <td className="py-1 text-right text-gray-500">{fmt2(r.bedrag * 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────

function SliderField({
  label, value, onChange, min, max, step, sub,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; sub?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-bold text-gray-800">{value.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-green-600" />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{min.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
        <span>{max.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ResultHeader({ recht, title, reden }: { recht: boolean; title: string; reden?: string }) {
  return (
    <div className={`rounded-xl p-4 border ${recht ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{recht ? '✅' : '❌'}</span>
        <div>
          <p className={`font-semibold text-sm ${recht ? 'text-green-800' : 'text-red-800'}`}>{title}</p>
          {reden && <p className="text-xs text-gray-600 mt-0.5">{reden}</p>}
        </div>
      </div>
    </div>
  );
}

function IncomeBar({
  label, value, max, color, alert,
}: {
  label: string; value: number; max: number; color: string; alert?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${alert ? 'bg-red-400' : 'bg-green-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ToeslagCard({
  label, value, sub, highlight, color = 'blue',
}: {
  label: string; value: string; sub?: string; highlight?: boolean; color?: string;
}) {
  const bg = highlight
    ? color === 'green' ? 'bg-green-50' : 'bg-blue-50'
    : 'bg-gray-50';
  const textColor = highlight
    ? color === 'green' ? 'text-green-700' : 'text-blue-700'
    : 'text-gray-800';
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function InfoList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs text-blue-800">
          <span className="mt-0.5">ℹ️</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}
