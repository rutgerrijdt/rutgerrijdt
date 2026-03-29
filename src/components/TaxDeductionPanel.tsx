'use client';

import { useState } from 'react';
import type { Application } from '@/lib/types';
import { calculateTaxDeduction, BOX1_TARIEF_1, BOX1_TARIEF_2, MAX_AFTREK_PERCENTAGE } from '@/lib/tax';
import { calculateIncomeFromSource } from '@/lib/ghf';
import { formatEuro, formatPercent } from '@/lib/utils';
import { getAnnualInterestByYear } from '@/lib/amortization';

interface Props {
  application: Application;
}

export function TaxDeductionPanel({ application }: Props) {
  const [wozOverride, setWozOverride] = useState<number>(application.mortgage.propertyValue);

  const { mortgage, applicants } = application;
  if (!mortgage.requestedAmount) return null;

  // Totaal toetsinkomen voor belastingschijf
  const totalIncome = applicants
    .flatMap((a) => a.incomeSources)
    .reduce((sum, src) => sum + calculateIncomeFromSource(src), 0);

  const tax = calculateTaxDeduction(
    mortgage.requestedAmount,
    mortgage.interestRate,
    mortgage.loanTerm,
    mortgage.mortgageType,
    totalIncome,
    wozOverride
  );

  // Jaarlijkse renteaftrek (daalt elk jaar bij annuïtair)
  const annualInterests = getAnnualInterestByYear(
    mortgage.requestedAmount,
    mortgage.interestRate,
    mortgage.loanTerm,
    mortgage.mortgageType
  );
  const annualSavings = annualInterests.map((interest) =>
    Math.round(interest * tax.effectiveTaxRate)
  );

  const showYears = Math.min(10, mortgage.loanTerm);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-emerald-700 px-4 py-3">
        <h4 className="text-white font-semibold text-sm">Hypotheekrenteaftrek – Box 1 (2026)</h4>
      </div>
      <div className="p-4 space-y-4">
        {/* Tax rates info */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <div><span className="font-medium text-gray-700">1e schijf:</span> {formatPercent(BOX1_TARIEF_1)} (t/m €38.441)</div>
          <div><span className="font-medium text-gray-700">2e schijf:</span> {formatPercent(BOX1_TARIEF_2)} (daarboven)</div>
          <div><span className="font-medium text-gray-700">Max aftrek:</span> {formatPercent(MAX_AFTREK_PERCENTAGE)}</div>
          <div><span className="font-medium text-gray-700">Uw tarief:</span> {formatPercent(tax.effectiveTaxRate)}</div>
        </div>

        {/* Net monthly breakdown */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Bruto maandlast" value={formatEuro(tax.grossMonthly)} />
          <Card label="Rentecomponent" value={formatEuro(tax.monthlyInterest)} sub="1e maand" />
          <Card label="Maandelijkse besparing" value={`−${formatEuro(tax.monthlyTaxSaving)}`} highlight sub="belastingteruggave" />
          <Card label="Netto maandlast" value={formatEuro(tax.netMonthly)} highlight sub="na aftrek (1e maand)" />
        </div>

        {/* Eigenwoningforfait */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WOZ-waarde voor eigenwoningforfait (€)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={wozOverride || ''}
              onChange={(e) => setWozOverride(parseFloat(e.target.value) || 0)}
              className="w-48 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="350000"
            />
            {tax.eigenwoningforfaitMonthly > 0 && (
              <span className="text-sm text-gray-600">
                EWF: {formatEuro(tax.eigenwoningforfaitMonthly * 12)} / jaar
                &nbsp;→ netto incl. EWF: <strong>{formatEuro(tax.netMonthlyIncludingEWF)}</strong>/mnd
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">0,35% van WOZ-waarde per jaar (2026) — is belastbaar inkomen</p>
        </div>

        {/* Annual savings table */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">
            Jaarlijkse renteaftrekbesparing (eerste {showYears} jaar)
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1 px-2 text-gray-500">Jaar</th>
                  <th className="text-right py-1 px-2 text-gray-500">Betaalde rente</th>
                  <th className="text-right py-1 px-2 text-gray-500">Belastingbesparing</th>
                </tr>
              </thead>
              <tbody>
                {annualInterests.slice(0, showYears).map((interest, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1 px-2 text-gray-600">Jaar {i + 1}</td>
                    <td className="py-1 px-2 text-right text-red-600">{formatEuro(interest)}</td>
                    <td className="py-1 px-2 text-right text-green-600 font-medium">{formatEuro(annualSavings[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold bg-emerald-50 rounded-lg p-2">
            <span className="text-gray-700">Totale besparing over {mortgage.loanTerm} jaar (indicatief)</span>
            <span className="text-emerald-700">{formatEuro(tax.totalTaxSavingLooptijd)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Alleen van toepassing bij annuïtaire of lineaire hypotheek (fiscale aflossingseis).
          Hypotheekrente is aftrekbaar voor de eigen woning in Box 1.
        </p>
      </div>
    </div>
  );
}

function Card({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-emerald-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${highlight ? 'text-emerald-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
