'use client';

import { useState, useMemo } from 'react';
import {
  calculatePartnerAlimentatie,
  calculateKinderalimentatie,
  calculateEchtscheidingsplan,
  type PartnerAlimentatieInput,
  type KinderalimentatieInput,
  type KindData,
  type EchtscheidingsplanInput,
  type Zorgkorting,
} from '@/lib/scheiding';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals });

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

function Input({
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  step = 1,
  type = 'number',
}: {
  value: number | string;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  step?: number;
  type?: string;
}) {
  return (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-transparent bg-white">
      {prefix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        step={step}
        className="flex-1 px-3 py-2 text-sm focus:outline-none"
      />
      {suffix && <span className="px-2 text-sm text-gray-400 bg-gray-50 border-l border-gray-200">{suffix}</span>}
    </div>
  );
}

function ResultRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-start py-2 border-b border-gray-100 last:border-0 ${highlight ? 'bg-rose-50 -mx-3 px-3 rounded' : ''}`}>
      <div>
        <span className="text-sm text-gray-700">{label}</span>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold ml-4 ${highlight ? 'text-rose-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

// ─── Sub-calculators ──────────────────────────────────────────────────────────

function PartnerAlimentatieCalc() {
  const [input, setInput] = useState<PartnerAlimentatieInput>({
    brutoBetaler: 65000,
    brutoOntvanger: 25000,
    huwelijksduur: 12,
    aantalKinderen: 1,
    leeftijdOntvanger: 42,
    woonlastenBetaler: 975,
    woonlastenOntvanger: 875,
  });

  const set = <K extends keyof PartnerAlimentatieInput>(k: K, v: PartnerAlimentatieInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const result = useMemo(() => calculatePartnerAlimentatie(input), [input]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Invoer */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Gegevens</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Bruto jaarsalaris betaler</Label>
            <Input value={input.brutoBetaler} onChange={(v) => set('brutoBetaler', v)} prefix="€" step={1000} />
          </div>
          <div>
            <Label>Bruto jaarsalaris ontvanger</Label>
            <Input value={input.brutoOntvanger} onChange={(v) => set('brutoOntvanger', v)} prefix="€" step={1000} />
          </div>
          <div>
            <Label>Huwelijksduur (jaren)</Label>
            <Input value={input.huwelijksduur} onChange={(v) => set('huwelijksduur', v)} suffix="jr" />
          </div>
          <div>
            <Label>Leeftijd ontvanger</Label>
            <Input value={input.leeftijdOntvanger} onChange={(v) => set('leeftijdOntvanger', v)} suffix="jr" />
          </div>
          <div>
            <Label>Kinderen &lt; 18 jaar</Label>
            <Input value={input.aantalKinderen} onChange={(v) => set('aantalKinderen', v)} />
          </div>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">Geavanceerde opties</summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label>Woonlasten betaler/mnd</Label>
              <Input value={input.woonlastenBetaler ?? 975} onChange={(v) => set('woonlastenBetaler', v)} prefix="€" />
            </div>
            <div>
              <Label>Woonlasten ontvanger/mnd</Label>
              <Input value={input.woonlastenOntvanger ?? 875} onChange={(v) => set('woonlastenOntvanger', v)} prefix="€" />
            </div>
          </div>
        </details>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <strong>Let op:</strong> Dit is een indicatieve berekening op basis van de Tremanormen. Voor een bindende alimentatieverplichting is altijd een rechter of mediator nodig.
        </div>
      </div>

      {/* Resultaat */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Berekening (Tremanormen 2026)</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-0.5">
          {result.stappen.map((s, i) => (
            <ResultRow
              key={i}
              label={s.label}
              value={s.waarde}
              sub={s.toelichting}
              highlight={s.label === 'Alimentatie' || s.label === 'Totaal te betalen'}
            />
          ))}
        </div>

        {result.alimentatie > 0 && (
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="text-sm text-rose-800 font-medium">Samenvatting</div>
            <div className="mt-2 text-3xl font-bold text-rose-700">{fmt(result.alimentatie)}<span className="text-base font-normal text-rose-500">/maand</span></div>
            <div className="text-sm text-rose-600 mt-1">Gedurende {result.duurMaanden} maanden · Totaal {fmt(result.totaalTeBetalen)}</div>
          </div>
        )}

        {result.alimentatie === 0 && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            Geen partneralimentatie van toepassing op basis van de ingevoerde gegevens.
          </div>
        )}
      </div>
    </div>
  );
}

function KinderalimentatieCalc() {
  const [brutoOuder1, setBrutoOuder1] = useState(65000);
  const [brutoOuder2, setBrutoOuder2] = useState(30000);
  const [zorgkorting, setZorgkorting] = useState<Zorgkorting>('laag');
  const [kinderen, setKinderen] = useState<KindData[]>([
    { leeftijd: 4 },
    { leeftijd: 8 },
  ]);

  const voegKindToe = () => setKinderen((k) => [...k, { leeftijd: 6 }]);
  const verwijderKind = (i: number) => setKinderen((k) => k.filter((_, j) => j !== i));
  const updateLeeftijd = (i: number, leeftijd: number) =>
    setKinderen((k) => k.map((c, j) => (j === i ? { ...c, leeftijd } : c)));

  const input: KinderalimentatieInput = useMemo(() => ({
    brutoOuder1,
    brutoOuder2,
    kinderen,
    zorgkorting,
  }), [brutoOuder1, brutoOuder2, kinderen, zorgkorting]);

  const result = useMemo(() => calculateKinderalimentatie(input), [input]);

  const zorgkortingOpties: { value: Zorgkorting; label: string }[] = [
    { value: 'geen', label: 'Geen omgang (0%)' },
    { value: 'laag', label: '1-3 dagen/week (15%)' },
    { value: 'midden', label: '3-4 dagen/week (25%)' },
    { value: 'hoog', label: 'Co-ouderschap ≥4 dgn (35%)' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Invoer */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Gegevens ouders</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Bruto jaarsalaris ouder 1</Label>
            <Input value={brutoOuder1} onChange={setBrutoOuder1} prefix="€" step={1000} />
            <div className="text-xs text-gray-400 mt-0.5">NBI: {fmt(result.nbiOuder1)}/mnd</div>
          </div>
          <div>
            <Label>Bruto jaarsalaris ouder 2</Label>
            <Input value={brutoOuder2} onChange={setBrutoOuder2} prefix="€" step={1000} />
            <div className="text-xs text-gray-400 mt-0.5">NBI: {fmt(result.nbiOuder2)}/mnd</div>
          </div>
        </div>

        <div>
          <Label>Omgangsregeling ouder 2 (zorgkorting)</Label>
          <select
            value={zorgkorting}
            onChange={(e) => setZorgkorting(e.target.value as Zorgkorting)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {zorgkortingOpties.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Kinderen</Label>
            <button
              onClick={voegKindToe}
              className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-medium"
            >
              + Kind toevoegen
            </button>
          </div>
          <div className="space-y-2">
            {kinderen.map((kind, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16">Kind {i + 1}:</span>
                <input
                  type="number"
                  value={kind.leeftijd}
                  onChange={(e) => updateLeeftijd(i, Number(e.target.value))}
                  min={0}
                  max={17}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-500">jaar</span>
                {kinderen.length > 1 && (
                  <button onClick={() => verwijderKind(i)} className="text-red-400 hover:text-red-600 text-sm ml-auto">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <strong>Gebaseerd op:</strong> Nibud-tabellen 2024 en Tremanormen. De werkelijke alimentatie wordt vastgesteld door de rechter of mediator.
        </div>
      </div>

      {/* Resultaat */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Berekening kinderalimentatie</h3>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {result.kindBijdragen.map((k, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Kind {i + 1} ({k.leeftijd} jaar)</span>
                <span className="text-sm font-bold text-rose-700">{fmt(k.alimentatie)}/mnd</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Totale kindkosten (Nibud)</span>
                  <span>{fmt(k.kostenKind)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aandeel ouder 1</span>
                  <span>{fmt(k.aandeel1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aandeel ouder 2 (voor korting)</span>
                  <span>{fmt(k.aandeel2)}</span>
                </div>
                {k.zorgkorting > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Zorgkorting (omgang)</span>
                    <span>-{fmt(k.zorgkorting)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="text-sm text-rose-800 font-medium">Totaal kinderalimentatie</div>
          <div className="text-3xl font-bold text-rose-700 mt-1">{fmt(result.totaalAlimentatie)}<span className="text-base font-normal text-rose-500">/maand</span></div>
          {result.zorgkortingTotaal > 0 && (
            <div className="text-sm text-rose-600 mt-1">Zorgkorting: {fmt(result.zorgkortingTotaal)}/mnd al verrekend</div>
          )}
        </div>

        <div className="mt-3 space-y-1">
          {result.toelichting.map((t, i) => (
            <p key={i} className="text-xs text-gray-500">• {t}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function EchtscheidingsplanCalc() {
  const [input, setInput] = useState<EchtscheidingsplanInput>({
    huwelijksduur: 12,
    gezamenlijkVermogen: 80000,
    gezamenlijkeSchulden: 10000,
    woning: { woningWaarde: 380000, hypotheekSchuld: 250000 },
    pensioen: { opgebouwdPensioenP1: 18000, opgebouwdPensioenP2: 6000 },
    mediation: true,
    aantalKinderen: 1,
    inkomenP1: 65000,
    inkomenP2: 35000,
  });

  const set = <K extends keyof EchtscheidingsplanInput>(k: K, v: EchtscheidingsplanInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const [heeftWoning, setHeeftWoning] = useState(true);
  const [heeftPensioen, setHeeftPensioen] = useState(true);

  const result = useMemo(() => calculateEchtscheidingsplan({
    ...input,
    woning: heeftWoning ? input.woning : undefined,
    pensioen: heeftPensioen ? input.pensioen : undefined,
  }), [input, heeftWoning, heeftPensioen]);

  return (
    <div className="space-y-6">
      {/* Invoer */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Huwelijk & Kinderen</h3>
          <div className="space-y-3">
            <div>
              <Label>Huwelijksduur (jaren)</Label>
              <Input value={input.huwelijksduur} onChange={(v) => set('huwelijksduur', v)} suffix="jr" />
            </div>
            <div>
              <Label>Aantal kinderen &lt; 18</Label>
              <Input value={input.aantalKinderen} onChange={(v) => set('aantalKinderen', v)} />
            </div>
            <div>
              <Label>Procedure</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => set('mediation', true)}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${input.mediation ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Mediation
                </button>
                <button
                  onClick={() => set('mediation', false)}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${!input.mediation ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Advocaten
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Vermogen</h3>
          <div className="space-y-3">
            <div>
              <Label>Gezamenlijk vermogen (excl. woning)</Label>
              <Input value={input.gezamenlijkVermogen} onChange={(v) => set('gezamenlijkVermogen', v)} prefix="€" step={1000} />
            </div>
            <div>
              <Label>Gezamenlijke schulden</Label>
              <Input value={input.gezamenlijkeSchulden} onChange={(v) => set('gezamenlijkeSchulden', v)} prefix="€" step={1000} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Woning & Pensioen</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="heeftWoning" checked={heeftWoning} onChange={(e) => setHeeftWoning(e.target.checked)} className="accent-rose-600" />
              <label htmlFor="heeftWoning" className="text-sm text-gray-700">Eigen woning</label>
            </div>
            {heeftWoning && input.woning && (
              <>
                <div>
                  <Label>Woningwaarde (WOZ)</Label>
                  <Input value={input.woning.woningWaarde} onChange={(v) => set('woning', { ...input.woning!, woningWaarde: v })} prefix="€" step={5000} />
                </div>
                <div>
                  <Label>Hypotheekschuld</Label>
                  <Input value={input.woning.hypotheekSchuld} onChange={(v) => set('woning', { ...input.woning!, hypotheekSchuld: v })} prefix="€" step={5000} />
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="heeftPensioen" checked={heeftPensioen} onChange={(e) => setHeeftPensioen(e.target.checked)} className="accent-rose-600" />
              <label htmlFor="heeftPensioen" className="text-sm text-gray-700">Pensioenverevening</label>
            </div>
            {heeftPensioen && input.pensioen && (
              <>
                <div>
                  <Label>Pensioen p1 tijdens huwelijk (jaar)</Label>
                  <Input value={input.pensioen.opgebouwdPensioenP1} onChange={(v) => set('pensioen', { ...input.pensioen!, opgebouwdPensioenP1: v })} prefix="€" step={500} />
                </div>
                <div>
                  <Label>Pensioen p2 tijdens huwelijk (jaar)</Label>
                  <Input value={input.pensioen.opgebouwdPensioenP2} onChange={(v) => set('pensioen', { ...input.pensioen!, opgebouwdPensioenP2: v })} prefix="€" step={500} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Boedelverdeling */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Boedelverdeling</h3>
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-xs">
                  <th className="text-left px-3 py-2">Onderdeel</th>
                  <th className="text-right px-3 py-2">Partner 1</th>
                  <th className="text-right px-3 py-2">Partner 2</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-700">{item.omschrijving}</div>
                      {item.toelichting && <div className="text-xs text-gray-400 mt-0.5">{item.toelichting}</div>}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${item.bedragP1 >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {fmt(item.bedragP1)}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${item.bedragP2 >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {fmt(item.bedragP2)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-100 font-semibold">
                  <td className="px-3 py-2">Netto saldo</td>
                  <td className={`px-3 py-2 text-right ${result.totaalP1 >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(result.totaalP1)}</td>
                  <td className={`px-3 py-2 text-right ${result.totaalP2 >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(result.totaalP2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          {/* Kosten */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Geschatte kosten echtscheiding</h3>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
              {result.geschatteKosten.mediator !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Mediator</span>
                  <span className="font-medium">{fmt(result.geschatteKosten.mediator)}</span>
                </div>
              )}
              {result.geschatteKosten.advocaatP1 !== undefined && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Advocaat partner 1</span>
                    <span className="font-medium">{fmt(result.geschatteKosten.advocaatP1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Advocaat partner 2</span>
                    <span className="font-medium">{fmt(result.geschatteKosten.advocaatP2!)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Notaris</span>
                <span className="font-medium">{fmt(result.geschatteKosten.notaris)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Griffierecht rechtbank</span>
                <span className="font-medium">{fmt(result.geschatteKosten.griffierecht)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-rose-300 pt-2">
                <span className="text-rose-800">Totaal geschat</span>
                <span className="text-rose-700">{fmt(result.geschatteKosten.totaal)}</span>
              </div>
              <p className="text-xs text-rose-600 mt-1">Per persoon: ±{fmt(result.geschatteKosten.totaal / 2)}</p>
            </div>
          </div>

          {/* Pensioen verevening */}
          {heeftPensioen && result.pensioenVereveningJaarlijks > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-sm text-blue-800 font-medium">Pensioenverevening</p>
              <p className="text-xs text-blue-700 mt-1">
                Jaarlijkse overdracht bij pensionering: <strong>{fmt(result.pensioenVereveningJaarlijks)}/jaar</strong>
              </p>
              <p className="text-xs text-blue-600 mt-0.5">Conform Wet Verevening Pensioenrechten bij Scheiding</p>
            </div>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Echtscheidingsplan checklist</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {result.checklist.map((item, i) => (
            <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${item.afgerond ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
              <span className="mt-0.5 flex-shrink-0">
                {item.afgerond ? '✅' : '☐'}
              </span>
              <span>{item.item}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Vink af naarmate u zaken regelt. Aanbevolen is een mediator of advocaat in te schakelen voor persoonlijk advies.</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'partner' | 'kinderen' | 'plan';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'partner',  label: 'Partneralimentatie', icon: '👫' },
  { id: 'kinderen', label: 'Kinderalimentatie',  icon: '👶' },
  { id: 'plan',     label: 'Echtscheidingsplan', icon: '📋' },
];

export function ScheidingCalculator() {
  const [tab, setTab] = useState<Tab>('partner');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-xl">⚖️</div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Scheidingsberekeningen</h2>
          <p className="text-sm text-gray-500">Partneralimentatie · Kinderalimentatie · Echtscheidingsplan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'partner'  && <PartnerAlimentatieCalc />}
      {tab === 'kinderen' && <KinderalimentatieCalc />}
      {tab === 'plan'     && <EchtscheidingsplanCalc />}

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
        <strong>Disclaimer:</strong> Deze berekeningen zijn indicatief en gebaseerd op de Nederlandse regelgeving 2026 (Tremanormen, Nibud-tabellen, Wet Herziening Partneralimentatie).
        Ze vervangen geen juridisch of financieel advies. Raadpleeg altijd een (echt)scheidingsadvocaat, mediator of financieel planner voor uw persoonlijke situatie.
      </div>
    </div>
  );
}
