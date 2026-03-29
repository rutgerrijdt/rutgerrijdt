'use client';

import type { MortgageDetails } from '@/lib/types';
import { NHG_NORMS } from '@/lib/nhg';
import { getFinancingLoadPercentage } from '@/lib/ghf';
import { formatEuro } from '@/lib/utils';

interface Props {
  data: MortgageDetails;
  onChange: (data: MortgageDetails) => void;
}

const FIXED_RATE_PERIODS = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30];

export function MortgageForm({ data, onChange }: Props) {
  const set = <K extends keyof MortgageDetails>(key: K, value: MortgageDetails[K]) =>
    onChange({ ...data, [key]: value });

  const setNum = (key: keyof MortgageDetails, value: string) => {
    const num = parseFloat(value.replace(',', '.')) || 0;
    set(key as never, num as never);
  };

  const ltv =
    data.propertyValue > 0
      ? ((data.requestedAmount / data.propertyValue) * 100).toFixed(1)
      : '0.0';

  const norms = NHG_NORMS[data.nhgYear ?? 2026];
  const nhgLimit = data.includeEnergyMeasures ? norms.limitEnergy : norms.limit;
  const nhgPossible = data.propertyValue <= nhgLimit && data.propertyValue > 0;

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Hypotheekgegevens</h3>

      {/* Property */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Woning</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Woningwaarde / koopsom (€)</label>
            <input
              type="number"
              value={data.propertyValue || ''}
              onChange={(e) => setNum('propertyValue', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="350000"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gevraagd hypotheekbedrag (€)</label>
            <input
              type="number"
              value={data.requestedAmount || ''}
              onChange={(e) => setNum('requestedAmount', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="300000"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verbouwingsbudget (€)</label>
            <input
              type="number"
              value={data.renovationBudget || ''}
              onChange={(e) => setNum('renovationBudget', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min={0}
            />
            {(data.renovationBudget ?? 0) > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Totale financieringsbehoefte: {formatEuro(data.requestedAmount + (data.renovationBudget ?? 0))}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Energielabel</label>
            <div className="flex flex-wrap gap-1">
              {(['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'onbekend'] as const).map((label) => {
                const colors: Record<string, string> = {
                  'A+++': 'bg-green-800 text-white', 'A++': 'bg-green-700 text-white',
                  'A+': 'bg-green-600 text-white', 'A': 'bg-green-500 text-white',
                  'B': 'bg-lime-500 text-white', 'C': 'bg-yellow-400 text-gray-800',
                  'D': 'bg-orange-400 text-white', 'E': 'bg-orange-500 text-white',
                  'F': 'bg-red-500 text-white', 'G': 'bg-red-700 text-white',
                  'onbekend': 'bg-gray-200 text-gray-600',
                };
                const active = (data.energyLabel ?? 'onbekend') === label;
                return (
                  <button
                    key={label}
                    onClick={() => set('energyLabel', label)}
                    className={`px-2 py-0.5 rounded text-xs font-bold border-2 transition ${
                      active ? `${colors[label]} border-gray-800 shadow` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {energyAdvice(data.energyLabel ?? 'onbekend') && (
              <p className="text-xs text-green-700 mt-1">{energyAdvice(data.energyLabel ?? 'onbekend')}</p>
            )}
          </div>
        </div>

        {data.propertyValue > 0 && data.requestedAmount > 0 && (
          <div className={`rounded-lg p-2 text-sm ${parseFloat(ltv) > 100 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
            LTV (Loan-to-Value): <span className="font-semibold">{ltv}%</span>
            {parseFloat(ltv) > 100 && ' — Overschrijdt maximum van 100%'}
          </div>
        )}
      </div>

      {/* GHF year selector */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">GHF – Financieringslastnormen</h4>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Normjaar:</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {([2025, 2026] as const).map((year) => (
                <button
                  key={year}
                  onClick={() => set('ghfYear', year)}
                  className={`px-3 py-1 text-sm font-medium transition ${
                    (data.ghfYear ?? 2026) === year
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          {data.requestedAmount === 0 && (
            <p className="text-xs text-gray-400">Vul hypotheekbedrag en inkomen in om de financieringslast te zien.</p>
          )}
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">2025 norm €45k inkomen:</span>{' '}
            {getFinancingLoadPercentage(45000, 2025)}% financieringslast
          </div>
          <div>
            <span className="font-medium">2026 norm €45k inkomen:</span>{' '}
            {getFinancingLoadPercentage(45000, 2026)}% financieringslast
          </div>
        </div>
      </div>

      {/* Mortgage details */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Hypotheektype & rente</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hypotheekvorm</label>
            <select
              value={data.mortgageType}
              onChange={(e) => set('mortgageType', e.target.value as MortgageDetails['mortgageType'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="annuiteit">Annuïtair (gelijke maandlast)</option>
              <option value="lineair">Lineair (dalende maandlast)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Looptijd (jaren)</label>
            <select
              value={data.loanTerm}
              onChange={(e) => set('loanTerm', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {[10, 15, 20, 25, 30].map((y) => (
                <option key={y} value={y}>{y} jaar</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rentevaste periode</label>
            <select
              value={data.fixedRatePeriod}
              onChange={(e) => set('fixedRatePeriod', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {FIXED_RATE_PERIODS.map((y) => (
                <option key={y} value={y}>{y} jaar</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rente (% per jaar)
              {data.fixedRatePeriod < 10 && (
                <span className="ml-1 text-amber-600 text-xs">(toetsrente min. 5%)</span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.interestRate ? (data.interestRate * 100).toFixed(2) : ''}
                onChange={(e) => set('interestRate', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="4.20"
                min={0}
                max={20}
                step={0.05}
              />
              <span className="text-gray-500 text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* NHG */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">NHG – Nationale Hypotheek Garantie</h4>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="nhg"
              checked={data.nhgDesired}
              onChange={(e) => set('nhgDesired', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="nhg" className="text-sm text-gray-700">
              NHG aanvragen
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Normjaar:</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {([2025, 2026] as const).map((year) => (
                <button
                  key={year}
                  onClick={() => set('nhgYear', year)}
                  className={`px-3 py-1 text-sm font-medium transition ${
                    (data.nhgYear ?? 2026) === year
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-2">
          <div>
            <span className="font-medium">2025:</span> max. {formatEuro(NHG_NORMS[2025].limit)} &middot; energie {formatEuro(NHG_NORMS[2025].limitEnergy)}
          </div>
          <div>
            <span className="font-medium">2026:</span> max. {formatEuro(NHG_NORMS[2026].limit)} &middot; energie {formatEuro(NHG_NORMS[2026].limitEnergy)}
          </div>
        </div>

        {data.nhgDesired && (
          <>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="energy"
                checked={data.includeEnergyMeasures}
                onChange={(e) => set('includeEnergyMeasures', e.target.checked)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="energy" className="text-sm text-gray-700">
                Energiebesparende maatregelen (max. {formatEuro(norms.limitEnergy)})
              </label>
            </div>

            {!nhgPossible && data.propertyValue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  Woningwaarde overschrijdt de NHG-grens van {formatEuro(nhgLimit)}. NHG is niet mogelijk.
                </p>
              </div>
            )}

            {nhgPossible && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  NHG is mogelijk. Grens: {formatEuro(nhgLimit)}. Borgtochtprovisie: 0,6% eenmalig.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function energyAdvice(label: string): string {
  if (['A+++', 'A++', 'A+'].includes(label))
    return 'Uitstekend energielabel — mogelijkheid op groene hypotheek met rentevoordeel (~0,1–0,2%).';
  if (label === 'A')
    return 'Goed energielabel — sommige geldverstrekkers bieden een kleine rentekorting.';
  if (['E', 'F', 'G'].includes(label))
    return 'Laag energielabel — overweeg energiebesparende maatregelen voor NHG-voordeel en lagere energielasten.';
  return '';
}
