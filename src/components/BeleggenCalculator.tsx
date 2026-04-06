'use client';

import { useState, useMemo } from 'react';
import {
  calculateETFGroei,
  calculateFIRE,
  calculateDCA,
  type ETFGroeiInput,
  type FIREInput,
  type DCAInput,
} from '@/lib/beleggen';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 0) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec });

const pct = (n: number, dec = 1) => `${(n * 100).toFixed(dec)}%`;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

function Field({
  label, value, onChange, prefix, suffix, step = 100, min = 0, max,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 bg-white">
        {prefix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">{prefix}</span>}
        <input
          type="number" value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min} max={max} step={step}
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />
        {suffix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-l border-gray-200">{suffix}</span>}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal: number }) {
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <div className="w-20 text-xs text-gray-500 text-right shrink-0">{d.label}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${d.color}`}
              style={{ width: `${Math.min(100, (d.value / maxVal) * 100)}%` }}
            />
          </div>
          <div className="w-24 text-xs text-gray-700 font-medium">{fmt(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab 1: ETF Groei ─────────────────────────────────────────────────────────

function ETFGroeiCalc() {
  const [input, setInput] = useState<ETFGroeiInput>({
    startKapitaal: 10000,
    maandelijkseBijdrage: 500,
    jaarrendement: 0.07,
    jaren: 20,
    inflatie: 0.025,
    box3Tarief: 0.36,
  });

  const set = <K extends keyof ETFGroeiInput>(k: K, v: ETFGroeiInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateETFGroei(input), [input]);

  const chartData = r.schedule
    .filter((_, i) => i % Math.max(1, Math.floor(r.schedule.length / 8)) === 0 || _ === r.schedule[r.schedule.length - 1])
    .slice(0, 9)
    .map((s) => ({ label: `Jaar ${s.jaar}`, value: s.porteurValeur, color: 'bg-emerald-500' }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Instellingen</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Startkapitaal" value={input.startKapitaal} onChange={(v) => set('startKapitaal', v)} prefix="€" step={1000} />
          <Field label="Maandelijkse inleg" value={input.maandelijkseBijdrage} onChange={(v) => set('maandelijkseBijdrage', v)} prefix="€" step={50} />
          <Field label="Jaarrendement" value={input.jaarrendement * 100} onChange={(v) => set('jaarrendement', v / 100)} suffix="%" step={0.5} min={0} max={20} />
          <Field label="Beleggingshorizon" value={input.jaren} onChange={(v) => set('jaren', v)} suffix="jaar" step={1} min={1} max={50} />
          <Field label="Inflatie" value={input.inflatie * 100} onChange={(v) => set('inflatie', v / 100)} suffix="%" step={0.1} min={0} max={10} />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
          <p><strong>Rendement referentie:</strong> Wereldwijd aandelen ETF (MSCI World) ~7-8% historisch nominaal.</p>
          <p><strong>Box 3 2026:</strong> Fictief rendement 5,88% × 36% belasting over vermogen boven €57.684.</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Resultaat na {input.jaren} jaar</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="text-xs text-emerald-600 mb-1">Eindwaarde (nominaal)</div>
            <div className="text-xl font-bold text-emerald-700">{fmt(r.eindWaarde)}</div>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
            <div className="text-xs text-teal-600 mb-1">Reële waarde (na inflatie)</div>
            <div className="text-xl font-bold text-teal-700">{fmt(r.eindWaardReeel)}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-600 mb-1">Totaal ingelegd</div>
            <div className="text-lg font-bold text-blue-700">{fmt(r.totaalIngelegd)}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-xs text-green-600 mb-1">Rendement</div>
            <div className="text-lg font-bold text-green-700">{fmt(r.totaalRendement)}</div>
          </div>
        </div>

        <h4 className="text-xs font-medium text-gray-500 mb-2">Groei over de tijd</h4>
        <BarChart data={chartData} maxVal={r.eindWaarde} />

        <div className="mt-3 text-xs text-gray-500 flex justify-between">
          <span>Box 3 belasting betaald: {fmt(r.totaalBox3Belasting)}</span>
          <span>Effectief rendement: {pct(r.effectiefJaarrendement)}/jaar</span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: FIRE ─────────────────────────────────────────────────────────────

function FIRECalc() {
  const [input, setInput] = useState<FIREInput>({
    huidigVermogen: 50000,
    maandelijkseUitgavenFIRE: 3000,
    maandelijkseSpaarbijdrage: 1500,
    jaarrendementOpbouw: 0.07,
    jaarrendementPensionering: 0.04,
    inflatie: 0.025,
    leeftijdNu: 35,
    gewensteFIRELeeftijd: 55,
  });

  const set = <K extends keyof FIREInput>(k: K, v: FIREInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateFIRE(input), [input]);

  const opbouwData = r.schedule.filter((s) => s.fase === 'opbouw').slice(-1)[0];
  const fireData = r.schedule.filter((s) => s.fase === 'fire').slice(0, 20);
  const maxV = Math.max(...r.schedule.map((s) => s.vermogen));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">FIRE parameters</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Huidig vermogen" value={input.huidigVermogen} onChange={(v) => set('huidigVermogen', v)} prefix="€" step={5000} />
          <Field label="Maandelijkse spaar" value={input.maandelijkseSpaarbijdrage} onChange={(v) => set('maandelijkseSpaarbijdrage', v)} prefix="€" step={100} />
          <Field label="Uitgaven in FIRE/mnd" value={input.maandelijkseUitgavenFIRE} onChange={(v) => set('maandelijkseUitgavenFIRE', v)} prefix="€" step={100} />
          <Field label="Rendement opbouw" value={input.jaarrendementOpbouw * 100} onChange={(v) => set('jaarrendementOpbouw', v / 100)} suffix="%" step={0.5} min={0} max={15} />
          <Field label="Rendement na FIRE" value={input.jaarrendementPensionering * 100} onChange={(v) => set('jaarrendementPensionering', v / 100)} suffix="%" step={0.5} min={0} max={15} />
          <Field label="Leeftijd nu" value={input.leeftijdNu} onChange={(v) => set('leeftijdNu', v)} suffix="jr" step={1} min={18} max={80} />
          <Field label="Gewenste FIRE-leeftijd" value={input.gewensteFIRELeeftijd} onChange={(v) => set('gewensteFIRELeeftijd', v)} suffix="jr" step={1} min={input.leeftijdNu + 1} max={80} />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
          <p><strong>4%-regel:</strong> Trek jaarlijks 4% van je vermogen op. Vermogen = 25× jaaruitgaven.</p>
          <p className="mt-1">Jaaruitgaven FIRE: {fmt(input.maandelijkseUitgavenFIRE * 12)} → benodigde pot: <strong>{fmt(r.benodigdVermogen)}</strong></p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">FIRE analyse</h3>

        <div className={`rounded-xl p-4 border ${r.haalbaar ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`text-sm font-medium ${r.haalbaar ? 'text-green-800' : 'text-amber-800'}`}>
            {r.haalbaar ? '🎯 FIRE-doel haalbaar!' : '⚠️ FIRE-doel niet haalbaar met huidige inleg'}
          </div>
          <div className={`text-2xl font-bold mt-1 ${r.haalbaar ? 'text-green-700' : 'text-amber-700'}`}>
            {fmt(r.verwachtVermogenOpFIRE)}
          </div>
          <div className={`text-xs mt-1 ${r.haalbaar ? 'text-green-600' : 'text-amber-600'}`}>
            Verwacht vermogen op leeftijd {input.gewensteFIRELeeftijd} · Doel: {fmt(r.benodigdVermogen)}
          </div>
          {!r.haalbaar && (
            <div className="text-xs text-amber-700 mt-2 font-medium">
              Benodigde maandelijkse inleg: {fmt(r.benoddigdeMaandelijksBijdrage)}/mnd
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
            <div className="text-xs text-blue-600">Tekort/overschot</div>
            <div className={`text-sm font-bold ${r.tekortOfOverschot >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {r.tekortOfOverschot >= 0 ? '+' : ''}{fmt(r.tekortOfOverschot)}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2">
            <div className="text-xs text-purple-600">Vermogen meegaat</div>
            <div className="text-sm font-bold text-purple-700">
              {r.jarenVermogenMeegaat >= 100 ? '∞ jaar' : `${r.jarenVermogenMeegaat} jaar`}
            </div>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-2">
            <div className="text-xs text-teal-600">Jaren tot FIRE</div>
            <div className="text-sm font-bold text-teal-700">{r.jarenTotFIRE} jaar</div>
          </div>
        </div>

        <h4 className="text-xs font-medium text-gray-500">Vermogensontwikkeling</h4>
        <div className="space-y-1">
          {r.schedule
            .filter((s) => s.jaar % 5 === 0 || s.jaar === r.jarenTotFIRE)
            .slice(0, 12)
            .map((s) => (
              <div key={s.jaar} className="flex items-center gap-2">
                <div className="w-16 text-xs text-gray-500 text-right shrink-0">
                  {s.fase === 'fire' ? '🔥 ' : ''}Lft {s.leeftijd}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.fase === 'opbouw' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, (s.vermogen / (maxV || 1)) * 100)}%` }}
                  />
                </div>
                <div className="w-24 text-xs font-medium text-gray-700">{fmt(s.vermogen)}</div>
              </div>
            ))}
        </div>
        <div className="text-xs text-gray-400 flex gap-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />Opbouwfase</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />FIRE-fase</span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: DCA ───────────────────────────────────────────────────────────────

function DCACalc() {
  const [input, setInput] = useState<DCAInput>({
    maandelijkseBijdrage: 300,
    aantalMaanden: 120,
    jaarrendement: 0.07,
    volatiliteit: 0.15,
    eenmaligeBedrag: 0,
  });

  const set = <K extends keyof DCAInput>(k: K, v: DCAInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateDCA(input), [input]);

  // Vergelijk DCA met eenmalige storting van hetzelfde totaal
  const totaalInleg = input.maandelijkseBijdrage * input.aantalMaanden + (input.eenmaligeBedrag ?? 0);
  const eenmaligeResult = useMemo(() => calculateDCA({
    ...input,
    maandelijkseBijdrage: 0,
    eenmaligeBedrag: totaalInleg,
    aantalMaanden: input.aantalMaanden,
  }), [input, totaalInleg]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">DCA Instellingen</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Maandelijkse inleg" value={input.maandelijkseBijdrage} onChange={(v) => set('maandelijkseBijdrage', v)} prefix="€" step={50} />
          <Field label="Eenmalige storting" value={input.eenmaligeBedrag ?? 0} onChange={(v) => set('eenmaligeBedrag', v)} prefix="€" step={500} />
          <Field label="Looptijd" value={input.aantalMaanden} onChange={(v) => set('aantalMaanden', v)} suffix="mnd" step={12} min={12} max={600} />
          <Field label="Jaarrendement" value={input.jaarrendement * 100} onChange={(v) => set('jaarrendement', v / 100)} suffix="%" step={0.5} min={0} max={20} />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
          <p><strong>DCA (Dollar Cost Averaging):</strong> Periodiek een vast bedrag inleggen ongeacht de koers. Dit verlaagt het risico van een slechte instap.</p>
          <p>Looptijd: {(input.aantalMaanden / 12).toFixed(1)} jaar · Totale inleg: {fmt(totaalInleg)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Resultaat</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="text-xs text-emerald-600 mb-1">DCA eindwaarde</div>
            <div className="text-xl font-bold text-emerald-700">{fmt(r.eindWaarde)}</div>
            <div className="text-xs text-emerald-500 mt-0.5">Rendement: {pct(r.rendementPct)}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-600 mb-1">Eenmalige storting</div>
            <div className="text-xl font-bold text-blue-700">{fmt(eenmaligeResult.eindWaarde)}</div>
            <div className="text-xs text-blue-500 mt-0.5">Rendement: {pct(eenmaligeResult.rendementPct)}</div>
          </div>
        </div>

        <div className={`rounded-xl p-3 border text-sm ${r.eindWaarde >= eenmaligeResult.eindWaarde ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          {r.eindWaarde >= eenmaligeResult.eindWaarde
            ? `✅ DCA levert meer op: +${fmt(r.eindWaarde - eenmaligeResult.eindWaarde)}`
            : `📈 Eenmalige storting levert meer: +${fmt(eenmaligeResult.eindWaarde - r.eindWaarde)}`}
          <p className="text-xs mt-1 opacity-75">Bij eenmalige storting wordt de volledige som meteen belegd — dit werkt beter als de markt stijgt.</p>
        </div>

        <h4 className="text-xs font-medium text-gray-500">Groei DCA per jaar</h4>
        <div className="space-y-1">
          {r.schedule.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-14 text-xs text-gray-500 text-right shrink-0">Mnd {s.maand}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (s.vermogen / (r.eindWaarde || 1)) * 100)}%` }} />
              </div>
              <div className="w-24 text-xs text-gray-700">{fmt(s.vermogen)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'etf' | 'fire' | 'dca';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'etf',  label: 'ETF / Beleggen',  icon: '📈' },
  { id: 'fire', label: 'FIRE Calculator', icon: '🔥' },
  { id: 'dca',  label: 'DCA Strategie',   icon: '📅' },
];

export function BeleggenCalculator() {
  const [tab, setTab] = useState<Tab>('etf');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">📈</div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Beleggen & FIRE</h2>
          <p className="text-sm text-gray-500">ETF-groei · Financial Independence · Dollar Cost Averaging</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'etf'  && <ETFGroeiCalc />}
      {tab === 'fire' && <FIRECalc />}
      {tab === 'dca'  && <DCACalc />}

      <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
        <strong>Disclaimer:</strong> Rendementen uit het verleden bieden geen garantie voor de toekomst. Beleggen brengt risico's met zich mee. Dit is geen beleggingsadvies.
      </div>
    </div>
  );
}
