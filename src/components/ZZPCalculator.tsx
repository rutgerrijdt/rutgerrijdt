'use client';

import { useState, useMemo } from 'react';
import {
  calculateZZPInkomen,
  calculateUurtarief,
  calculateZZPvsLoondienst,
  type ZZPInkomenInput,
  type UurtariefInput,
  type ZZPvsLoondienstInput,
} from '@/lib/zzp';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 0) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

function Field({
  label, value, onChange, prefix, suffix, step = 100, min = 0,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 bg-white">
        {prefix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          step={step}
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />
        {suffix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-l border-gray-200">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Tab 1: ZZP Netto Inkomen ─────────────────────────────────────────────────

function ZZPInkomenCalc() {
  const [input, setInput] = useState<ZZPInkomenInput>({
    brutoWinst: 90000,
    zakelijkeKosten: 8000,
    isStarter: false,
    overigeAftrekposten: 0,
  });

  const set = <K extends keyof ZZPInkomenInput>(k: K, v: ZZPInkomenInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateZZPInkomen(input), [input]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Winst & kosten</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Omzet (bruto)" value={input.brutoWinst} onChange={(v) => set('brutoWinst', v)} prefix="€" step={1000} />
          <Field label="Zakelijke kosten" value={input.zakelijkeKosten} onChange={(v) => set('zakelijkeKosten', v)} prefix="€" step={500} />
          <Field label="Overige aftrekposten" value={input.overigeAftrekposten ?? 0} onChange={(v) => set('overigeAftrekposten', v)} prefix="€" step={500} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={input.isStarter}
            onChange={(e) => set('isStarter', e.target.checked)}
            className="accent-orange-500 w-4 h-4"
          />
          <span className="text-sm text-gray-700">Startersaftrek toepassen (eerste 3 jaar)</span>
        </label>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800 space-y-1">
          <p><strong>Zelfstandigenaftrek 2026:</strong> €2.470 (urencriterium: ≥1.225 uur/jaar)</p>
          <p><strong>MKB-winstvrijstelling:</strong> 12,7% van winst na aftrekposten</p>
          <p><strong>ZVW-premie ZZP:</strong> 5,64% over winst (max grondslag €71.628)</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Berekening 2026</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-1">
          {r.stappen.map((s, i) => (
            <div key={i} className={`flex justify-between py-1.5 border-b border-gray-100 last:border-0 ${s.label.startsWith('Netto') ? 'border-t-2 border-orange-200 mt-1 pt-2' : ''}`}>
              <span className="text-sm text-gray-600">{s.label}</span>
              <span className={`text-sm font-medium ${s.positief ? (s.label.startsWith('Netto') ? 'text-orange-700 font-bold text-base' : 'text-green-700') : 'text-red-600'}`}>
                {s.waarde >= 0 ? fmt(s.waarde) : `−${fmt(Math.abs(s.waarde))}`}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
            <div className="text-xs text-orange-600 mb-1">Netto/maand</div>
            <div className="text-lg font-bold text-orange-700">{fmt(r.maandNetto)}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-600 mb-1">Effectief tarief</div>
            <div className="text-lg font-bold text-blue-700">{pct(r.effectiefTarief)}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <div className="text-xs text-amber-600 mb-1">Kwartaalvoorschot</div>
            <div className="text-lg font-bold text-amber-700">{fmt(r.kwartaalVoorschot)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Uurtarief ─────────────────────────────────────────────────────────

function UurtariefCalc() {
  const [input, setInput] = useState<UurtariefInput>({
    gewenstNettoJaar: 50000,
    werkdagenPerJaar: 200,
    urenPerDag: 8,
    zakelijkeKosten: 6000,
    nietDeclarabeelPct: 20,
  });

  const set = <K extends keyof UurtariefInput>(k: K, v: UurtariefInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateUurtarief(input), [input]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Invoer</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gewenst netto per jaar" value={input.gewenstNettoJaar} onChange={(v) => set('gewenstNettoJaar', v)} prefix="€" step={1000} />
          <Field label="Zakelijke kosten/jaar" value={input.zakelijkeKosten} onChange={(v) => set('zakelijkeKosten', v)} prefix="€" step={500} />
          <Field label="Werkdagen per jaar" value={input.werkdagenPerJaar} onChange={(v) => set('werkdagenPerJaar', v)} suffix="dgn" step={5} />
          <Field label="Uren per dag" value={input.urenPerDag} onChange={(v) => set('urenPerDag', v)} suffix="uur" step={0.5} />
          <Field label="Niet-declarabel (%)" value={input.nietDeclarabeelPct} onChange={(v) => set('nietDeclarabeelPct', v)} suffix="%" step={5} />
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800 space-y-1">
          <p>Niet-declarabele uren = acquisitie, administratie, scholing, netwerken.</p>
          <p>Gemiddeld NL ZZP'er: 20–30% niet-declarabel.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Uurtarief advies</h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Totale uren/jaar', value: `${r.beschikbareUren.toFixed(0)} uur`, kleur: 'gray' },
            { label: 'Declarabele uren', value: `${r.declarabeleUren.toFixed(0)} uur`, kleur: 'gray' },
            { label: 'Min. uurtarief (break-even)', value: fmt(r.minimumUurtarief, 2), kleur: 'amber' },
            { label: 'Aanbevolen tarief (+20%)', value: fmt(r.aanbevolenUurtarief, 2), kleur: 'orange' },
            { label: 'Dagtarief', value: fmt(r.dagtarief, 0), kleur: 'orange' },
            { label: 'Equiv. bruto loondienst', value: fmt(r.vergelijkingLoondienst, 0), kleur: 'blue' },
          ].map((item) => (
            <div key={item.label} className={`bg-${item.kleur}-50 border border-${item.kleur}-200 rounded-xl p-3`}>
              <div className={`text-xs text-${item.kleur}-600 mb-1`}>{item.label}</div>
              <div className={`text-lg font-bold text-${item.kleur}-700`}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
          <p><strong>Tip:</strong> Het aanbevolen tarief geeft 20% buffer voor leegloop en risico. Het equivalente brutoloon is wat een werkgever voor dezelfde nettowaarde betaalt (incl. werkgeverslasten).</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: ZZP vs Loondienst ─────────────────────────────────────────────────

function ZZPvsLoondienstCalc() {
  const [input, setInput] = useState<ZZPvsLoondienstInput>({
    brutoLoondienst: 65000,
    uurtarief: 90,
    declarabeleUren: 1000,
    zakelijkeKostenZZP: 8000,
    vakantiedagenLoondienst: 25,
    vakantietoeslagPct: 8,
    pensioenPctLoondienst: 15,
  });

  const set = <K extends keyof ZZPvsLoondienstInput>(k: K, v: ZZPvsLoondienstInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => calculateZZPvsLoondienst(input), [input]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Loondienst</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bruto jaarsalaris" value={input.brutoLoondienst} onChange={(v) => set('brutoLoondienst', v)} prefix="€" step={1000} />
          <Field label="Vakantietoeslag (%)" value={input.vakantietoeslagPct} onChange={(v) => set('vakantietoeslagPct', v)} suffix="%" step={1} />
          <Field label="Pensioen werkgever (%)" value={input.pensioenPctLoondienst} onChange={(v) => set('pensioenPctLoondienst', v)} suffix="%" step={1} />
          <Field label="Vakantiedagen" value={input.vakantiedagenLoondienst} onChange={(v) => set('vakantiedagenLoondienst', v)} suffix="dgn" step={1} />
        </div>

        <h3 className="font-semibold text-gray-800 mt-4">ZZP</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Uurtarief" value={input.uurtarief} onChange={(v) => set('uurtarief', v)} prefix="€" step={5} />
          <Field label="Declarabele uren/jaar" value={input.declarabeleUren} onChange={(v) => set('declarabeleUren', v)} suffix="uur" step={50} />
          <Field label="Zakelijke kosten/jaar" value={input.zakelijkeKostenZZP} onChange={(v) => set('zakelijkeKostenZZP', v)} prefix="€" step={500} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Vergelijking</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-sm font-medium text-blue-800 mb-2">💼 Loondienst</div>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex justify-between"><span>Bruto salaris</span><span>{fmt(r.loondienst.brutoSalaris)}</span></div>
              <div className="flex justify-between"><span>Vakantiegeld (8%)</span><span>{fmt(r.loondienst.vakantiegeld)}</span></div>
              <div className="flex justify-between"><span>Pensioenbijdrage</span><span>{fmt(r.loondienst.pensioenbijdrage)}</span></div>
              <div className="flex justify-between font-semibold border-t border-blue-200 pt-1 mt-1"><span>Totaal pakket</span><span>{fmt(r.loondienst.totaalPakket)}</span></div>
              <div className="flex justify-between text-blue-900 font-bold text-sm border-t border-blue-200 pt-1"><span>Geschat netto</span><span>{fmt(r.loondienst.geschatNetto)}</span></div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="text-sm font-medium text-orange-800 mb-2">🧾 ZZP</div>
            <div className="space-y-1 text-xs text-orange-700">
              <div className="flex justify-between"><span>Omzet ({input.uurtarief}/uur)</span><span>{fmt(r.zzp.omzet)}</span></div>
              <div className="flex justify-between"><span>Zakelijke kosten</span><span>−{fmt(r.zzp.zakelijkeKosten)}</span></div>
              <div className="flex justify-between font-semibold border-t border-orange-200 pt-1 mt-1"><span>Winst na kosten</span><span>{fmt(r.zzp.winstNaKosten)}</span></div>
              <div className="flex justify-between text-orange-900 font-bold text-sm border-t border-orange-200 pt-1"><span>Geschat netto</span><span>{fmt(r.zzp.geschatNetto)}</span></div>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 border ${r.verschilNetto >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-sm font-medium mb-1 ${r.verschilNetto >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {r.verschilNetto >= 0 ? '✅ ZZP levert meer op' : '⚠️ Loondienst levert meer op'}
          </div>
          <div className={`text-2xl font-bold ${r.verschilNetto >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {r.verschilNetto >= 0 ? '+' : ''}{fmt(r.verschilNetto)} per jaar
          </div>
          <div className={`text-xs mt-2 ${r.verschilNetto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Break-even uurtarief: <strong>{fmt(r.breakEvenUurtarief, 2)}/uur</strong>
          </div>
        </div>

        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
          <p><strong>Let op:</strong> ZZP heeft geen opbouw van pensioen, WW-recht, doorbetaling bij ziekte of loopbaanbudget.</p>
          <p>Pensioenopbouw: {fmt(r.loondienst.pensioenbijdrage)}/jaar door werkgever wordt gemist als ZZP'er.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'inkomen' | 'uurtarief' | 'vergelijking';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'inkomen',     label: 'Netto inkomen',      icon: '🧾' },
  { id: 'uurtarief',  label: 'Uurtarief',           icon: '⏱️' },
  { id: 'vergelijking', label: 'ZZP vs loondienst', icon: '⚖️' },
];

export function ZZPCalculator() {
  const [tab, setTab] = useState<Tab>('inkomen');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🧾</div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">ZZP / Freelancer Berekeningen</h2>
          <p className="text-sm text-gray-500">Netto inkomen · Uurtarief · Vergelijking loondienst — 2026</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'inkomen'     && <ZZPInkomenCalc />}
      {tab === 'uurtarief'  && <UurtariefCalc />}
      {tab === 'vergelijking' && <ZZPvsLoondienstCalc />}

      <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
        <strong>Disclaimer:</strong> Berekeningen zijn indicatief op basis van belastingregels 2026. Zelfstandigenaftrek vereist ≥1.225 uur/jaar ondernemersactiviteit. Raadpleeg een boekhouder voor uw persoonlijke situatie.
      </div>
    </div>
  );
}
