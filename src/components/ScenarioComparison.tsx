'use client';

import { useState } from 'react';
import type { MortgageDetails } from '@/lib/types';
import { annuityFactor, calculateActualMonthlyPayment } from '@/lib/ghf';
import { checkNHG } from '@/lib/nhg';
import { formatEuro, formatPercent } from '@/lib/utils';

interface Scenario {
  label: string;
  amount: number;
  rate: number;
  fixedPeriod: number;
  term: number;
  type: 'annuiteit' | 'lineair';
  nhgYear: 2025 | 2026;
}

interface Props {
  baseMortgage: MortgageDetails;
  propertyValue: number;
}

function buildScenario(base: MortgageDetails, idx: number): Scenario {
  const offsets = [0, 25_000, -25_000];
  return {
    label: idx === 0 ? 'Basisscenario' : idx === 1 ? 'Scenario B (+€25k)' : 'Scenario C (−€25k)',
    amount: Math.max(0, base.requestedAmount + offsets[idx]),
    rate: base.interestRate,
    fixedPeriod: base.fixedRatePeriod,
    term: base.loanTerm,
    type: base.mortgageType,
    nhgYear: base.nhgYear ?? 2026,
  };
}

export function ScenarioComparison({ baseMortgage, propertyValue }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>(() =>
    [0, 1, 2].map((i) => buildScenario(baseMortgage, i))
  );

  const update = (idx: number, updates: Partial<Scenario>) =>
    setScenarios((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)));

  const resetFromBase = () => setScenarios([0, 1, 2].map((i) => buildScenario(baseMortgage, i)));

  const results = scenarios.map((sc) => {
    const payment = calculateActualMonthlyPayment(sc.amount, sc.rate, sc.term, sc.type);
    const nhgCheck = checkNHG({
      ...baseMortgage,
      requestedAmount: sc.amount,
      interestRate: sc.rate,
      fixedRatePeriod: sc.fixedPeriod,
      loanTerm: sc.term,
      mortgageType: sc.type,
      nhgYear: sc.nhgYear,
    });
    const ltv = propertyValue > 0 ? (sc.amount / propertyValue) * 100 : 0;
    return { payment, nhg: nhgCheck, ltv };
  });

  const COLORS = ['bg-blue-600', 'bg-green-600', 'bg-purple-600'];
  const LIGHT = ['bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200'];
  const TEXT = ['text-blue-700', 'text-green-700', 'text-purple-700'];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <h4 className="text-white font-semibold text-sm">Scenariovergeliking – 3 opties naast elkaar</h4>
        <button
          onClick={resetFromBase}
          className="text-xs text-gray-300 hover:text-white border border-gray-600 rounded px-2 py-1"
        >
          Reset
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {scenarios.map((sc, i) => (
          <div key={i} className={`border rounded-xl p-4 space-y-3 ${LIGHT[i]}`}>
            {/* Header */}
            <div className={`${COLORS[i]} text-white text-xs font-bold px-2 py-1 rounded-lg text-center`}>
              {sc.label}
            </div>

            {/* Inputs */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Bedrag (€)</label>
                <input
                  type="number"
                  value={sc.amount || ''}
                  onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">Rente (%)</label>
                  <input
                    type="number"
                    value={sc.rate ? (sc.rate * 100).toFixed(2) : ''}
                    onChange={(e) => update(i, { rate: (parseFloat(e.target.value) || 0) / 100 })}
                    step={0.05}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">Looptijd</label>
                  <select
                    value={sc.term}
                    onChange={(e) => update(i, { term: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
                  >
                    {[10, 15, 20, 25, 30].map((y) => <option key={y} value={y}>{y}jr</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Hypotheekvorm</label>
                <select
                  value={sc.type}
                  onChange={(e) => update(i, { type: e.target.value as 'annuiteit' | 'lineair' })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
                >
                  <option value="annuiteit">Annuïtair</option>
                  <option value="lineair">Lineair</option>
                </select>
              </div>
            </div>

            {/* Results */}
            {sc.amount > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/50">
                <ResultRow label="1e maandlast" value={formatEuro(results[i].payment.firstMonth)} highlight textClass={TEXT[i]} />
                {sc.type === 'lineair' && (
                  <ResultRow label="Laatste maand" value={formatEuro(results[i].payment.lastMonth)} />
                )}
                <ResultRow label="Totale rente" value={formatEuro(results[i].payment.totalInterest)} />
                <ResultRow label="Totaal betaald" value={formatEuro(results[i].payment.totalRepayment)} />
                <ResultRow
                  label="LTV"
                  value={`${results[i].ltv.toFixed(1)}%`}
                  warn={results[i].ltv > 100}
                />
                <ResultRow
                  label="NHG mogelijk"
                  value={results[i].nhg.eligible ? 'Ja ✓' : 'Nee'}
                  warn={!results[i].nhg.eligible}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison bar chart: monthly payment */}
      {scenarios.every((sc) => sc.amount > 0) && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">Maandlast vergelijking (1e maand)</p>
          <div className="space-y-2">
            {scenarios.map((sc, i) => {
              const maxMonthly = Math.max(...results.map((r) => r.payment.firstMonth));
              const width = maxMonthly > 0 ? (results[i].payment.firstMonth / maxMonthly) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-28 shrink-0">{sc.label}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${COLORS[i]} rounded-full transition-all`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-20 text-right">
                    {formatEuro(results[i].payment.firstMonth)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, highlight, warn, textClass }: {
  label: string; value: string; highlight?: boolean; warn?: boolean; textClass?: string;
}) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${warn ? 'text-red-600' : highlight ? (textClass ?? 'text-gray-800') : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}
