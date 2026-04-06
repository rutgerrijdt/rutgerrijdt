'use client';

import { useState, useMemo } from 'react';
import {
  calculateSalary,
  nettoNaarBruto,
  type SalaryInput,
  type TaxProfile,
  SCHIJF1_GRENS,
  AHK_MAX,
  ARBEIDSKORTING_MAX,
} from '@/lib/salary';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function SalaryCalculator() {
  const [mode, setMode] = useState<'bruto_netto' | 'netto_bruto'>('bruto_netto');
  const [brutoJaar, setBrutoJaar] = useState(60000);
  const [nettoJaar, setNettoJaar] = useState(40000);
  const [profile, setProfile] = useState<TaxProfile>('werknemer');
  const [heeftKinderenOnder12, setHeeftKinderenOnder12] = useState(false);
  const [vakantiegeld, setVakantiegeld] = useState(true);

  const input: SalaryInput = {
    brutoJaar: mode === 'bruto_netto' ? brutoJaar : nettoNaarBruto(nettoJaar, profile, heeftKinderenOnder12),
    profile,
    heeftPartner: false,
    heeftKinderenOnder12,
    leeftijd: 35,
    vakantiegeld,
  };

  const result = useMemo(() => calculateSalary(input), [input]);

  const displayBruto = mode === 'bruto_netto' ? brutoJaar : result.brutoJaar;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Salarisberekening 2026</h2>
        <p className="text-sm text-gray-500 mt-0.5">Bruto ↔ Netto berekening op basis van Nederlandse loonheffing</p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden w-fit">
        {(['bruto_netto', 'netto_bruto'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-medium transition ${
              mode === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m === 'bruto_netto' ? 'Bruto → Netto' : 'Netto → Bruto'}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mode === 'bruto_netto' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bruto jaarsalaris</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                value={brutoJaar}
                onChange={(e) => setBrutoJaar(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gewenst netto jaarsalaris</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                value={nettoJaar}
                onChange={(e) => setNettoJaar(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profiel</label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value as TaxProfile)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="werknemer">Werknemer (loondienst)</option>
            <option value="zzp">ZZP / Ondernemer</option>
            <option value="aow">AOW-gerechtigde</option>
          </select>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={vakantiegeld}
            onChange={(e) => setVakantiegeld(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Vakantiegeld (8%) inbegrepen in bruto</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={heeftKinderenOnder12}
            onChange={(e) => setHeeftKinderenOnder12(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Kinderen onder 12 (IACK)</span>
        </label>
      </div>

      {/* Slider */}
      {mode === 'bruto_netto' && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>€0</span>
            <span>€200.000</span>
          </div>
          <input
            type="range"
            min={0}
            max={200000}
            step={1000}
            value={brutoJaar}
            onChange={(e) => setBrutoJaar(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      )}

      {/* Resultaten */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-blue-600 px-4 py-3">
          <h3 className="text-white font-semibold text-sm">Berekening resultaat</h3>
        </div>
        <div className="p-4">
          {/* Hoofdresultaat */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <SalaryCard
              label="Bruto / maand"
              value={fmt(result.brutoMaand)}
              sub={`€ ${displayBruto.toLocaleString('nl-NL')} / jaar`}
            />
            {vakantiegeld && (
              <SalaryCard
                label="Vakantiegeld"
                value={fmt(result.vakantiegeldMaand)}
                sub="per maand (8%)"
              />
            )}
            <SalaryCard
              label="Netto / maand"
              value={fmt(result.nettoMaand)}
              sub={`€ ${result.nettoJaar.toLocaleString('nl-NL')} / jaar`}
              highlight
            />
            <SalaryCard
              label="Effectief tarief"
              value={fmtPct(result.effectiefTarief)}
              sub={`Marginaal: ${fmtPct(result.marginaalTarief)}`}
            />
          </div>

          {/* Loonheffing detail */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Belastingberekening</h4>
            <div className="space-y-2 text-sm">
              <Row label={`Bruto jaarsalaris`} value={fmt(result.brutoJaar)} />
              <div className="pl-4 space-y-1 text-gray-600">
                <Row
                  label={`Schijf 1 (t/m €${SCHIJF1_GRENS.toLocaleString('nl-NL')}) @ 35,82%`}
                  value={`−${fmt(result.belastingSchijf1)}`}
                  gray
                />
                {result.belastingSchijf2 > 0 && (
                  <Row
                    label={`Schijf 2 (boven €${SCHIJF1_GRENS.toLocaleString('nl-NL')}) @ 49,50%`}
                    value={`−${fmt(result.belastingSchijf2)}`}
                    gray
                  />
                )}
              </div>
              <Row
                label="Belasting vóór kortingen"
                value={fmt(result.loonheffingVoorKortingen)}
                sub
              />
              <div className="pl-4 space-y-1 text-green-700">
                <Row
                  label={`Algemene heffingskorting (max ${fmt(AHK_MAX)})`}
                  value={`+${fmt(result.algemenHeffingskorting)}`}
                  green
                />
                <Row
                  label={`Arbeidskorting (max ${fmt(ARBEIDSKORTING_MAX)})`}
                  value={`+${fmt(result.arbeidskorting)}`}
                  green
                />
                {result.iack > 0 && (
                  <Row label="IACK (kinderenkorting)" value={`+${fmt(result.iack)}`} green />
                )}
              </div>
              {result.zvwBijdrage > 0 && (
                <Row label="ZVW-bijdrage (ZZP)" value={`−${fmt(result.zvwBijdrage)}`} gray />
              )}
              <div className="border-t border-gray-100 pt-2">
                <Row
                  label="Netto loonheffing"
                  value={`−${fmt(result.loonheffingNetto)}`}
                  bold
                />
                <Row
                  label="Netto per jaar"
                  value={fmt(result.nettoJaar)}
                  bold
                  blue
                />
                <Row
                  label="Netto per maand"
                  value={fmt(result.nettoMaand)}
                  bold
                  blue
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schijfvisualisatie */}
      <div className="border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Belastingschijven 2026</h4>
        <div className="space-y-2">
          <BracketBar
            label="Schijf 1"
            rate="35,82%"
            range={`€0 – €${SCHIJF1_GRENS.toLocaleString('nl-NL')}`}
            filled={Math.min(1, result.brutoJaar / SCHIJF1_GRENS)}
            color="bg-blue-400"
          />
          <BracketBar
            label="Schijf 2"
            rate="49,50%"
            range={`Boven €${SCHIJF1_GRENS.toLocaleString('nl-NL')}`}
            filled={result.brutoJaar > SCHIJF1_GRENS ? 1 : 0}
            color="bg-orange-400"
            active={result.brutoJaar > SCHIJF1_GRENS}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Indicatieve berekening op basis van loonheffingstabellen 2026. Werkelijke loonheffing kan afwijken o.b.v. persoonlijke situatie. Geen pensioen- of premieaftrek meegenomen.
      </p>
    </div>
  );
}

function SalaryCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({
  label, value, gray, green, bold, blue, sub,
}: {
  label: string; value: string; gray?: boolean; green?: boolean; bold?: boolean; blue?: boolean; sub?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-0.5 ${sub ? 'text-xs text-gray-500' : 'text-sm'}`}>
      <span className={`${gray ? 'text-gray-500' : green ? 'text-green-700' : bold ? 'text-gray-800' : 'text-gray-700'} ${bold ? 'font-semibold' : ''}`}>
        {label}
      </span>
      <span className={`font-medium tabular-nums ${gray ? 'text-gray-500' : green ? 'text-green-700' : blue ? 'text-blue-700' : 'text-gray-800'} ${bold ? 'font-bold' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function BracketBar({
  label, rate, range, filled, color, active = true,
}: {
  label: string; rate: string; range: string; filled: number; color: string; active?: boolean;
}) {
  return (
    <div className={`${!active ? 'opacity-40' : ''}`}>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{label} — {rate}</span>
        <span className="text-gray-400">{range}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, filled * 100)}%` }}
        />
      </div>
    </div>
  );
}
