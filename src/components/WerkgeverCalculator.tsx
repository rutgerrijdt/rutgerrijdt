'use client';

import { useState, useMemo } from 'react';
import {
  calculateWerkgeverskosten,
  calculateBVOptimalisatie,
  calculateJaarruimte,
  DGA_GEBRUIKELIJK_LOON_MIN,
  VPB_TARIEF_LAAG,
  BOX2_TARIEF_1,
  type WerkgeverskosenInput,
  type ContractType,
} from '@/lib/werkgever';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

type WTab = 'werkgeverskosten' | 'bv_dga' | 'jaarruimte';

export function WerkgeverCalculator() {
  const [tab, setTab] = useState<WTab>('werkgeverskosten');
  const tabs = [
    { id: 'werkgeverskosten' as WTab, label: 'Werkgeverskosten',   icon: '👔' },
    { id: 'bv_dga'           as WTab, label: 'BV/DGA Optimalisatie', icon: '🏢' },
    { id: 'jaarruimte'       as WTab, label: 'Lijfrente Jaarruimte', icon: '📋' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Werkgever & Ondernemer</h2>
        <p className="text-sm text-gray-500 mt-0.5">Werkgeverskosten, BV/DGA salaris vs dividend, lijfrente jaarruimte 2026</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>
      {tab === 'werkgeverskosten' && <WerkgeverkostenPanel />}
      {tab === 'bv_dga'           && <BVDGAPanel />}
      {tab === 'jaarruimte'       && <JaarruimtePanel />}
    </div>
  );
}

// ─── Werkgeverskosten ────────────────────────────────────────
function WerkgeverkostenPanel() {
  const [salaris, setSalaris] = useState(4000);
  const [contract, setContract] = useState<ContractType>('vast');
  const [vakantiegeld, setVakantiegeld] = useState(false);
  const [reiskosten, setReiskosten] = useState(200);
  const [pensioen, setPensioen] = useState(300);
  const [bonus, setBonus] = useState(0);

  const input: WerkgeverskosenInput = {
    brutoMaandSalaris: salaris,
    contractType: contract,
    inclusiefVakantiegeld: vakantiegeld,
    reiskostenMaand: reiskosten,
    pensioenBijdrageMaand: pensioen,
    bonusMaand: bonus,
  };
  const r = useMemo(() => calculateWerkgeverskosten(input), [input]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Werknemer gegevens</h3>
          <SF label="Bruto maandsalaris" value={salaris} onChange={setSalaris} min={500} max={20000} step={100} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contractvorm</label>
            <div className="flex gap-2">
              {(['vast','flex','oproep'] as ContractType[]).map(c => (
                <button key={c} onClick={() => setContract(c)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition capitalize ${contract === c ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={vakantiegeld} onChange={e => setVakantiegeld(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Vakantiegeld inbegrepen in salaris</span>
          </label>
          <SF label="Reiskosten (werkgever, /mnd)" value={reiskosten} onChange={setReiskosten} min={0} max={1000} step={10} />
          <SF label="Pensioenbijdrage werkgever (/mnd)" value={pensioen} onChange={setPensioen} min={0} max={2000} step={50} />
          <SF label="Gemiddelde bonus (/mnd)" value={bonus} onChange={setBonus} min={0} max={5000} step={50} />
        </div>
        <div className="space-y-3">
          <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 text-center">
            <p className="text-xs text-violet-600 mb-1">Totale loonkosten per jaar</p>
            <p className="text-3xl font-bold text-violet-800">{fmt(r.totaalLoonkosten)}</p>
            <p className="text-sm text-violet-600 mt-1">Factor {r.factor}× bruto | {fmt(r.perUur)}/uur</p>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-violet-600 px-4 py-2"><h4 className="text-white text-xs font-semibold">Kostenoverzicht</h4></div>
            <div className="p-3 space-y-1.5 text-sm">
              <CR label="Bruto jaarsalaris" value={fmt(r.brutoSalaris)} />
              {r.vakantiegeld > 0 && <CR label="Vakantiegeld (8%)" value={fmt(r.vakantiegeld)} />}
              <div className="border-t border-gray-100 pt-1.5 mt-1">
                <p className="text-xs text-gray-500 mb-1">Werkgeverspremies</p>
                <CR label="WW-premie" value={fmt(r.wwPremie)} gray />
                <CR label="WIA/Aof-premie" value={fmt(r.wiaAofPremie)} gray />
                <CR label="ZVW werkgever" value={fmt(r.zvwHeffing)} gray />
                <CR label="Sectorfonds" value={fmt(r.sectorFonds)} gray />
                <CR label="Totaal premies" value={fmt(r.totaalPremies)} sub />
              </div>
              {r.pensioenbijdrage > 0 && <CR label="Pensioenbijdrage" value={fmt(r.pensioenbijdrage)} />}
              {r.reiskosten > 0 && <CR label="Reiskosten" value={fmt(r.reiskosten)} />}
              {r.bonus > 0 && <CR label="Bonus" value={fmt(r.bonus)} />}
              <div className="border-t border-gray-100 pt-1.5">
                <CR label="TOTAAL loonkosten" value={fmt(r.totaalLoonkosten)} bold />
              </div>
            </div>
          </div>
          <InfoL items={r.toelichting} color="violet" />
        </div>
      </div>
    </div>
  );
}

// ─── BV/DGA ──────────────────────────────────────────────────
function BVDGAPanel() {
  const [bvWinst, setBvWinst] = useState(150000);
  const [dgaSalaris, setDgaSalaris] = useState(DGA_GEBRUIKELIJK_LOON_MIN);

  const r = useMemo(() => calculateBVOptimalisatie({
    bvWinstVoorBelasting: bvWinst,
    dgaSalaris,
    partnerHeeftSalaris: false,
    partnerSalaris: 0,
  }), [bvWinst, dgaSalaris]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">BV & DGA gegevens</h3>
          <SF label="BV-winst vóór DGA-loon en VPB" value={bvWinst} onChange={setBvWinst} min={50000} max={1000000} step={5000} />
          <div>
            <SF label={`DGA-salaris (min €${DGA_GEBRUIKELIJK_LOON_MIN.toLocaleString('nl-NL')})`} value={dgaSalaris} onChange={v => setDgaSalaris(Math.max(v, DGA_GEBRUIKELIJK_LOON_MIN))} min={DGA_GEBRUIKELIJK_LOON_MIN} max={bvWinst} step={1000} />
            <p className="text-xs text-gray-400 mt-0.5">Gebruikelijk loon minimum 2026: {fmt(DGA_GEBRUIKELIJK_LOON_MIN)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p className="font-medium">Tarieven 2026</p>
            <p>VPB: {(VPB_TARIEF_LAAG*100)}% (t/m €200k) | 25,8% (daarboven)</p>
            <p>Box 2: {(BOX2_TARIEF_1*100).toFixed(2)}% (t/m €67k) | 33,15% (daarboven)</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 text-center">
            <p className="text-xs text-violet-600 mb-1">Totaal netto inkomen</p>
            <p className="text-3xl font-bold text-violet-800">{fmt(r.totaalNetto)}</p>
            <p className="text-sm text-violet-600 mt-1">Effectief tarief: {fmtPct(r.effectiefTarief)}</p>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-violet-600 px-4 py-2"><h4 className="text-white text-xs font-semibold">Verdeling</h4></div>
            <div className="p-3 space-y-1.5 text-sm">
              <p className="text-xs text-gray-500 font-medium">DGA-loon (Box 1)</p>
              <CR label="Bruto salaris" value={fmt(dgaSalaris)} />
              <CR label="Inkomstenbelasting" value={`-${fmt(r.dgaLoonBelasting)}`} red />
              <CR label="Netto salaris" value={fmt(r.dgaLoonNetto)} bold />
              <div className="border-t border-gray-100 pt-1.5 mt-1">
                <p className="text-xs text-gray-500 font-medium">BV Winst en Dividend (Box 2)</p>
                <CR label="BV-winst na DGA-loon" value={fmt(r.bvWinstNaDga)} />
                <CR label="Vennootschapsbelasting" value={`-${fmt(r.vpbBelasting)}`} red />
                <CR label="Netto BV-winst" value={fmt(r.bvNettoWinst)} />
                <CR label="Dividendbelasting (Box 2)" value={`-${fmt(r.dividendBelasting)}`} red />
                <CR label="Netto dividend" value={fmt(r.dividendNetto)} bold />
              </div>
              <div className="border-t border-gray-100 pt-1.5">
                <CR label="Totaal netto" value={fmt(r.totaalNetto)} bold blue />
                <CR label="Totale belasting" value={fmt(r.totaalBelasting)} red />
              </div>
            </div>
          </div>
          <InfoL items={r.toelichting} color="violet" />
        </div>
      </div>
    </div>
  );
}

// ─── Lijfrente Jaarruimte ────────────────────────────────────
function JaarruimtePanel() {
  const [inkomen, setInkomen] = useState(65000);
  const [factorA, setFactorA] = useState(5000);
  const [reserveringsjaren, setReserveringsjaren] = useState(0);

  const r = useMemo(() => calculateJaarruimte({
    brutoJaarinkomen: inkomen,
    pensioenaangroei: factorA,
    ouderdomspensioenOpgebouwd: 0,
    leeftijd: 45,
    reserveringsruimteJaren: reserveringsjaren,
  }), [inkomen, factorA, reserveringsjaren]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Jaarruimte 2026</h3>
        <SF label="Bruto jaarinkomen" value={inkomen} onChange={setInkomen} min={10000} max={300000} step={1000} />
        <div>
          <SF label="Factor A (pensioenaangroei)" value={factorA} onChange={setFactorA} min={0} max={50000} step={100} />
          <p className="text-xs text-gray-400 mt-0.5">Zie jaaropgave pensioenfonds — 0 bij geen werkgeverspensioen</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reserveringsruimte (jaren terug): {reserveringsjaren}</label>
          <input type="range" min={0} max={10} step={1} value={reserveringsjaren}
            onChange={e => setReserveringsjaren(Number(e.target.value))} className="w-full accent-violet-600" />
          <p className="text-xs text-gray-400 mt-0.5">Onbenutte jaarruimte terug inhalen (max 10 jaar)</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
          <p className="font-medium">Formule jaarruimte 2026</p>
          <p>= 30% × (inkomen − €15.028) − 6,27 × Factor A</p>
          <p className="text-gray-400">Maximum: €36.077 per jaar</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 text-center">
          <p className="text-xs text-violet-600 mb-1">Totaal aftrekbaar dit jaar</p>
          <p className="text-3xl font-bold text-violet-800">{fmt(r.totaalAftrekbaar)}</p>
          <p className="text-sm text-violet-600 mt-1">Nettokosten na belastingvoordeel: {fmt(r.nettoInleg)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <WCard label="Jaarruimte" value={fmt(r.jaarruimte)} highlight />
          <WCard label="Reserveringsruimte" value={fmt(r.reserveringsruimte)} sub="onbenutte jaren" />
          <WCard label="Belastingvoordeel" value={fmt(r.belastingvoordeel)} highlight />
          <WCard label="Netto inleg" value={fmt(r.nettoInleg)} sub="kosten na aftrek" />
        </div>
        <div className="border border-gray-200 rounded-xl p-3 text-sm space-y-1">
          <CR label="Premie-grondslag" value={fmt(r.premieGrondslag)} />
          <CR label="30% × grondslag" value={fmt(Math.round(r.premieGrondslag * 0.30))} />
          <CR label="Af: 6,27 × Factor A" value={`-${fmt(Math.round(factorA * 6.27))}`} red />
          <div className="border-t pt-1"><CR label="Jaarruimte" value={fmt(r.jaarruimte)} bold /></div>
        </div>
        <InfoL items={r.toelichting} color="violet" />
      </div>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────
function SF({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-bold text-gray-800">{value.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-violet-600" />
    </div>
  );
}
function WCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-violet-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-violet-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
function CR({ label, value, bold, red, gray, sub, blue }: {
  label: string; value: string; bold?: boolean; red?: boolean; gray?: boolean; sub?: boolean; blue?: boolean;
}) {
  return (
    <div className={`flex justify-between py-0.5 ${sub ? 'text-xs text-gray-500' : 'text-sm'}`}>
      <span className={`${red?'text-red-600':gray?'text-gray-500':'text-gray-700'} ${bold?'font-semibold':''}`}>{label}</span>
      <span className={`font-medium tabular-nums ${red?'text-red-600':blue?'text-violet-700':'text-gray-800'} ${bold?'font-bold':''}`}>{value}</span>
    </div>
  );
}
function InfoL({ items, color='blue' }: { items: string[]; color?: string }) {
  if (!items.length) return null;
  const cls = color === 'violet' ? 'bg-violet-50 border-violet-200 text-violet-800' : 'bg-blue-50 border-blue-200 text-blue-800';
  return (
    <div className={`${cls} border rounded-xl p-3 space-y-1`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs">
          <span className="mt-0.5">ℹ️</span><span>{item}</span>
        </div>
      ))}
    </div>
  );
}
