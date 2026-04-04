'use client';

import { useState, useMemo } from 'react';
import {
  calculateOversluiten,
  calculateInflatie,
  calculateAOW,
  calculateReiskosten,
  REISKOSTEN_ONBELAST_AUTO,
  AOW_NETTO_ALLEENSTAAND,
  type OversluitenInput,
  type InflatieInput,
} from '@/lib/extra';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

type ETab = 'oversluiten' | 'inflatie' | 'aow' | 'reiskosten';

export function ExtraCalculator() {
  const [tab, setTab] = useState<ETab>('oversluiten');
  const tabs = [
    { id: 'oversluiten' as ETab, label: 'Hypotheek oversluiten', icon: '🔄' },
    { id: 'inflatie'    as ETab, label: 'Inflatie & koopkracht',  icon: '📊' },
    { id: 'aow'         as ETab, label: 'AOW-datum',             icon: '🌅' },
    { id: 'reiskosten'  as ETab, label: 'Reiskosten',            icon: '🚆' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Extra Berekeningen</h2>
        <p className="text-sm text-gray-500 mt-0.5">Hypotheek oversluiten, inflatie, AOW-datum en reiskosten 2026</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>
      {tab === 'oversluiten' && <OversluitenPanel />}
      {tab === 'inflatie'    && <InflatiePanel />}
      {tab === 'aow'         && <AOWPanel />}
      {tab === 'reiskosten'  && <ReiskostenPanel />}
    </div>
  );
}

// ─── Hypotheek Oversluiten ───────────────────────────────────
function OversluitenPanel() {
  const [saldo, setSaldo] = useState(250000);
  const [huidigeRente, setHuidigeRente] = useState(4.5);
  const [nieuweRente, setNieuweRente] = useState(3.8);
  const [looptijd, setLooptijd] = useState(240);
  const [boeterente, setBoeterente] = useState(5000);
  const [notaris, setNotaris] = useState(1500);
  const [advies, setAdvies] = useState(2500);

  const r = useMemo(() => calculateOversluiten({
    huidigSaldo: saldo,
    huidigeRente: huidigeRente / 100,
    nieuweRente: nieuweRente / 100,
    resterendeLooptijdMaanden: looptijd,
    boeterente,
    notariskosten: notaris,
    advieskosten: advies,
  }), [saldo, huidigeRente, nieuweRente, looptijd, boeterente, notaris, advies]);

  const voordelig = r.maandelijksBesparing > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Hypotheekgegevens</h3>
          <TF label="Resterende schuld" value={saldo} onChange={setSaldo} min={10000} max={1000000} step={5000} />
          <NF label="Huidige rente (%)" value={huidigeRente} onChange={setHuidigeRente} step={0.1} />
          <NF label="Nieuwe rente (%)" value={nieuweRente} onChange={setNieuweRente} step={0.1} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Resterende looptijd: {Math.floor(looptijd/12)} jr {looptijd%12} mnd</label>
            <input type="range" min={12} max={360} step={12} value={looptijd}
              onChange={e => setLooptijd(Number(e.target.value))} className="w-full accent-teal-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 pt-2 border-t border-gray-100">Oversluitkosten</h3>
          <TF label="Boeterente" value={boeterente} onChange={setBoeterente} min={0} max={50000} step={500} />
          <TF label="Notaris + taxatie" value={notaris} onChange={setNotaris} min={0} max={5000} step={100} />
          <TF label="Advieskosten" value={advies} onChange={setAdvies} min={0} max={5000} step={100} />
        </div>
        <div className="space-y-3">
          <div className={`rounded-xl border p-4 ${voordelig ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`font-semibold text-sm ${voordelig ? 'text-teal-800' : 'text-red-800'}`}>
              {voordelig ? 'Oversluiten kan voordelig zijn' : 'Oversluiten is op dit moment niet voordelig'}
            </p>
            {r.breakEvenMaanden && voordelig && (
              <p className="text-xs text-gray-600 mt-1">Terugverdientijd: {r.breakEvenMaanden} maanden ({(r.breakEvenMaanden/12).toFixed(1)} jaar)</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ECard label="Huidige maandlast" value={fmt(r.huidigeMaandlast)} />
            <ECard label="Nieuwe maandlast" value={fmt(r.nieuweMaandlast)} />
            <ECard label="Besparing/mnd" value={fmt(r.maandelijksBesparing)} highlight={voordelig} />
            <ECard label="Oversluitkosten" value={fmt(r.eenmaligeTotalKosten)} />
          </div>
          <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
            <h4 className="text-xs font-semibold text-gray-600">Netto besparing na kosten</h4>
            <CR label="Na 5 jaar" value={fmt(r.netBesparing5Jaar)} bold={r.netBesparing5Jaar > 0} />
            <CR label="Na 10 jaar" value={fmt(r.netBesparing10Jaar)} bold={r.netBesparing10Jaar > 0} green={r.netBesparing10Jaar > 0} red={r.netBesparing10Jaar < 0} />
            <CR label="Hele looptijd" value={fmt(r.netBessparing30Jaar)} bold={r.netBessparing30Jaar > 0} green={r.netBessparing30Jaar > 0} />
          </div>
          <InfoL items={r.toelichting} />
        </div>
      </div>
    </div>
  );
}

// ─── Inflatie & Koopkracht ───────────────────────────────────
function InflatiePanel() {
  const [bedrag, setBedrag] = useState(50000);
  const [inflatie, setInflatie] = useState(2.5);
  const [jaren, setJaren] = useState(20);
  const [loonstijging, setLoonstijging] = useState(2.0);

  const r = useMemo(() => calculateInflatie({
    bedrag,
    inflatiePercent: inflatie,
    aantalJaren: jaren,
    salarisstijgingPercent: loonstijging,
  }), [bedrag, inflatie, jaren, loonstijging]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Parameters</h3>
          <TF label="Bedrag / salaris vandaag" value={bedrag} onChange={setBedrag} min={1000} max={500000} step={1000} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Inflatie: {inflatie.toFixed(1)}% per jaar</label>
            <input type="range" min={0} max={10} step={0.1} value={inflatie}
              onChange={e => setInflatie(Number(e.target.value))} className="w-full accent-teal-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0%</span><span className="text-teal-600">ECB-doel 2%</span><span>10%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Loonstijging: {loonstijging.toFixed(1)}% per jaar</label>
            <input type="range" min={0} max={10} step={0.1} value={loonstijging}
              onChange={e => setLoonstijging(Number(e.target.value))} className="w-full accent-teal-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Horizon: {jaren} jaar</label>
            <input type="range" min={1} max={40} step={1} value={jaren}
              onChange={e => setJaren(Number(e.target.value))} className="w-full accent-teal-600" />
          </div>
        </div>
        <div className="space-y-3">
          <div className={`rounded-xl border p-4 ${r.reeleJaarlijkseStijging >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-gray-600 mb-1">Reële koopkrachtontwikkeling per jaar</p>
            <p className={`text-2xl font-bold ${r.reeleJaarlijkseStijging >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
              {r.reeleJaarlijkseStijging >= 0 ? '+' : ''}{r.reeleJaarlijkseStijging.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {r.reeleJaarlijkseStijging >= 0 ? 'Koopkracht neemt toe' : 'Koopkracht neemt af'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ECard label={`Waarde over 1 jr`} value={fmt(r.waardeNuOver1Jaar)} sub="in huidige euro's" />
            <ECard label={`Waarde over 5 jr`} value={fmt(r.waardeNuOver5Jaar)} sub="in huidige euro's" />
            <ECard label={`Waarde over 10 jr`} value={fmt(r.waardeNuOver10Jaar)} sub="in huidige euro's" />
            <ECard
              label={`Na ${jaren} jr koopkracht`}
              value={`${r.cumulatiefKoopkrachtVerliesPct >= 0 ? '+' : ''}${r.cumulatiefKoopkrachtVerliesPct.toFixed(1)}%`}
              highlight={r.cumulatiefKoopkrachtVerliesPct >= 0}
            />
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">Reële koopkracht over tijd</h4>
            <div className="space-y-1.5">
              {r.jaarlijks.filter(j => j.jaar % 5 === 0 || j.jaar === 1 || j.jaar === jaren).map(j => {
                const pct = Math.min(100, (j.koopkrachtWaarde / bedrag) * 100);
                return (
                  <div key={j.jaar} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-10 text-right">Yr {j.jaar}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                      <div className={`h-full rounded ${pct >= 100 ? 'bg-teal-400' : 'bg-orange-400'}`} style={{width:`${pct}%`}} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 text-right">{fmt(j.koopkrachtWaarde)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AOW Datum ───────────────────────────────────────────────
function AOWPanel() {
  const [geboortedatum, setGeboortedatum] = useState('1985-06-15');

  const r = useMemo(() => {
    try { return calculateAOW({ geboortedatum }); }
    catch { return null; }
  }, [geboortedatum]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">AOW-datum berekenen</h3>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Geboortedatum</label>
          <input type="date" value={geboortedatum}
            onChange={e => setGeboortedatum(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
          <p className="font-medium">AOW-leeftijdsschema</p>
          <p>Geboren vóór 1955: 65 jaar</p>
          <p>Geboren 1955–1957: 66 jaar + maanden</p>
          <p>Geboren 1958+: 67 jaar + maanden</p>
          <p className="text-gray-400 mt-1">Kan stijgen bij hogere levensverwachting</p>
        </div>
      </div>
      {r && (
        <div className="space-y-3">
          <div className="border border-teal-200 bg-teal-50 rounded-xl p-5 text-center">
            <p className="text-xs text-teal-600 mb-2">AOW-datum</p>
            <p className="text-2xl font-bold text-teal-800">{r.aowDatumString}</p>
            <p className="text-sm text-teal-600 mt-1">
              {r.aantalMaandenTot > 0
                ? `Nog ${r.aantalJarenTot} jaar en ${r.aantalMaandenTot % 12} maanden`
                : 'U heeft de AOW-leeftijd al bereikt'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ECard label="AOW-leeftijd" value={`${r.aowLeeftijd.jaren} jr ${r.aowLeeftijd.maanden} mnd`} highlight />
            <ECard label="AOW-uitkering (schatting)" value={`${fmt(r.maandelijkseAOW)}/mnd`} sub="alleenstaand, netto" />
            <ECard label="Opgebouwd" value={`${r.aowOpgebouwdPct}%`} sub="bij 2% per jaar NL" />
            <ECard label="Max. AOW" value={`${fmt(AOW_NETTO_ALLEENSTAAND)}/mnd`} sub="bij 100% opbouw" />
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">AOW-opbouw</h4>
            <div className="h-4 bg-gray-100 rounded overflow-hidden mb-1">
              <div className="h-full bg-teal-400 rounded" style={{width:`${r.aowOpgebouwdPct}%`}} />
            </div>
            <p className="text-xs text-gray-500">{r.aowOpgebouwdPct}% opgebouwd — elke ontbrekende 2% = {fmt(Math.round(AOW_NETTO_ALLEENSTAAND * 0.02))} minder per maand</p>
          </div>
          <InfoL items={r.toelichting} />
        </div>
      )}
    </div>
  );
}

// ─── Reiskosten ──────────────────────────────────────────────
function ReiskostenPanel() {
  const [km, setKm] = useState(30);
  const [werkdagen, setWerkdagen] = useState(220);
  const [vervoer, setVervoer] = useState<'auto'|'ov'|'fiets'>('auto');
  const [vergoeding, setVergoeding] = useState(200);

  const r = useMemo(() => calculateReiskosten({
    kmAfstandEnkelWeg: km,
    aantalWerkdagenPerJaar: werkdagen,
    vervoersmiddel: vervoer,
    werkgeversvergoedingMaand: vergoeding,
  }), [km, werkdagen, vervoer, vergoeding]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Reisgegevens</h3>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Afstand enkel (km): {km} km</label>
          <input type="range" min={1} max={150} step={1} value={km}
            onChange={e => setKm(Number(e.target.value))} className="w-full accent-teal-600" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Werkdagen/jaar: {werkdagen}</label>
          <input type="range" min={100} max={260} step={5} value={werkdagen}
            onChange={e => setWerkdagen(Number(e.target.value))} className="w-full accent-teal-600" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vervoersmiddel</label>
          <div className="flex gap-2">
            {(['auto','ov','fiets'] as const).map(v => (
              <button key={v} onClick={() => setVervoer(v)}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition capitalize ${vervoer === v ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {v === 'ov' ? 'OV' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <TF label="Werkgeversvergoeding per maand" value={vergoeding} onChange={setVergoeding} min={0} max={1000} step={10} />
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <ECard label="Km per jaar" value={`${r.jaarlijkseKm.toLocaleString('nl-NL')} km`} />
          <ECard label="Max onbelast/jaar" value={fmt(r.onbeblasteVergoedingMax)} highlight />
          <ECard label="Werkgeversvergoeding" value={fmt(r.werkgeversvergoedingJaar)} sub="per jaar" />
          <ECard label={r.belastbaarVoordeel > 0 ? 'Belastbaar voordeel' : 'Eigen bijdrage'} value={fmt(r.belastbaarVoordeel > 0 ? r.belastbaarVoordeel : r.eigenBijdrageJaar)} />
        </div>
        <div className="border border-teal-200 bg-teal-50 rounded-xl p-4">
          <p className="text-xs text-teal-700 mb-1">Km-vergoeding norm 2026</p>
          <p className="text-xl font-bold text-teal-800">€{REISKOSTEN_ONBELAST_AUTO}/km onbelast</p>
          <p className="text-xs text-teal-600 mt-1">Voor alle vervoersmiddelen (auto, OV, fiets, scooter)</p>
        </div>
        <InfoL items={r.toelichting} />
      </div>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────
function TF({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-bold text-gray-800">{value.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-teal-600" />
    </div>
  );
}
function NF({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
    </div>
  );
}
function ECard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-teal-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-teal-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
function CR({ label, value, bold, green, red }: { label: string; value: string; bold?: boolean; green?: boolean; red?: boolean }) {
  return (
    <div className="flex justify-between py-0.5 text-sm">
      <span className={`${green?'text-green-700':red?'text-red-600':'text-gray-700'} ${bold?'font-semibold':''}`}>{label}</span>
      <span className={`font-medium tabular-nums ${green?'text-green-700':red?'text-red-600':'text-gray-800'} ${bold?'font-bold':''}`}>{value}</span>
    </div>
  );
}
function InfoL({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs text-teal-800">
          <span className="mt-0.5">ℹ️</span><span>{item}</span>
        </div>
      ))}
    </div>
  );
}
