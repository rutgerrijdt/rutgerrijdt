'use client';

import { useState, useMemo } from 'react';
import {
  calculatePersonalLoan,
  calculateStudentLoan,
  compareAutoLease,
  calculateHuurVsKoop,
  calculateSchenking,
  calculateErfbelasting,
  DUO_RENTE_2026,
  type PersonalLoanInput,
  type StudentLoanInput,
  type AutoKoopInput,
  type AutoLeaseInput,
  type HuurVsKoopInput,
  type SchenkingInput,
  type ErfbelastingInput,
  type RelatieSoort,
} from '@/lib/loans';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

type LoanTab = 'persoonlijk' | 'auto' | 'studielening' | 'huurvskoop' | 'schenking';

export function LoansCalculator() {
  const [tab, setTab] = useState<LoanTab>('persoonlijk');

  const tabs: { id: LoanTab; label: string; icon: string }[] = [
    { id: 'persoonlijk', label: 'Persoonlijke lening', icon: '💳' },
    { id: 'auto',        label: 'Auto koop vs lease',  icon: '🚗' },
    { id: 'studielening',label: 'Studielening DUO',    icon: '🎓' },
    { id: 'huurvskoop',  label: 'Huren vs Kopen',      icon: '🏠' },
    { id: 'schenking',   label: 'Schenking & Erfenis', icon: '🎁' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Leningen, Financiering & Vermogensoverdracht</h2>
        <p className="text-sm text-gray-500 mt-0.5">Persoonlijk krediet, auto, studielening, huren vs kopen, schenking en erfbelasting</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'persoonlijk' && <PersonalLoanPanel />}
      {tab === 'auto'        && <AutoPanel />}
      {tab === 'studielening'&& <StudentLoanPanel />}
      {tab === 'huurvskoop'  && <HuurVsKoopPanel />}
      {tab === 'schenking'   && <SchenkingPanel />}
    </div>
  );
}

// ─── Persoonlijke Lening ─────────────────────────────────────
function PersonalLoanPanel() {
  const [bedrag, setBedrag] = useState(15000);
  const [looptijd, setLooptijd] = useState(60);
  const [rente, setRente] = useState(7.5);
  const [showSchema, setShowSchema] = useState(false);

  const result = useMemo(() =>
    calculatePersonalLoan({ leenbedrag: bedrag, looptijdMaanden: looptijd, jaarrentePercent: rente, type: 'persoonlijk' }),
    [bedrag, looptijd, rente]
  );

  const schemaFiltered = showSchema ? result.schema : result.schema.filter(p => p.maand % 12 === 0 || p.maand === 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Leninggegevens</h3>
          <SliderF label="Leenbedrag" value={bedrag} onChange={setBedrag} min={1000} max={75000} step={500} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Looptijd: {looptijd} maanden ({(looptijd/12).toFixed(1)} jaar)</label>
            <input type="range" min={12} max={120} step={6} value={looptijd}
              onChange={e => setLooptijd(Number(e.target.value))}
              className="w-full accent-orange-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>1 jaar</span><span>5 jaar</span><span>10 jaar</span></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jaarrente: {rente.toFixed(1)}%</label>
            <input type="range" min={1} max={20} step={0.1} value={rente}
              onChange={e => setRente(Number(e.target.value))}
              className="w-full accent-orange-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>1%</span><span>10%</span><span>20%</span></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LCard label="Maandlast" value={fmt(result.maandlast)} highlight />
            <LCard label="Totale rente" value={fmt(result.totaalRente)} />
            <LCard label="Totaal betaald" value={fmt(result.totaalKosten)} />
            <LCard label="Rentelast" value={`${result.totaalRente > 0 ? Math.round((result.totaalRente/bedrag)*100) : 0}%`} sub="van leenbedrag" />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
            <p className="font-medium mb-1">Tip: vergelijk met hypotheek</p>
            <p>Gemiddelde hypotheekrente: ~4–5% | Persoonlijke lening: 6–12%</p>
            <p className="mt-1">Overweeg hypotheek verhogen bij verbouw vs persoonlijk krediet.</p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-orange-600 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Aflossingsschema</h3>
          <button onClick={() => setShowSchema(!showSchema)} className="text-orange-100 text-xs hover:text-white">
            {showSchema ? 'Minder' : 'Alle maanden'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {['Maand','Begin saldo','Rente','Aflossing','Maandlast','Eind saldo'].map(h => (
                  <th key={h} className="text-left text-gray-500 px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schemaFiltered.map(p => (
                <tr key={p.maand} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-1.5">{p.maand}</td>
                  <td className="px-3 py-1.5">{fmt(p.beginSaldo)}</td>
                  <td className="px-3 py-1.5 text-orange-700">{fmt(p.rente)}</td>
                  <td className="px-3 py-1.5">{fmt(p.aflossing)}</td>
                  <td className="px-3 py-1.5 font-medium">{fmt(p.maandlast)}</td>
                  <td className="px-3 py-1.5 text-gray-500">{fmt(p.eindSaldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Auto Koop vs Lease ──────────────────────────────────────
function AutoPanel() {
  const [aanschafprijs, setAanschafprijs] = useState(35000);
  const [eigenInbreng, setEigenInbreng] = useState(5000);
  const [looptijd, setLooptijd] = useState(60);
  const [koopRente, setKoopRente] = useState(6.0);
  const [restwaarde, setRestwaarde] = useState(15000);
  const [leasePrijs, setLeasePrijs] = useState(450);
  const [eigenbijdrage, setEigenbijdrage] = useState(0);
  const [brandstof, setBrandstof] = useState(150);

  const koopInput: AutoKoopInput = {
    aanschafprijs,
    eigenInbreng,
    financieringsbedrag: aanschafprijs - eigenInbreng,
    looptijdMaanden: looptijd,
    financieringsrente: koopRente,
    restwaarde,
    brandstofKostenMaand: brandstof,
    verzekeringsKostenMaand: 85,
    onderhoudMaand: 75,
    motorrijtuigenBelastingMaand: 45,
  };

  const leaseInput: AutoLeaseInput = {
    maandleasePrijs: leasePrijs,
    looptijdMaanden: looptijd,
    kilometerVergoeding: 15,
    jaarlijkseKilometers: 20000,
    brandstofKostenMaand: brandstof,
    eigenRijdersBijdrage: eigenbijdrage,
  };

  const result = useMemo(() => compareAutoLease(koopInput, leaseInput), [koopInput, leaseInput]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">🚗 Koopparameters</h3>
          <SliderF label="Aanschafprijs" value={aanschafprijs} onChange={setAanschafprijs} min={5000} max={100000} step={1000} />
          <SliderF label="Eigen inbreng" value={eigenInbreng} onChange={setEigenInbreng} min={0} max={aanschafprijs} step={500} />
          <SliderF label="Restwaarde na looptijd" value={restwaarde} onChange={setRestwaarde} min={0} max={aanschafprijs} step={500} />
          <NumF label="Financieringsrente (%)" value={koopRente} onChange={setKoopRente} step={0.1} />
        </div>

        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">📋 Leaseparameters</h3>
          <SliderF label="Maandelijkse leaseprijs" value={leasePrijs} onChange={setLeasePrijs} min={100} max={2000} step={10} />
          <SliderF label="Eigen rijdersbijdrage" value={eigenbijdrage} onChange={setEigenbijdrage} min={0} max={500} step={10} />
          <SliderF label="Brandstof (beide opties)" value={brandstof} onChange={setBrandstof} min={0} max={600} step={10} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Looptijd: {looptijd} maanden</label>
            <input type="range" min={24} max={84} step={12} value={looptijd}
              onChange={e => setLooptijd(Number(e.target.value))}
              className="w-full accent-orange-600" />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className={`px-4 py-3 ${result.goedkoperOptie === 'lease' ? 'bg-green-600' : 'bg-blue-600'}`}>
          <h3 className="text-white font-semibold text-sm">
            Vergelijking — {result.goedkoperOptie === 'lease' ? 'Lease is goedkoper' : 'Koop is goedkoper'} (€{fmt(result.verschilPerMaand)}/mnd)
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">KOOP</h4>
              {result.koopDetails.map(d => d.bedrag > 0 && (
                <div key={d.label} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-medium">{fmt(d.bedrag)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between text-sm font-bold">
                <span>Totaal/mnd</span>
                <span className="text-blue-700">{fmt(result.koopMaandlastIncl)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Totaal {looptijd} mnd: {fmt(result.koopTotaalKosten)}</div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">LEASE</h4>
              {result.leaseDetails.map(d => d.bedrag > 0 && (
                <div key={d.label} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-medium">{fmt(d.bedrag)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between text-sm font-bold">
                <span>Totaal/mnd</span>
                <span className="text-green-700">{fmt(result.leaseMaandlastIncl)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Totaal {looptijd} mnd: {fmt(result.leaseTotaalKosten)}</div>
            </div>
          </div>
        </div>
      </div>

      <InfoL items={result.toelichting} color="orange" />
    </div>
  );
}

// ─── Studielening DUO ────────────────────────────────────────
function StudentLoanPanel() {
  const [schuld, setSchuld] = useState(30000);
  const [maandInkomen, setMaandInkomen] = useState(3000);
  const [heeftPartner, setHeeftPartner] = useState(false);
  const [partnerInkomen, setPartnerInkomen] = useState(0);

  const result = useMemo(() =>
    calculateStudentLoan({ schuldbedrag: schuld, maandelijksInkomen: maandInkomen, heeftPartner, partnerInkomen, gewenstAflossing: 'minimaal' }),
    [schuld, maandInkomen, heeftPartner, partnerInkomen]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Studielening gegevens</h3>
        <SliderF label="Openstaande schuld" value={schuld} onChange={setSchuld} min={0} max={100000} step={1000} />
        <SliderF label="Netto maandinkomen" value={maandInkomen} onChange={setMaandInkomen} min={500} max={8000} step={100} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={heeftPartner} onChange={e => setHeeftPartner(e.target.checked)} className="rounded" />
          <span className="text-sm text-gray-700">Partner met inkomen</span>
        </label>
        {heeftPartner && (
          <SliderF label="Netto partnerinkomen" value={partnerInkomen} onChange={setPartnerInkomen} min={0} max={8000} step={100} />
        )}

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-medium">DUO Rente 2026: {DUO_RENTE_2026}%</p>
          <p className="mt-1">Terugbetaaltermijn: 35 jaar | Kwijtschelding na 35 jaar</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <LCard label="Minimale maandlast" value={fmt(result.minimaalMaandlast)} sub="draagkrachttoets" />
          <LCard label="Annuïtaire maandlast" value={fmt(result.annuïtairMaandlast)} sub="bij volledige aflossing 35jr" highlight />
          <LCard label="Restschuld na 15 jr" value={fmt(result.restschuld15Jaar)} />
          <LCard label="Totale rente (35jr)" value={fmt(result.totaalRente)} />
        </div>

        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Impact op hypotheek</h4>
          <p className="text-sm text-red-700">
            Max hypotheek daalt met:{'  '}
            <span className="font-bold text-lg">{fmt(result.hypotheekImpact / 0.045 * 12)}</span>
          </p>
          <p className="text-xs text-red-600 mt-1">
            DUO-schuld telt mee als fictieve last: 0,45% × {fmt(schuld)} = {fmt(Math.round(schuld * 0.0045))}/jr
          </p>
        </div>

        <InfoL items={result.toelichting} color="orange" />
      </div>
    </div>
  );
}

// ─── Huren vs Kopen ──────────────────────────────────────────
function HuurVsKoopPanel() {
  const [koopprijs, setKoopprijs] = useState(350000);
  const [hypotheek, setHypotheek] = useState(300000);
  const [rente, setRente] = useState(4.2);
  const [maandHuur, setMaandHuur] = useState(1400);
  const [huurstijging, setHuurstijging] = useState(3.0);
  const [waardestijging, setWaardestijging] = useState(2.5);
  const [horizon, setHorizon] = useState(15);

  const input: HuurVsKoopInput = {
    koopprijs, hypotheekBedrag: hypotheek, hypotheekRente: rente, looptijdJaar: 30,
    ozb: 600, vveOnderhoud: 2000,
    maandHuur, jaarlijkseHuurstijging: huurstijging,
    jaarlijkseWoningwaardeStijging: waardestijging,
    eigenVermogenInvestmentReturn: 5.0,
    horizonJaar: horizon,
  };

  const result = useMemo(() => calculateHuurVsKoop(input), [input]);

  const lastJaar = result.jaarlijks[result.jaarlijks.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Koop</h3>
          <SliderF label="Koopprijs" value={koopprijs} onChange={setKoopprijs} min={100000} max={1000000} step={10000} />
          <SliderF label="Hypotheekbedrag" value={hypotheek} onChange={setHypotheek} min={50000} max={koopprijs} step={10000} />
          <NumF label="Hypotheekrente (%)" value={rente} onChange={setRente} step={0.1} />
          <NumF label="Woningwaardegroei (% /jr)" value={waardestijging} onChange={setWaardestijging} step={0.1} />
        </div>
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Huur</h3>
          <SliderF label="Maandhuur" value={maandHuur} onChange={setMaandHuur} min={500} max={3000} step={50} />
          <NumF label="Jaarlijkse huurstijging (%)" value={huurstijging} onChange={setHuurstijging} step={0.1} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Analyse-horizon: {horizon} jaar</label>
            <input type="range" min={5} max={30} step={1} value={horizon}
              onChange={e => setHorizon(Number(e.target.value))}
              className="w-full accent-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <LCard label="Koop netto/mnd" value={fmt(result.koopMaandlastNetto)} sub="na renteaftrek" />
        <LCard label="Huur start/mnd" value={fmt(result.huurMaandStart)} />
        {result.breakEvenJaar && (
          <LCard label="Break-even" value={`Jaar ${result.breakEvenJaar}`} sub="koop wordt voordelig" highlight />
        )}
        <LCard label={`Koop voordeel jr ${horizon}`} value={fmt(lastJaar?.koopVoordeel ?? 0)} sub="cumulatief" highlight={( lastJaar?.koopVoordeel ?? 0) > 0} />
      </div>

      {/* Grafiek */}
      <div className="border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Koop vs Huur — netto maandlast over tijd</h4>
        <div className="space-y-1.5">
          {result.jaarlijks.filter(j => j.jaar % 3 === 0 || j.jaar === 1 || j.jaar === horizon).map(j => {
            const maxLast = Math.max(j.koopNettolast, j.huurNettolast, 1);
            return (
              <div key={j.jaar} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10 text-right">Yr {j.jaar}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <div className="w-8 text-xs text-blue-600">Koop</div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded overflow-hidden">
                      <div className="h-full bg-blue-400 rounded" style={{ width: `${(j.koopNettolast/maxLast)*100}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 w-16 text-right">{fmt(j.koopNettolast)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-8 text-xs text-orange-600">Huur</div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded overflow-hidden">
                      <div className="h-full bg-orange-400 rounded" style={{ width: `${(j.huurNettolast/maxLast)*100}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 w-16 text-right">{fmt(j.huurNettolast)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {result.breakEvenJaar && (
          <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-3">
            ✓ Kopen wordt cumulatief voordelig vanaf jaar {result.breakEvenJaar}
          </p>
        )}
      </div>

      <InfoL items={result.toelichting} color="orange" />
    </div>
  );
}

// ─── Schenking & Erfbelasting ────────────────────────────────
function SchenkingPanel() {
  const [mode, setMode] = useState<'schenking' | 'erfenis'>('schenking');
  const [bedrag, setBedrag] = useState(50000);
  const [relatie, setRelatie] = useState<RelatieSoort>('kind');
  const [leeftijd, setLeeftijd] = useState(35);
  const [eerderGebruikt, setEerderGebruikt] = useState(false);
  const [doel, setDoel] = useState<'vrij' | 'studie' | 'woning'>('vrij');

  const schenkResult = useMemo(() =>
    calculateSchenking({ bedrag, relatie, leeftijdOntvanger: leeftijd, eerderGebruiktVerhoogd: eerderGebruikt, doel }),
    [bedrag, relatie, leeftijd, eerderGebruikt, doel]
  );

  const erfResult = useMemo(() =>
    calculateErfbelasting({ erfenis: bedrag, relatie }),
    [bedrag, relatie]
  );

  const res = mode === 'schenking' ? schenkResult : erfResult;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden w-fit">
          {(['schenking', 'erfenis'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium transition ${mode === m ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {m === 'schenking' ? '🎁 Schenking' : '⚖️ Erfenis'}
            </button>
          ))}
        </div>

        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <SliderF label={mode === 'schenking' ? 'Schenkingsbedrag' : 'Erfelaatsbedrag'} value={bedrag} onChange={setBedrag} min={0} max={1000000} step={5000} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Relatie</label>
            <select value={relatie} onChange={e => setRelatie(e.target.value as RelatieSoort)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="kind">Kind</option>
              <option value="kleinkind">Kleinkind</option>
              <option value="partner">Partner</option>
              <option value="overig">Overig (neven, vrienden, etc.)</option>
            </select>
          </div>

          {mode === 'schenking' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Leeftijd ontvanger</label>
                <input type="number" min={0} max={100} value={leeftijd}
                  onChange={e => setLeeftijd(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              {(relatie === 'kind' || relatie === 'kleinkind') && leeftijd <= 40 && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Doel schenking</label>
                    <select value={doel} onChange={e => setDoel(e.target.value as 'vrij' | 'studie' | 'woning')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="vrij">Vrij besteedbaar</option>
                      <option value="studie">Studie (hbo/wo)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={eerderGebruikt} onChange={e => setEerderGebruikt(e.target.checked)} className="rounded" />
                    <span className="text-sm text-gray-700">Verhoogde vrijstelling eerder gebruikt</span>
                  </label>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-orange-600 px-4 py-3">
            <h3 className="text-white font-semibold text-sm">
              {mode === 'schenking' ? 'Schenkbelasting 2026' : 'Erfbelasting 2026'}
            </h3>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <CalcR label={mode === 'schenking' ? 'Schenking' : 'Erfenis'} value={fmt(bedrag)} />
            <CalcR label="Vrijstelling" value={`−${fmt(res.vrijgesteld)}`} green />
            <div className="border-t border-gray-100 pt-1">
              <CalcR label="Belastbaar" value={fmt(res.belastbaar)} bold />
            </div>
            {res.belastbaar > 0 && (
              <div className="border-t border-gray-100 pt-1">
                <CalcR label={mode === 'schenking' ? 'Schenkbelasting' : 'Erfbelasting'} value={fmt(res instanceof Object && 'schenkbelasting' in res ? (res as any).schenkbelasting : (res as any).erfbelasting)} bold red />
              </div>
            )}
            {'nettoBedrag' in res && res.nettoBedrag && (
              <CalcR label="Netto ontvangen" value={fmt(res.nettoBedrag)} bold />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <LCard label="Vrijgesteld" value={fmt(res.vrijgesteld)} highlight />
          <LCard label={mode === 'schenking' ? 'Schenkbelasting' : 'Erfbelasting'} value={fmt('schenkbelasting' in res ? res.schenkbelasting : res.erfbelasting)} alert={res.belastbaar > 0} />
          {res.belastbaar > 0 && (
            <LCard label="Effectief tarief" value={fmtPct(res.effectiefTarief)} sub="over totaalbedrag" />
          )}
          {'nettoBedrag' in res && (
            <LCard label="Netto" value={fmt(res.nettoBedrag)} />
          )}
        </div>

        <InfoL items={res.toelichting} color="orange" />
      </div>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────
function SliderF({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-bold text-gray-800">{value.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-orange-600" />
    </div>
  );
}

function NumF({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
    </div>
  );
}

function LCard({ label, value, sub, highlight, alert }: { label: string; value: string; sub?: string; highlight?: boolean; alert?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${alert ? 'bg-red-50' : highlight ? 'bg-orange-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${alert ? 'text-red-700' : highlight ? 'text-orange-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function CalcR({ label, value, green, red, bold }: { label: string; value: string; green?: boolean; red?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={`${green ? 'text-green-700' : red ? 'text-red-700' : 'text-gray-700'} ${bold ? 'font-semibold' : ''} text-sm`}>{label}</span>
      <span className={`font-medium tabular-nums ${green ? 'text-green-700' : red ? 'text-red-700' : 'text-gray-800'} ${bold ? 'font-bold' : ''} text-sm`}>{value}</span>
    </div>
  );
}

function InfoL({ items, color = 'blue' }: { items: string[]; color?: string }) {
  if (!items.length) return null;
  const bg = color === 'orange' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
  const text = color === 'orange' ? 'text-orange-800' : 'text-blue-800';
  return (
    <div className={`${bg} border rounded-xl p-3 space-y-1`}>
      {items.map((item, i) => (
        <div key={i} className={`flex items-start gap-1.5 text-xs ${text}`}>
          <span className="mt-0.5">ℹ️</span><span>{item}</span>
        </div>
      ))}
    </div>
  );
}
