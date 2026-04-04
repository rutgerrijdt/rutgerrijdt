'use client';

import { useState, useMemo } from 'react';
import {
  calculateBox3,
  calculateSavings,
  calculatePension,
  BOX3_HEFFINGSVRIJ_PER_PERSOON,
  BOX3_TARIEF,
  FICTIEF_RENDEMENT_SPAAR,
  FICTIEF_RENDEMENT_BELEGGING,
  AOW_ALLEENSTAAND_MAAND,
  type Box3Input,
  type SavingsInput,
  type PensionInput,
} from '@/lib/wealth';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

type WealthTab = 'box3' | 'sparen' | 'pensioen';

export function WealthCalculator() {
  const [tab, setTab] = useState<WealthTab>('box3');

  const tabs: { id: WealthTab; label: string; icon: string }[] = [
    { id: 'box3',    label: 'Box 3 Belasting',     icon: '🏦' },
    { id: 'sparen',  label: 'Spaar- & Beleggingscalculator', icon: '📈' },
    { id: 'pensioen',label: 'Pensioenplanning',     icon: '🌅' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Vermogen & Planning</h2>
        <p className="text-sm text-gray-500 mt-0.5">Box 3 belasting, spaarcalculator en pensioenplanning</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'box3'     && <Box3Calculator />}
      {tab === 'sparen'   && <SavingsInvestmentCalculator />}
      {tab === 'pensioen' && <PensionCalculator />}
    </div>
  );
}

// ============================================================
// Box 3 Calculator
// ============================================================
function Box3Calculator() {
  const [spaargeld, setSpaargeld] = useState(50000);
  const [beleggingen, setBeleggingen] = useState(30000);
  const [andereVermogen, setAndereVermogen] = useState(0);
  const [schulden, setSchulden] = useState(0);
  const [aantalPersonen, setAantalPersonen] = useState<1 | 2>(1);

  const input: Box3Input = { spaargeld, beleggingen, andereVermogensbestanddelen: andereVermogen, schulden, aantalPersonen };
  const result = useMemo(() => calculateBox3(input), [input]);

  const totaalBezit = spaargeld + beleggingen + andereVermogen;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Vermogensbestanddelen</h3>

          <InputField label="Spaargeld / banktegoeden" value={spaargeld} onChange={setSpaargeld}
            sub={`Fictief rendement: ${fmtPct(FICTIEF_RENDEMENT_SPAAR)}`} />
          <InputField label="Beleggingen / aandelen / ETF" value={beleggingen} onChange={setBeleggingen}
            sub={`Fictief rendement: ${fmtPct(FICTIEF_RENDEMENT_BELEGGING)}`} />
          <InputField label="Overig vermogen (vastgoed, crypto)" value={andereVermogen} onChange={setAndereVermogen} />
          <InputField label="Schulden (aftrekbaar)" value={schulden} onChange={setSchulden}
            sub="Verlaagt de belastinggrondslag" />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fiscale partners</label>
            <div className="flex gap-2">
              {([1, 2] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setAantalPersonen(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    aantalPersonen === n ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n === 1 ? 'Alleenstaand' : 'Fiscale partners'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3">
              <h3 className="text-white font-semibold text-sm">Box 3 Berekening 2026</h3>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <CalcRow label="Totaal vermogen" value={fmt(totaalBezit)} />
              <CalcRow label="Af: schulden" value={`−${fmt(schulden)}`} />
              <CalcRow label="Rendementsgrondslag" value={fmt(result.rendementsgrondslag)} sub />
              <CalcRow label={`Heffingsvrij (${aantalPersonen}×)`} value={`−${fmt(result.heffingsvrij)}`} green />
              <div className="border-t border-gray-100 pt-2">
                <CalcRow label="Belastbaar vermogen" value={fmt(result.belastbaarVermogen)} bold />
              </div>

              {result.belastbaarVermogen > 0 && (
                <>
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-500 mb-1">Fictieve rendementen</p>
                    {result.fictieveRendementSpaar > 0 && (
                      <CalcRow label="Spaar (1,44%)" value={fmt(result.fictieveRendementSpaar)} />
                    )}
                    {result.fictieveRendementBelegging > 0 && (
                      <CalcRow label="Beleggingen (5,88%)" value={fmt(result.fictieveRendementBelegging)} />
                    )}
                    {result.fictieveRendementAnders > 0 && (
                      <CalcRow label="Overig (5,88%)" value={fmt(result.fictieveRendementAnders)} />
                    )}
                    {result.fictieveRendementSchuld > 0 && (
                      <CalcRow label="Schuld aftrek (2,47%)" value={`−${fmt(result.fictieveRendementSchuld)}`} green />
                    )}
                    <CalcRow label="Totaal fictief rendement" value={fmt(result.totaalFictieveRendement)} sub />
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <CalcRow label={`Box 3 belasting (${(BOX3_TARIEF * 100).toFixed(0)}%)`} value={fmt(result.belasting)} bold red />
                  </div>
                </>
              )}
            </div>
          </div>

          {result.belasting > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <WealthCard label="Jaarlijkse belasting" value={fmt(result.belasting)} alert />
              <WealthCard label="Per maand" value={fmt(Math.round(result.belasting / 12))} />
              <WealthCard
                label="Effectief tarief"
                value={`${(result.effectiefRendementTarief * 100).toFixed(2)}%`}
                sub="over totaal vermogen"
              />
              <WealthCard
                label="Heffingsvrij"
                value={fmt(result.heffingsvrij)}
                sub="per persoon per jaar"
                highlight
              />
            </div>
          )}

          {result.toelichting.map((t, i) => (
            <div key={i} className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-start gap-1.5">
              <span>💡</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Box 3 fictieve rendementen voor 2026: spaargeld 1,44%, overige bezittingen 5,88%, schulden 2,47%. Tarief: 36%. Heffingsvrij vermogen: {fmt(BOX3_HEFFINGSVRIJ_PER_PERSOON)} per persoon.
      </p>
    </div>
  );
}

// ============================================================
// Savings / Investment Calculator
// ============================================================
function SavingsInvestmentCalculator() {
  const [beginBedrag, setBeginBedrag] = useState(10000);
  const [maandInleg, setMaandInleg] = useState(500);
  const [rente, setRente] = useState(4.0);
  const [looptijd, setLooptijd] = useState(20);
  const [rekenmethode, setRekenmethode] = useState<'enkelvoudig' | 'samengesteld'>('samengesteld');
  const [showAllJaren, setShowAllJaren] = useState(false);

  const input: SavingsInput = {
    beginBedrag,
    maandelijksInleg: maandInleg,
    jaarrentePercent: rente,
    looptijdJaar: looptijd,
    rekenmethode,
  };

  const result = useMemo(() => calculateSavings(input), [input]);

  const displayJaren = showAllJaren ? result.jaarlijkseGroei : result.jaarlijkseGroei.filter(
    (j) => j.jaar === 1 || j.jaar % 5 === 0 || j.jaar === looptijd
  );

  const maxSaldo = result.jaarlijkseGroei[result.jaarlijkseGroei.length - 1]?.eindSaldo ?? 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Parameters</h3>

          <InputField label="Beginbedrag" value={beginBedrag} onChange={setBeginBedrag} />
          <InputField label="Maandelijkse inleg" value={maandInleg} onChange={setMaandInleg} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Jaarrente: {rente.toFixed(1)}%
            </label>
            <input
              type="range" min={0} max={15} step={0.1}
              value={rente}
              onChange={(e) => setRente(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0%</span>
              <span className="text-blue-600">Spaar ~3%</span>
              <span className="text-orange-600">ETF ~7%</span>
              <span>15%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Looptijd: {looptijd} jaar
            </label>
            <input
              type="range" min={1} max={50} step={1}
              value={looptijd}
              onChange={(e) => setLooptijd(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Berekeningsmethode</label>
            <div className="flex gap-2">
              {(['samengesteld', 'enkelvoudig'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setRekenmethode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                    rekenmethode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m === 'samengesteld' ? 'Samengesteld (rente op rente)' : 'Enkelvoudig'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <WealthCard label="Eindwaarde" value={fmt(result.eindwaarde)} highlight />
            <WealthCard label="Totaal ingelegd" value={fmt(result.totaalIngelegd)} />
            <WealthCard label="Totale rente" value={fmt(result.totaalRente)} sub="rendement" />
            <WealthCard
              label="Rente/inleg ratio"
              value={`${result.totaalIngelegd > 0 ? ((result.totaalRente / result.totaalIngelegd) * 100).toFixed(0) : 0}%`}
              sub="rente als % van inleg"
            />
          </div>

          {/* Visual bar chart */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-medium text-gray-600 mb-3">Groei over tijd</h4>
            <div className="space-y-1.5">
              {displayJaren.map((j) => {
                const inlegRatio = j.eindSaldo > 0
                  ? Math.min(100, (result.totaalIngelegd * (j.jaar / looptijd)) / maxSaldo * 100)
                  : 0;
                const renteRatio = Math.min(100, j.eindSaldo / maxSaldo * 100);
                return (
                  <div key={j.jaar} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12 text-right">Yr {j.jaar}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden relative">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-300 rounded-l"
                        style={{ width: `${inlegRatio}%` }}
                      />
                      <div
                        className="absolute left-0 top-0 h-full bg-green-400 opacity-60 rounded"
                        style={{ width: `${renteRatio}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-24 text-right">
                      {fmt(j.eindSaldo)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-300 rounded inline-block" /> Inleg</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block" /> Rendement</span>
            </div>
            <button
              onClick={() => setShowAllJaren(!showAllJaren)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              {showAllJaren ? 'Minder weergeven' : 'Alle jaren tonen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Pension Calculator
// ============================================================
function PensionCalculator() {
  const [huidigLeeftijd, setHuidigLeeftijd] = useState(35);
  const [pensioenLeeftijd, setPensioenLeeftijd] = useState(67);
  const [huidigBrutoJaar, setHuidigBrutoJaar] = useState(65000);
  const [pensioenvermogen, setPensioenvermogen] = useState(20000);
  const [maandInleg, setMaandInleg] = useState(300);
  const [rendement, setRendement] = useState(5.0);
  const [gewenstPensioen, setGewenstPensioen] = useState(2500);
  const [levensverwachting, setLevensverwachting] = useState(85);

  const input: PensionInput = {
    huidigLeeftijd,
    pensioenLeeftijd,
    huidigBrutoJaar,
    huidigPensioenVermogen: pensioenvermogen,
    maandelijkseInleg: maandInleg,
    verwachtRendementPercent: rendement,
    gewenstNettoPensioenMaand: gewenstPensioen,
    levensverwachting,
  };

  const result = useMemo(() => calculatePension(input), [input]);

  const dekkingKleur = result.dekkingsgraad >= 100 ? 'text-green-700 bg-green-50 border-green-200' :
    result.dekkingsgraad >= 75 ? 'text-amber-700 bg-amber-50 border-amber-200' :
      'text-red-700 bg-red-50 border-red-200';

  const aantalJaarOpbouw = Math.max(0, pensioenLeeftijd - huidigLeeftijd);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Pensioeninstellingen</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Huidige leeftijd</label>
              <input type="number" min={18} max={66} value={huidigLeeftijd}
                onChange={(e) => setHuidigLeeftijd(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pensioenleeftijd</label>
              <input type="number" min={55} max={75} value={pensioenLeeftijd}
                onChange={(e) => setPensioenLeeftijd(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <InputField label="Huidig bruto jaarinkomen" value={huidigBrutoJaar} onChange={setHuidigBrutoJaar} />
          <InputField label="Huidig pensioenvermogen" value={pensioenvermogen} onChange={setPensioenvermogen}
            sub="Eigen opbouw / spaargeld (excl. werkgeverspensioen)" />
          <InputField label="Maandelijkse extra inleg" value={maandInleg} onChange={setMaandInleg} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Verwacht rendement: {rendement.toFixed(1)}%
            </label>
            <input type="range" min={0} max={10} step={0.5} value={rendement}
              onChange={(e) => setRendement(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0%</span>
              <span className="text-blue-600">Conservatief 3%</span>
              <span className="text-orange-600">Optimistisch 7%</span>
              <span>10%</span>
            </div>
          </div>

          <InputField
            label="Gewenst netto pensioen / maand"
            value={gewenstPensioen}
            onChange={setGewenstPensioen}
            sub={`Aanbeveling: 70% van huidig netto (ca. ${fmt(Math.round(huidigBrutoJaar * 0.65 * 0.70 / 12))})`}
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Levensverwachting: {levensverwachting} jaar</label>
            <input type="range" min={70} max={100} step={1} value={levensverwachting}
              onChange={(e) => setLevensverwachting(Number(e.target.value))}
              className="w-full accent-blue-600" />
          </div>
        </div>

        <div className="space-y-3">
          {/* Dekkingsgraad */}
          <div className={`border rounded-xl p-4 ${dekkingKleur}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Dekkingsgraad</h3>
              <span className="text-2xl font-bold">{result.dekkingsgraad}%</span>
            </div>
            <div className="h-4 bg-white bg-opacity-50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  result.dekkingsgraad >= 100 ? 'bg-green-500' :
                    result.dekkingsgraad >= 75 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, result.dekkingsgraad)}%` }}
              />
            </div>
            <p className="text-xs mt-1.5 opacity-75">
              {result.dekkingsgraad >= 100 ? 'Op koers voor gewenst pensioen' :
                `Tekort: ${fmt(result.tekort)} per maand`}
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <WealthCard
              label="Opgebouwd vermogen"
              value={fmt(result.verwachtPensioenVermogen)}
              sub={`Na ${aantalJaarOpbouw} jaar`}
              highlight
            />
            <WealthCard
              label="AOW-uitkering"
              value={fmt(result.aowMaand)}
              sub="per maand (indicatief)"
            />
            <WealthCard
              label="Uitkering eigen vermogen"
              value={fmt(result.maandUitkering)}
              sub={`Over ${result.aantalPensioenJaren} jaar`}
            />
            <WealthCard
              label="Totaal pensioen"
              value={fmt(result.totaalMaandelijksPensioen)}
              sub="AOW + eigen vermogen"
              highlight={result.dekkingsgraad >= 100}
              alert={result.dekkingsgraad < 75}
            />
          </div>

          {result.tekort > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Pensioengat dichten</h4>
              <p className="text-sm text-red-700">
                Extra maandelijkse inleg nodig:{' '}
                <span className="font-bold text-lg">{fmt(result.extraInlegNodig)}</span>
              </p>
              <p className="text-xs text-red-600 mt-1">
                Bovenop huidige inleg van {fmt(maandInleg)}/maand
              </p>
            </div>
          )}

          {/* Toelichting */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Aandachtspunten</h4>
            {result.toelichting.map((t, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-blue-800">
                <span className="mt-0.5">•</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Shared sub-components ----
function InputField({
  label, value, onChange, sub,
}: {
  label: string; value: number; onChange: (v: number) => void; sub?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-gray-400 text-xs">€</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function WealthCard({
  label, value, sub, highlight, alert,
}: {
  label: string; value: string; sub?: string; highlight?: boolean; alert?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${alert ? 'bg-red-50' : highlight ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${alert ? 'text-red-700' : highlight ? 'text-blue-700' : 'text-gray-800'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function CalcRow({
  label, value, sub, bold, green, red,
}: {
  label: string; value: string; sub?: boolean; bold?: boolean; green?: boolean; red?: boolean;
}) {
  return (
    <div className={`flex justify-between py-0.5 ${sub ? 'text-xs text-gray-500' : 'text-sm'}`}>
      <span className={`${green ? 'text-green-700' : red ? 'text-red-700' : 'text-gray-700'} ${bold ? 'font-semibold' : ''}`}>
        {label}
      </span>
      <span className={`font-medium tabular-nums ${green ? 'text-green-700' : red ? 'text-red-700' : 'text-gray-800'} ${bold ? 'font-bold' : ''}`}>
        {value}
      </span>
    </div>
  );
}
