'use client';

import { useState, useMemo } from 'react';
import {
  calculatePersonalLoan,
  calculateStudentLoan,
  compareAutoLease,
  calculateHuurVsKoop,
  calculateSchenking,
  calculateErfbelasting,
  type PersonalLoanInput,
  type StudentLoanInput,
  type AutoKoopInput,
  type AutoLeaseInput,
  type HuurVsKoopInput,
  type SchenkingInput,
  type SchenkingRelatie,
  type ErfbelastingInput,
  type ErfbelastingRelatie,
} from '@/lib/loans';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

type LoanTab = 'persoonlijk' | 'auto' | 'studielening' | 'huurvskoop' | 'schenking';

export function LoansCalculator() {
  const [tab, setTab] = useState<LoanTab>('persoonlijk');

  const tabs: { id: LoanTab; label: string; icon: string }[] = [
    { id: 'persoonlijk', label: 'Persoonlijke lening', icon: '\u{1F4B3}' },
    { id: 'auto',        label: 'Auto koop vs lease',  icon: '\u{1F697}' },
    { id: 'studielening',label: 'Studielening DUO',    icon: '\u{1F393}' },
    { id: 'huurvskoop',  label: 'Huren vs Kopen',      icon: '\u{1F3E0}' },
    { id: 'schenking',   label: 'Schenking & Erfenis', icon: '\u{1F381}' },
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
            <span>{t.icon}</span><span>{t.label}</span>
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

  const input: PersonalLoanInput = {
    loanAmount: bedrag,
    annualInterestRate: rente / 100,
    durationMonths: looptijd,
  };
  const result = useMemo(() => calculatePersonalLoan(input), [input]);
  const displayed = showSchema ? result.schedule : result.schedule.filter(p => p.month % 12 === 0 || p.month === 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Leninggegevens</h3>
          <SliderF label="Leenbedrag" value={bedrag} onChange={setBedrag} min={1000} max={75000} step={500} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Looptijd: {looptijd} maanden ({(looptijd/12).toFixed(1)} jaar)</label>
            <input type="range" min={12} max={120} step={6} value={looptijd}
              onChange={e => setLooptijd(Number(e.target.value))} className="w-full accent-orange-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>1 jaar</span><span>5 jaar</span><span>10 jaar</span></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jaarrente: {rente.toFixed(1)}%</label>
            <input type="range" min={1} max={20} step={0.1} value={rente}
              onChange={e => setRente(Number(e.target.value))} className="w-full accent-orange-600" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LCard label="Maandlast" value={fmt(result.monthlyPayment)} highlight />
            <LCard label="Totale rente" value={fmt(result.totalInterest)} />
            <LCard label="Totaal betaald" value={fmt(result.totalPaid)} />
            <LCard label="Rentelast" value={`${bedrag > 0 ? Math.round((result.totalInterest/bedrag)*100) : 0}%`} sub="van leenbedrag" />
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
            <p className="font-medium mb-1">Vergelijk met hypotheek</p>
            <p>Hypotheekrente: ~4–5% | Persoonlijke lening: 6–12%</p>
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
              <tr>{['Maand','Begin saldo','Rente','Aflossing','Maandlast','Eind saldo'].map(h => (
                <th key={h} className="text-left text-gray-500 px-3 py-2 font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {displayed.map(p => (
                <tr key={p.month} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-1.5">{p.month}</td>
                  <td className="px-3 py-1.5">{fmt(p.remainingBalance + p.principal)}</td>
                  <td className="px-3 py-1.5 text-orange-700">{fmt(p.interest)}</td>
                  <td className="px-3 py-1.5">{fmt(p.principal)}</td>
                  <td className="px-3 py-1.5 font-medium">{fmt(p.payment)}</td>
                  <td className="px-3 py-1.5 text-gray-500">{fmt(p.remainingBalance)}</td>
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
  const [aanschaf, setAanschaf] = useState(35000);
  const [aanbetaling, setAanbetaling] = useState(5000);
  const [jaren, setJaren] = useState(4);
  const [koopRente, setKoopRente] = useState(6.0);
  const [leasePrijs, setLeasePrijs] = useState(500);
  const [brandstof, setBrandstof] = useState(150);
  const [bijtelling, setBijtelling] = useState(22);

  const koopInput: AutoKoopInput = {
    purchasePrice: aanschaf,
    downPayment: aanbetaling,
    financingRate: koopRente / 100,
    financingMonths: jaren * 12,
    annualDepreciationRate: 0.15,
    annualMaintenanceCost: 900,
    annualInsuranceCost: 1020,
    annualRoadTax: 540,
    ownershipYears: jaren,
    monthlyFuelCost: brandstof,
  };

  const leaseInput: AutoLeaseInput = {
    monthlyLeaseCost: leasePrijs,
    leaseTermMonths: jaren * 12,
    monthlyFuelCost: brandstof,
    bijtellingPercentage: bijtelling / 100,
    cataloguePriceForBijtelling: aanschaf,
    marginalTaxRate: 0.3693,
    ownershipYears: jaren,
  };

  const result = useMemo(() => compareAutoLease(koopInput, leaseInput), [koopInput, leaseInput]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Koop-parameters</h3>
          <SliderF label="Aanschafprijs" value={aanschaf} onChange={setAanschaf} min={5000} max={150000} step={1000} />
          <SliderF label="Aanbetaling" value={aanbetaling} onChange={setAanbetaling} min={0} max={aanschaf} step={500} />
          <NumF label="Financieringsrente (%)" value={koopRente} onChange={setKoopRente} step={0.1} />
        </div>
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Lease-parameters</h3>
          <SliderF label="Maandelijkse leaseprijs" value={leasePrijs} onChange={setLeasePrijs} min={100} max={2000} step={10} />
          <NumF label="Bijtelling (%)" value={bijtelling} onChange={setBijtelling} step={1} />
          <SliderF label="Brandstof/energie (beiden)" value={brandstof} onChange={setBrandstof} min={0} max={600} step={10} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Periode: {jaren} jaar</label>
            <input type="range" min={2} max={7} step={1} value={jaren}
              onChange={e => setJaren(Number(e.target.value))} className="w-full accent-orange-600" />
          </div>
        </div>
      </div>
      <div className={`border rounded-xl overflow-hidden`}>
        <div className={`px-4 py-3 ${result.cheaperOption === 'lease' ? 'bg-green-600' : result.cheaperOption === 'kopen' ? 'bg-blue-600' : 'bg-gray-500'}`}>
          <h3 className="text-white font-semibold text-sm">
            {result.cheaperOption === 'kopen' ? 'Kopen is goedkoper' : result.cheaperOption === 'lease' ? 'Lease is goedkoper' : 'Vergelijkbaar'} — verschil {fmt(result.differenceEuros)} netto over {jaren} jaar
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">KOPEN</h4>
            <div className="space-y-1 text-sm">
              <CalcR label="Aanschaf + financiering" value={fmt(result.breakdown.kopen.purchasePrice + result.breakdown.kopen.financingCost)} />
              <CalcR label="Onderhoud + verzekering" value={fmt(result.breakdown.kopen.maintenanceCost + result.breakdown.kopen.insuranceCost)} />
              <CalcR label="Wegenbelasting" value={fmt(result.breakdown.kopen.roadTax)} />
              <CalcR label="Brandstof" value={fmt(result.breakdown.kopen.fuelCost)} />
              <CalcR label="Restwaarde" value={`-${fmt(result.breakdown.kopen.residualValue)}`} green />
              <div className="border-t pt-1"><CalcR label="Netto totaal" value={fmt(result.netCostKopen)} bold /></div>
              <CalcR label="Gem. per maand" value={fmt(result.monthlyCostKopen)} sub />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">LEASE</h4>
            <div className="space-y-1 text-sm">
              <CalcR label="Leasetermijnen" value={fmt(result.breakdown.lease.leasePayments)} />
              <CalcR label="Brandstof" value={fmt(result.breakdown.lease.fuelCost)} />
              {result.breakdown.lease.bijtellingTax > 0 && (
                <CalcR label="Bijtelling belasting" value={fmt(result.breakdown.lease.bijtellingTax)} />
              )}
              <div className="border-t pt-1"><CalcR label="Netto totaal" value={fmt(result.netCostLease)} bold /></div>
              <CalcR label="Gem. per maand" value={fmt(result.monthlyCostLease)} sub />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Studielening DUO ────────────────────────────────────────
function StudentLoanPanel() {
  const [schuld, setSchuld] = useState(30000);
  const [jaarInkomen, setJaarInkomen] = useState(42000);
  const [stelsel, setStelsel] = useState<'oud'|'nieuw'|'nieuwnieuw'>('nieuw');
  const [duoRente, setDuoRente] = useState(2.56);

  const input: StudentLoanInput = {
    totalDebt: schuld,
    repaymentSystem: stelsel,
    grossAnnualIncome: jaarInkomen,
    duoInterestRate: duoRente / 100,
  };
  const result = useMemo(() => calculateStudentLoan(input), [input]);
  const hypotheekImpact = Math.round(schuld * 0.0045);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Studielening DUO</h3>
        <SliderF label="Openstaande schuld" value={schuld} onChange={setSchuld} min={0} max={100000} step={1000} />
        <SliderF label="Bruto jaarinkomen" value={jaarInkomen} onChange={setJaarInkomen} min={15000} max={150000} step={1000} />
        <NumF label="DUO rente (%)" value={duoRente} onChange={setDuoRente} step={0.01} />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Leenstelsel</label>
          <div className="flex gap-2 flex-wrap">
            {(['oud','nieuw','nieuwnieuw'] as const).map(s => (
              <button key={s} onClick={() => setStelsel(s)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${stelsel === s ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s === 'oud' ? 'Oud (voor 2015)' : s === 'nieuw' ? 'Nieuw (2015–2023)' : 'Nieuwnieuw (2023+)'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <LCard label="Maandlast" value={fmt(result.monthlyRepayment)} highlight />
          <LCard label="Aflossingsduur" value={`${result.yearsToRepay} jaar`} />
          <LCard label="Totaal betaald" value={fmt(result.totalPaid)} />
          <LCard label="Kwijtgescholden" value={fmt(result.amountForgiven)} sub="na looptijd" />
        </div>
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-1">Impact op maximale hypotheek</h4>
          <p className="text-sm text-red-700">Maandlast fictief: <span className="font-bold">{fmt(hypotheekImpact)}/jaar</span></p>
          <p className="text-xs text-red-600 mt-1">GHF: 0,45% × {fmt(schuld)} = {fmt(hypotheekImpact)}/jr fictieve last</p>
        </div>
        {result.schedule.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-orange-600 px-4 py-2"><h4 className="text-white text-xs font-semibold">Aflossingsoverzicht (eerste 5 jaar)</h4></div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50"><tr>
                {['Jaar','Inkomen','Aflossing/jr','Rente','Restschuld'].map(h=><th key={h} className="text-left text-gray-500 px-3 py-1.5 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {result.schedule.slice(0,5).map(r=>(
                  <tr key={r.year} className="border-t border-gray-50">
                    <td className="px-3 py-1">{r.year}</td>
                    <td className="px-3 py-1">{fmt(r.income)}</td>
                    <td className="px-3 py-1">{fmt(r.annualRepayment)}</td>
                    <td className="px-3 py-1 text-orange-600">{fmt(r.interestCharge)}</td>
                    <td className="px-3 py-1">{fmt(r.remainingDebt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    koopprijs,
    hypotheekBedrag: hypotheek,
    hypotheekRente: rente / 100,
    maandelijkseHuur: maandHuur,
    huurstijging: huurstijging / 100,
    homeAppreciation: waardestijging / 100,
    years: horizon,
    investmentReturn: 0.05,
  };
  const result = useMemo(() => calculateHuurVsKoop(input), [input]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Koopwoning</h3>
          <SliderF label="Koopprijs" value={koopprijs} onChange={setKoopprijs} min={100000} max={1000000} step={10000} />
          <SliderF label="Hypotheekbedrag" value={hypotheek} onChange={setHypotheek} min={50000} max={koopprijs} step={10000} />
          <NumF label="Hypotheekrente (%)" value={rente} onChange={setRente} step={0.1} />
          <NumF label="Woningwaardegroei (% /jr)" value={waardestijging} onChange={setWaardestijging} step={0.1} />
        </div>
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Huurwoning</h3>
          <SliderF label="Maandhuur" value={maandHuur} onChange={setMaandHuur} min={500} max={3000} step={50} />
          <NumF label="Jaarlijkse huurstijging (%)" value={huurstijging} onChange={setHuurstijging} step={0.1} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Horizon: {horizon} jaar</label>
            <input type="range" min={5} max={30} step={1} value={horizon}
              onChange={e => setHorizon(Number(e.target.value))} className="w-full accent-orange-600" />
          </div>
        </div>
      </div>
      <div className={`rounded-xl border p-4 ${result.betterOption === 'kopen' ? 'bg-blue-50 border-blue-200' : result.betterOption === 'huren' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className={`font-semibold text-sm ${result.betterOption === 'kopen' ? 'text-blue-800' : 'text-orange-800'}`}>
          {result.betterOption === 'kopen' ? 'Kopen bouwt meer vermogen op' : result.betterOption === 'huren' ? 'Huren is financieel voordeliger' : 'Vergelijkbaar resultaat'}
          {result.breakEvenYear && ` — break-even jaar ${result.breakEvenYear}`}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <LCard label="Koop gem./mnd" value={fmt(result.avgMonthlyCostKopen)} sub="na renteaftrek" />
        <LCard label="Huur gem./mnd" value={fmt(result.avgMonthlyCostHuren)} />
        <LCard label="Eigen vermogen koop" value={fmt(result.netEquityAtEnd)} highlight />
        <LCard label="Vermogensverschil" value={fmt(Math.abs(result.netWorthDifference))} sub={result.betterOption === 'kopen' ? 'kopen wint' : 'huren wint'} />
      </div>
      <div className="border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Netto maandlast over tijd</h4>
        <div className="space-y-1.5">
          {result.schedule.filter(j => j.year % 5 === 0 || j.year === 1 || j.year === horizon).map(j => {
            const mx = Math.max(j.netMortgageCost + j.ownerCosts, j.annualRent / 12, 1);
            return (
              <div key={j.year} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10 text-right">Yr {j.year}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <div className="w-8 text-xs text-blue-500">Koop</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                      <div className="h-full bg-blue-400 rounded" style={{width:`${Math.min(100,((j.netMortgageCost+j.ownerCosts)/mx)*100)}%`}} />
                    </div>
                    <span className="text-xs text-gray-600 w-20 text-right">{fmt(j.netMortgageCost + j.ownerCosts)}/jr</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-8 text-xs text-orange-500">Huur</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                      <div className="h-full bg-orange-400 rounded" style={{width:`${Math.min(100,((j.annualRent/12)/mx)*100)}%`}} />
                    </div>
                    <span className="text-xs text-gray-600 w-20 text-right">{fmt(j.annualRent/12)}/mnd</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Schenking & Erfbelasting ────────────────────────────────
function SchenkingPanel() {
  const [mode, setMode] = useState<'schenking'|'erfenis'>('schenking');
  const [bedrag, setBedrag] = useState(50000);
  const [schenkRelatie, setSchenkRelatie] = useState<SchenkingRelatie>('kind');
  const [erfRelatie, setErfRelatie] = useState<ErfbelastingRelatie>('kind');
  const [leeftijd, setLeeftijd] = useState(35);
  const [vrijstellingType, setVrijstellingType] = useState<'jaarlijks'|'eenmalig_verhoogd'|'eigenwoningschenking'|'geen'>('eenmalig_verhoogd');
  const [erfdeel, setErfdeel] = useState(100);

  const schenkInput: SchenkingInput = {
    schenkingsBedrag: bedrag,
    relatie: schenkRelatie,
    leeftijdOntvanger: leeftijd,
    vrijstellingType,
  };
  const erfInput: ErfbelastingInput = {
    nalatenschapWaarde: bedrag,
    relatie: erfRelatie,
    erfdeel: erfdeel / 100,
  };

  const schenkResult = useMemo(() => calculateSchenking(schenkInput), [schenkInput]);
  const erfResult = useMemo(() => calculateErfbelasting(erfInput), [erfInput]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden w-fit">
          {(['schenking','erfenis'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium transition ${mode === m ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {m === 'schenking' ? 'Schenking' : 'Erfenis'}
            </button>
          ))}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <SliderF label={mode === 'schenking' ? 'Schenkingsbedrag' : 'Nalatenschap totaal'} value={bedrag} onChange={setBedrag} min={0} max={1000000} step={5000} />
          {mode === 'schenking' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Relatie</label>
                <select value={schenkRelatie} onChange={e => setSchenkRelatie(e.target.value as SchenkingRelatie)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="kind">Kind</option>
                  <option value="kleinkind">Kleinkind</option>
                  <option value="overig">Overig</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vrijstellingstype</label>
                <select value={vrijstellingType} onChange={e => setVrijstellingType(e.target.value as typeof vrijstellingType)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="jaarlijks">Jaarlijkse vrijstelling</option>
                  <option value="eenmalig_verhoogd">Eenmalig verhoogd (kind 18–40 jr)</option>
                  <option value="eigenwoningschenking">Eigenwoningschenking</option>
                  <option value="geen">Geen vrijstelling</option>
                </select>
              </div>
              {(vrijstellingType === 'eenmalig_verhoogd' || vrijstellingType === 'eigenwoningschenking') && (
                <NumF label="Leeftijd ontvanger" value={leeftijd} onChange={setLeeftijd} step={1} />
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Relatie erfgenaam</label>
                <select value={erfRelatie} onChange={e => setErfRelatie(e.target.value as ErfbelastingRelatie)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="partner">Partner</option>
                  <option value="kind">Kind</option>
                  <option value="kind_invalide">Kind (invalide)</option>
                  <option value="kleinkind">Kleinkind</option>
                  <option value="ouder">Ouder</option>
                  <option value="overig">Overig</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Erfdeel: {erfdeel}%</label>
                <input type="range" min={1} max={100} step={1} value={erfdeel}
                  onChange={e => setErfdeel(Number(e.target.value))} className="w-full accent-orange-600" />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-orange-600 px-4 py-3">
            <h3 className="text-white font-semibold text-sm">{mode === 'schenking' ? 'Schenkbelasting 2026' : 'Erfbelasting 2026'}</h3>
          </div>
          <div className="p-4 space-y-2 text-sm">
            {mode === 'schenking' ? (
              <>
                <CalcR label="Schenking" value={fmt(schenkResult.schenkingsBedrag)} />
                <CalcR label="Vrijstelling" value={`-${fmt(schenkResult.vrijstelling)}`} green />
                <div className="border-t pt-1"><CalcR label="Belastbaar" value={fmt(schenkResult.belastbaarBedrag)} bold /></div>
                {schenkResult.belastbaarBedrag > 0 && (
                  <div className="border-t pt-1"><CalcR label="Schenkbelasting" value={fmt(schenkResult.schenkbelasting)} bold red /></div>
                )}
                <CalcR label="Netto ontvangen" value={fmt(schenkResult.nettoOntvangen)} bold />
              </>
            ) : (
              <>
                <CalcR label="Nalatenschap" value={fmt(erfResult.nalatenschapWaarde)} />
                <CalcR label={`Erfdeel (${erfdeel}%)`} value={fmt(erfResult.erfdeelBedrag)} />
                <CalcR label="Vrijstelling" value={`-${fmt(erfResult.vrijstelling)}`} green />
                <div className="border-t pt-1"><CalcR label="Belastbaar erfdeel" value={fmt(erfResult.belastbaarErfdeel)} bold /></div>
                {erfResult.belastbaarErfdeel > 0 && (
                  <div className="border-t pt-1"><CalcR label="Erfbelasting" value={fmt(erfResult.erfbelasting)} bold red /></div>
                )}
                <CalcR label="Netto ontvangen" value={fmt(erfResult.nettoOntvangen)} bold />
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mode === 'schenking' ? (
            <>
              <LCard label="Vrijgesteld" value={fmt(schenkResult.vrijstelling)} highlight />
              <LCard label="Schenkbelasting" value={fmt(schenkResult.schenkbelasting)} alert={schenkResult.schenkbelasting > 0} />
              <LCard label="Effectief tarief" value={fmtPct(schenkResult.effectiefTarief)} />
              <LCard label="Netto ontvangen" value={fmt(schenkResult.nettoOntvangen)} />
            </>
          ) : (
            <>
              <LCard label="Vrijstelling" value={fmt(erfResult.vrijstelling)} highlight />
              <LCard label="Erfbelasting" value={fmt(erfResult.erfbelasting)} alert={erfResult.erfbelasting > 0} />
              <LCard label="Effectief tarief" value={fmtPct(erfResult.effectiefTarief)} />
              <LCard label="Netto ontvangen" value={fmt(erfResult.nettoOntvangen)} />
            </>
          )}
        </div>
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
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-orange-600" />
    </div>
  );
}
function NumF({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value))}
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
function CalcR({ label, value, green, red, bold, sub }: { label: string; value: string; green?: boolean; red?: boolean; bold?: boolean; sub?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${sub ? 'text-xs text-gray-500' : 'text-sm'}`}>
      <span className={`${green?'text-green-700':red?'text-red-700':'text-gray-700'} ${bold?'font-semibold':''}`}>{label}</span>
      <span className={`font-medium tabular-nums ${green?'text-green-700':red?'text-red-700':'text-gray-800'} ${bold?'font-bold':''}`}>{value}</span>
    </div>
  );
}
