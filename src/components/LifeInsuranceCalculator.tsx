'use client';

import { useState, useMemo } from 'react';
import {
  calculateORV,
  calcAanbevolenORV,
  type ORVInput,
  type Gender,
  type HealthStatus,
  type CoverageType,
} from '@/lib/lifeInsurance';

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function LifeInsuranceCalculator() {
  const [leeftijd, setLeeftijd] = useState(35);
  const [gender, setGender] = useState<Gender>('man');
  const [rookt, setRookt] = useState(false);
  const [health, setHealth] = useState<HealthStatus>('normaal');
  const [verzekerdBedrag, setVerzekerdBedrag] = useState(300000);
  const [looptijdJaar, setLooptijdJaar] = useState(30);
  const [dekking, setDekking] = useState<CoverageType>('annuïtair_dalend');

  // Aanbeveling
  const [hypotheekBedrag, setHypotheekBedrag] = useState(350000);
  const [brutoInkomen, setBrutoInkomen] = useState(65000);
  const [heeftKinderen, setHeeftKinderen] = useState(false);

  const input: ORVInput = {
    leeftijd, gender, rookt, health,
    verzekerdBedrag, looptijdJaar, dekking,
  };

  const result = useMemo(() => calculateORV(input), [input]);

  const aanbevolenDekking = useMemo(
    () => calcAanbevolenORV(hypotheekBedrag, brutoInkomen, heeftKinderen),
    [hypotheekBedrag, brutoInkomen, heeftKinderen]
  );

  const risicoKleur = result.risicoScore <= 3 ? 'text-green-700 bg-green-50' :
    result.risicoScore <= 6 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Overlijdensrisicoverzekering (ORV)</h2>
        <p className="text-sm text-gray-500 mt-0.5">Indicatieve premieberekening en dekking-advies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Links: Invoer */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Persoonlijke gegevens</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Leeftijd</label>
                <input
                  type="number"
                  min={18} max={70}
                  value={leeftijd}
                  onChange={(e) => setLeeftijd(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Geslacht</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="man">Man</option>
                  <option value="vrouw">Vrouw</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gezondheid</label>
              <select
                value={health}
                onChange={(e) => setHealth(e.target.value as HealthStatus)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="goed">Goed — geen bijzonderheden</option>
                <option value="normaal">Normaal — standaard acceptatie</option>
                <option value="slecht">Verminderd — medische keuring vereist</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rookt}
                onChange={(e) => setRookt(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Roker (incl. e-sigaret / shisha)</span>
            </label>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Verzekeringsgegevens</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Verzekerd bedrag: {fmt(verzekerdBedrag)}
              </label>
              <input
                type="range"
                min={25000} max={1000000} step={25000}
                value={verzekerdBedrag}
                onChange={(e) => setVerzekerdBedrag(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>€25.000</span>
                <span>€1.000.000</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Looptijd: {looptijdJaar} jaar</label>
              <input
                type="range"
                min={5} max={40} step={1}
                value={looptijdJaar}
                onChange={(e) => setLooptijdJaar(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 jaar</span>
                <span>40 jaar</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type dekking</label>
              <select
                value={dekking}
                onChange={(e) => setDekking(e.target.value as CoverageType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gelijkblijvend">Gelijkblijvend</option>
                <option value="annuïtair_dalend">Annuïtair dalend (bij annuïtaire hypotheek)</option>
                <option value="lineair_dalend">Lineair dalend (bij lineaire hypotheek)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rechts: Resultaten */}
        <div className="space-y-4">
          {/* Premie resultaat */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-purple-600 px-4 py-3">
              <h3 className="text-white font-semibold text-sm">Premie-indicatie</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <ORVCard label="Maandpremie" value={fmt(result.maandPremie)} highlight />
                <ORVCard label="Jaarpremie" value={fmt(result.jaarPremie)} />
                <ORVCard
                  label="Totale premie"
                  value={fmt(result.totalePremie)}
                  sub={`over ${looptijdJaar} jaar`}
                />
                <div className={`rounded-lg p-3 ${risicoKleur}`}>
                  <p className="text-xs opacity-75">Risicoklasse</p>
                  <p className="text-base font-bold mt-0.5">{result.risicoScore}/10</p>
                  <p className="text-xs mt-0.5 opacity-75">
                    {result.risicoScore <= 3 ? 'Laag risico' :
                      result.risicoScore <= 6 ? 'Gemiddeld risico' : 'Hoog risico'}
                  </p>
                </div>
              </div>

              {/* Eindleeftijd */}
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <span className="font-medium">Eindleeftijd: </span>
                <span>{leeftijd + looptijdJaar} jaar</span>
                {leeftijd + looptijdJaar > 65 && (
                  <span className="ml-2 text-amber-600 text-xs">⚠ Boven 65 — beperkte beschikbaarheid</span>
                )}
              </div>
            </div>
          </div>

          {/* Toelichting */}
          {result.toelichting.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Aandachtspunten</h4>
              <ul className="space-y-1">
                {result.toelichting.map((t, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dekkingsadvies */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-teal-600 px-4 py-3">
              <h3 className="text-white font-semibold text-sm">Dekkingsadvies</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hypotheekbedrag</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 text-xs">€</span>
                    <input
                      type="number"
                      value={hypotheekBedrag}
                      onChange={(e) => setHypotheekBedrag(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bruto jaarinkomen</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 text-xs">€</span>
                    <input
                      type="number"
                      value={brutoInkomen}
                      onChange={(e) => setBrutoInkomen(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={heeftKinderen}
                  onChange={(e) => setHeeftKinderen(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Kinderen aanwezig</span>
              </label>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <p className="text-xs text-teal-700 mb-1">Aanbevolen dekking</p>
                <p className="text-xl font-bold text-teal-800">{fmt(aanbevolenDekking)}</p>
                <p className="text-xs text-teal-600 mt-1">
                  Hypotheek + {heeftKinderen ? '5' : '3'}× jaarinkomen
                </p>
              </div>

              {verzekerdBedrag < aanbevolenDekking * 0.8 && (
                <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2">
                  ⚠ Huidig verzekerd bedrag ({fmt(verzekerdBedrag)}) is significant lager dan aanbevolen
                </div>
              )}
              {verzekerdBedrag >= aanbevolenDekking && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                  ✓ Huidig verzekerd bedrag dekt het aanbevolen minimum
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Premies zijn marktgemiddelde indicaties. Definitieve premie en acceptatie zijn afhankelijk van medische keuring en acceptatiebeleid van de verzekeraar.
      </p>
    </div>
  );
}

function ORVCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-purple-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-purple-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
