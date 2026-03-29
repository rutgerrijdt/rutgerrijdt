'use client';

import { useState } from 'react';
import { buildAmortizationSchedule } from '@/lib/amortization';
import { formatEuro } from '@/lib/utils';

interface Props {
  loanAmount: number;
  annualRate: number;
  termYears: number;
  type: 'annuiteit' | 'lineair';
  startYear?: number;
}

export function AmortizationTable({ loanAmount, annualRate, termYears, type, startYear }: Props) {
  const [view, setView] = useState<'years' | 'months'>('years');
  const [showAll, setShowAll] = useState(false);

  if (!loanAmount || !annualRate || !termYears) return null;

  const { months, years } = buildAmortizationSchedule(loanAmount, annualRate, termYears, type, startYear);

  // Grafiek data: restschuld per jaar als percentage
  const maxBalance = loanAmount;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
        <h4 className="text-white font-semibold text-sm">Aflossingsschema</h4>
        <div className="flex rounded-lg overflow-hidden border border-slate-500">
          {(['years', 'months'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium transition ${
                view === v ? 'bg-white text-slate-700' : 'text-slate-300 hover:bg-slate-600'
              }`}
            >
              {v === 'years' ? 'Per jaar' : 'Per maand'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Grafiek – restschuld */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Restschuld over de looptijd</p>
          <div className="flex items-end gap-0.5 h-16">
            {years.map((y) => {
              const height = maxBalance > 0 ? (y.closingBalance / maxBalance) * 100 : 0;
              return (
                <div
                  key={y.year}
                  title={`Jaar ${y.year}: ${formatEuro(y.closingBalance)}`}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-400 transition-colors cursor-pointer"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Jaar 1</span>
            <span>Jaar {Math.floor(termYears / 2)}</span>
            <span>Jaar {termYears}</span>
          </div>
        </div>

        {view === 'years' ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Jaar</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Openingsaldo</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Rente</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Aflossing</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Restschuld</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium hidden sm:table-cell">Maandlast</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAll ? years : years.slice(0, 10)).map((y) => (
                    <tr key={y.year} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-1.5 px-2 font-medium text-gray-700">
                        {y.year}
                        <span className="text-gray-400 font-normal ml-1">({y.calendarYear})</span>
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{formatEuro(y.openingBalance)}</td>
                      <td className="py-1.5 px-2 text-right text-red-600">{formatEuro(y.interestPaid)}</td>
                      <td className="py-1.5 px-2 text-right text-green-600">{formatEuro(y.principalPaid)}</td>
                      <td className="py-1.5 px-2 text-right font-semibold text-gray-700">{formatEuro(y.closingBalance)}</td>
                      <td className="py-1.5 px-2 text-right hidden sm:table-cell text-gray-600">{formatEuro(y.monthlyPayment)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="py-1.5 px-2 font-semibold text-gray-700" colSpan={2}>Totaal</td>
                    <td className="py-1.5 px-2 text-right font-semibold text-red-700">
                      {formatEuro(years.reduce((s, y) => s + y.interestPaid, 0))}
                    </td>
                    <td className="py-1.5 px-2 text-right font-semibold text-green-700">
                      {formatEuro(years.reduce((s, y) => s + y.principalPaid, 0))}
                    </td>
                    <td className="py-1.5 px-2 text-right font-semibold">€0</td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
            {years.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                {showAll ? 'Minder tonen' : `Alle ${years.length} jaar tonen`}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Maand</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Maandlast</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Rente</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Aflossing</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Restschuld</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.month} className={`border-b border-gray-50 hover:bg-gray-50 ${m.month % 12 === 0 ? 'bg-blue-50' : ''}`}>
                      <td className="py-1 px-2 text-gray-600">
                        {m.month}
                        {m.month % 12 === 0 && <span className="ml-1 text-blue-600 font-medium">Jaar {m.year}</span>}
                      </td>
                      <td className="py-1 px-2 text-right text-gray-700">{formatEuro(m.monthlyPayment)}</td>
                      <td className="py-1 px-2 text-right text-red-600">{formatEuro(m.interestPaid)}</td>
                      <td className="py-1 px-2 text-right text-green-600">{formatEuro(m.principalPaid)}</td>
                      <td className="py-1 px-2 text-right font-medium text-gray-700">{formatEuro(m.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">{months.length} maanden totaal — scroll om alle maanden te bekijken</p>
          </>
        )}
      </div>
    </div>
  );
}
