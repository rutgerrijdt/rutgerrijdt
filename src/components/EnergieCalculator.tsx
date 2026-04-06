'use client';

import { useState, useMemo } from 'react';
import {
  calculateZonnepanelen,
  calculateIsolatie,
  calculateWarmtepomp,
  calculateEnergieLabelEffect,
  type ZonnepanelenInput,
  type IsolatieInput,
  type IsolatieType,
  type WarmtepompInput,
  type WarmtepompType,
  type EnergieLabelInput,
  type EnergieLabelType,
} from '@/lib/energie';

const fmt = (n: number, dec = 0) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec });

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

function Field({
  label, value, onChange, prefix, suffix, step = 1, min = 0, max,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 bg-white">
        {prefix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          min={min} max={max} step={step} className="flex-1 px-3 py-2 text-sm focus:outline-none" />
        {suffix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-l border-gray-200">{suffix}</span>}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color = 'green' }: { label: string; value: string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-600 font-bold-green-700',
    blue:  'bg-blue-50 border-blue-200 text-blue-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    teal:  'bg-teal-50 border-teal-200 text-teal-600',
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[color] ?? colors.green}`}>
      <div className="text-xs mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      {sub && <div className="text-xs mt-0.5 opacity-70">{sub}</div>}
    </div>
  );
}

// ─── Tab 1: Zonnepanelen ──────────────────────────────────────────────────────

function ZonnepanelenCalc() {
  const [input, setInput] = useState<ZonnepanelenInput>({
    aantalPanelen: 12,
    vermogenPerPaneel: 400,
    jaarverbruikKwh: 3500,
    kostprijsPerPaneel: 700,
    eigenVerbruikPct: 35,
    stroomprijsStijging: 3,
    levensduurJaren: 25,
    subsidie: 0,
  });

  const set = <K extends keyof ZonnepanelenInput>(k: K, v: ZonnepanelenInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateZonnepanelen(input), [input]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Installatie</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aantal panelen" value={input.aantalPanelen} onChange={(v) => set('aantalPanelen', v)} step={1} />
          <Field label="Vermogen per paneel" value={input.vermogenPerPaneel} onChange={(v) => set('vermogenPerPaneel', v)} suffix="Wp" step={10} />
          <Field label="Kostprijs per paneel (incl. installatie)" value={input.kostprijsPerPaneel} onChange={(v) => set('kostprijsPerPaneel', v)} prefix="€" step={50} />
          <Field label="Jaarverbruik woning" value={input.jaarverbruikKwh} onChange={(v) => set('jaarverbruikKwh', v)} suffix="kWh" step={100} />
          <Field label="Eigen verbruik overdag" value={input.eigenVerbruikPct} onChange={(v) => set('eigenVerbruikPct', v)} suffix="%" step={5} min={10} max={90} />
          <Field label="Stroomprijsstijging/jaar" value={input.stroomprijsStijging} onChange={(v) => set('stroomprijsStijging', v)} suffix="%" step={0.5} />
          <Field label="Subsidie (bijv. gemeente)" value={input.subsidie ?? 0} onChange={(v) => set('subsidie', v)} prefix="€" step={100} />
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 space-y-1">
          <p><strong>Totaal vermogen:</strong> {r.totaalVermogenWp.toLocaleString('nl-NL')} Wp</p>
          <p><strong>Jaaropbrengst:</strong> {r.jaarOpbrengstKwh.toFixed(0)} kWh</p>
          <p><strong>Investering:</strong> {fmt(r.investering)} (na subsidie)</p>
          <p><strong>Dekt {r.dektEigenVerbruikPct.toFixed(0)}%</strong> van uw jaarverbruik</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Resultaat</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Terugverdientijd" value={`${r.terugverdientijdJaar} jaar`} sub={`${r.terugverdientijdMaand} maanden`} color="green" />
          <Stat label="Besparing 25 jaar" value={fmt(r.besparing25jaar)} sub={`rendement op investering`} color="teal" />
          <Stat label="CO₂-besparing" value={`${r.co2BesparingKgPerJaar.toFixed(0)} kg`} sub="per jaar" color="blue" />
          <Stat label="Eigen verbruik gedekt" value={`${r.dektEigenVerbruikPct.toFixed(0)}%`} sub="van jaarverbruik" color="amber" />
        </div>

        <h4 className="text-xs font-medium text-gray-500 mb-2">Cumulatieve besparing (5-jaarsstappen)</h4>
        <div className="space-y-1">
          {r.schedule.filter((s) => s.jaar % 5 === 0 || s.jaar === 1).map((s) => (
            <div key={s.jaar} className="flex items-center gap-2">
              <div className="w-14 text-xs text-gray-500 text-right shrink-0">Jaar {s.jaar}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.cumulatieveBesparing >= 0 ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(100, Math.abs(s.cumulatieveBesparing) / r.besparing25jaar * 100)}%` }}
                />
              </div>
              <div className={`w-24 text-xs font-medium ${s.cumulatieveBesparing >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {fmt(s.cumulatieveBesparing)}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Salderingsvergoeding 2026: €0,09/kWh teruggeleverd (afgebouwd tarief)</p>
      </div>
    </div>
  );
}

// ─── Tab 2: Isolatie ──────────────────────────────────────────────────────────

function IsolatieCalc() {
  const [type, setType] = useState<IsolatieType>('dakisolatie');
  const [opp, setOpp] = useState(80);
  const [gasverbruik, setGasverbruik] = useState(1800);

  const r = useMemo(() => calculateIsolatie({ type, oppervlakteM2: opp, gasverbruikM3: gasverbruik }), [type, opp, gasverbruik]);

  const isTypes: { value: IsolatieType; label: string; icon: string }[] = [
    { value: 'dakisolatie',       label: 'Dakisolatie',            icon: '🏠' },
    { value: 'vloerisolatie',     label: 'Vloerisolatie',          icon: '⬇️' },
    { value: 'gevelisolatie',     label: 'Gevelisolatie (buiten)', icon: '🧱' },
    { value: 'spouwmuurisolatie', label: 'Spouwmuurisolatie',      icon: '🪟' },
    { value: 'hrGlas',            label: 'HR++-glas',              icon: '💧' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Type isolatie</h3>
        <div className="grid grid-cols-1 gap-2">
          {isTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition text-left ${
                type === t.value ? 'bg-green-50 border-green-400 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Oppervlakte (m²)" value={opp} onChange={setOpp} suffix="m²" step={5} />
          <Field label="Gasverbruik/jaar" value={gasverbruik} onChange={setGasverbruik} suffix="m³" step={100} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Resultaat: {r.label}</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Investering" value={fmt(r.investering)} sub={`${opp} m²`} color="amber" />
          <Stat label="ISDE Subsidie" value={fmt(r.subsidieISDE)} sub="afgetrokken" color="blue" />
          <Stat label="Netto investering" value={fmt(r.nettoInvestering)} color="green" />
          <Stat label="Besparing/jaar" value={fmt(r.jaarlijkseBesparing)} sub="op gasrekening" color="teal" />
        </div>

        <div className={`rounded-xl p-4 border ${r.terugverdientijdJaar <= 10 ? 'bg-green-50 border-green-200' : r.terugverdientijdJaar <= 20 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          <div className="text-sm font-medium text-gray-800">Terugverdientijd</div>
          <div className="text-3xl font-bold text-green-700 mt-1">
            {r.terugverdientijdJaar >= 99 ? 'Nooit' : `${r.terugverdientijdJaar.toFixed(1)} jaar`}
          </div>
          <div className="text-xs text-gray-500 mt-1">CO₂-besparing: {r.co2BesparingKgPerJaar.toFixed(0)} kg/jaar</div>
        </div>

        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          <p><strong>ISDE-subsidie 2026:</strong> Investeringssubsidie Duurzame Energie voor isolatiemaatregelen (aanvragen bij RVO).</p>
          <p className="mt-1">Energiebesparing {(r.jaarlijkseBesparing / (gasverbruik * 1.45) * 100).toFixed(0)}% op gaskosten verwarming.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Warmtepomp ────────────────────────────────────────────────────────

function WarmtepompCalc() {
  const [type, setType] = useState<WarmtepompType>('luchtWater');
  const [gasverbruik, setGasverbruik] = useState(1800);
  const [stroom, setStroom] = useState(3500);
  const [opp, setOpp] = useState(120);
  const [bouwjaar, setBouwjaar] = useState(2000);

  const input: WarmtepompInput = useMemo(() => ({ type, gasverbruikM3: gasverbruik, stroomverbruikKwh: stroom, woningOppervlak: opp, bouwjaar }), [type, gasverbruik, stroom, opp, bouwjaar]);
  const r = useMemo(() => calculateWarmtepomp(input), [input]);

  const types: { value: WarmtepompType; label: string; icon: string }[] = [
    { value: 'luchtWater', label: 'Lucht-water (meest gangbaar)', icon: '🌬️' },
    { value: 'bodemWater', label: 'Bodem-water (meest efficiënt)', icon: '🌍' },
    { value: 'luchtLucht', label: 'Lucht-lucht (goedkoopst)', icon: '💨' },
    { value: 'hybride',    label: 'Hybride (+ cv-ketel)',     icon: '🔀' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Type warmtepomp</h3>
        <div className="space-y-2">
          {types.map((t) => (
            <button key={t.value} onClick={() => setType(t.value)}
              className={`w-full flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition text-left ${
                type === t.value ? 'bg-green-50 border-green-400 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gasverbruik/jaar" value={gasverbruik} onChange={setGasverbruik} suffix="m³" step={100} />
          <Field label="Stroomverbruik/jaar" value={stroom} onChange={setStroom} suffix="kWh" step={100} />
          <Field label="Woningoppervlak" value={opp} onChange={setOpp} suffix="m²" step={10} />
          <Field label="Bouwjaar woning" value={bouwjaar} onChange={setBouwjaar} step={5} min={1900} max={2026} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">{r.label}</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Investering" value={fmt(r.investering)} color="amber" />
          <Stat label="ISDE Subsidie" value={fmt(r.subsidieISDE)} color="blue" />
          <Stat label="Netto investering" value={fmt(r.nettoInvestering)} color="green" />
          <Stat label="COP (efficiëntie)" value={`${r.cop}×`} sub="warmte per kWh stroom" color="teal" />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Huidige energiekosten</span>
            <span className="font-semibold">{fmt(r.huidigeEnergiekosten)}/jaar</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Nieuwe energiekosten</span>
            <span className="font-semibold">{fmt(r.nieuweEnergiekosten)}/jaar</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
            <span className="text-green-700">Besparing per jaar</span>
            <span className="text-green-700">{fmt(r.jaarlijkseBesparing)}</span>
          </div>
        </div>

        <div className={`rounded-xl p-4 border ${r.terugverdientijdJaar <= 12 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="text-sm font-medium text-gray-800">Terugverdientijd</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{r.terugverdientijdJaar.toFixed(1)} jaar</div>
          <div className="text-xs text-gray-500 mt-1">CO₂-besparing: {r.co2BesparingKgPerJaar.toFixed(0)} kg/jaar</div>
        </div>

        {r.toelichting && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            ⚠️ {r.toelichting}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Energielabel ──────────────────────────────────────────────────────

function EnergieLabelCalc() {
  const labels: EnergieLabelType[] = ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const [input, setInput] = useState<EnergieLabelInput>({
    huidigLabel: 'D',
    doelLabel: 'A',
    woningWaarde: 350000,
  });

  const set = <K extends keyof EnergieLabelInput>(k: K, v: EnergieLabelInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateEnergieLabelEffect(input), [input]);

  const labelColors: Record<EnergieLabelType, string> = {
    'A+++': 'bg-green-700 text-white', 'A++': 'bg-green-600 text-white',
    'A+': 'bg-green-500 text-white', 'A': 'bg-green-400 text-white',
    'B': 'bg-lime-400 text-gray-900', 'C': 'bg-yellow-400 text-gray-900',
    'D': 'bg-orange-400 text-white', 'E': 'bg-orange-500 text-white',
    'F': 'bg-red-500 text-white', 'G': 'bg-red-700 text-white',
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Energielabels vergelijken</h3>
        <div>
          <Label>Huidig label</Label>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => (
              <button key={l} onClick={() => set('huidigLabel', l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${input.huidigLabel === l ? labelColors[l] + ' ring-2 ring-offset-1 ring-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Doellabel (na verduurzaming)</Label>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => (
              <button key={l} onClick={() => set('doelLabel', l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${input.doelLabel === l ? labelColors[l] + ' ring-2 ring-offset-1 ring-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <Field label="Huidige woningwaarde" value={input.woningWaarde} onChange={(v) => set('woningWaarde', v)} prefix="€" step={5000} />

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
          <p>Gebaseerd op NVM-onderzoek naar energielabeleffect op woningwaarde (label C = referentie).</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Waarde-effect</h3>

        <div className="flex items-center justify-center gap-6 mb-6">
          <div className={`text-center px-4 py-3 rounded-xl font-bold text-2xl ${labelColors[input.huidigLabel]}`}>
            {input.huidigLabel}
            <div className="text-xs font-normal mt-1">Huidig</div>
          </div>
          <div className="text-2xl text-gray-400">→</div>
          <div className={`text-center px-4 py-3 rounded-xl font-bold text-2xl ${labelColors[input.doelLabel]}`}>
            {input.doelLabel}
            <div className="text-xs font-normal mt-1">Doel</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Huidige waarde" value={fmt(input.woningWaarde)} color="amber" />
          <Stat label="Waarde na verduurzaming" value={fmt(r.waardeNa)} color="green" />
        </div>

        <div className={`rounded-xl p-5 border text-center ${r.waardeStijging >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="text-sm font-medium text-gray-700">Waardeverandering</div>
          <div className={`text-4xl font-bold mt-2 ${r.waardeStijging >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {r.waardeStijging >= 0 ? '+' : ''}{fmt(r.waardeStijging)}
          </div>
          <div className={`text-sm mt-1 ${r.waardeStijging >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {r.pctStijging >= 0 ? '+' : ''}{r.pctStijging.toFixed(1)}% op woningwaarde
          </div>
        </div>

        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          <p><strong>Tip:</strong> Combineer zonnepanelen, isolatie en warmtepomp voor het beste resultaat. Een sprong van D naar A kan de woningwaarde met 10-15% verhogen.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'zonnepanelen' | 'isolatie' | 'warmtepomp' | 'energielabel';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'zonnepanelen', label: 'Zonnepanelen', icon: '☀️' },
  { id: 'isolatie',     label: 'Isolatie',     icon: '🏠' },
  { id: 'warmtepomp',   label: 'Warmtepomp',   icon: '♨️' },
  { id: 'energielabel', label: 'Energielabel', icon: '🏷️' },
];

export function EnergieCalculator() {
  const [tab, setTab] = useState<Tab>('zonnepanelen');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🌱</div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Energie & Verduurzaming</h2>
          <p className="text-sm text-gray-500">Zonnepanelen · Isolatie · Warmtepomp · Energielabel — 2026</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'zonnepanelen' && <ZonnepanelenCalc />}
      {tab === 'isolatie'     && <IsolatieCalc />}
      {tab === 'warmtepomp'   && <WarmtepompCalc />}
      {tab === 'energielabel' && <EnergieLabelCalc />}

      <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
        <strong>Disclaimer:</strong> Berekeningen zijn indicatief. Energieprijzen, subsidies en opbrengsten kunnen afwijken. Vraag offertes aan bij gecertificeerde installateurs. Controleer actuele ISDE-subsidies via rvo.nl.
      </div>
    </div>
  );
}
