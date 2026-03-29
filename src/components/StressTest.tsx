'use client';

import type { Application } from '@/lib/types';
import { calculateActualMonthlyPayment } from '@/lib/ghf';
import { formatEuro, formatPercent } from '@/lib/utils';

interface Props {
  application: Application;
  currentMonthly: number;
}

const TEST_RATES = [0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.08, 0.09, 0.10];

export function StressTest({ application, currentMonthly }: Props) {
  const { mortgage } = application;
  if (!mortgage.requestedAmount) return null;

  const rows = TEST_RATES.map((rate) => {
    const payment = calculateActualMonthlyPayment(
      mortgage.requestedAmount,
      rate,
      mortgage.loanTerm,
      mortgage.mortgageType
    );
    const delta = payment.firstMonth - currentMonthly;
    const isCurrent = Math.abs(rate - mortgage.interestRate) < 0.0001;
    return { rate, monthly: payment.firstMonth, delta, isCurrent };
  });

  // Maandinkomen schatten voor betaalbaarheidsratio
  const toetsMonthlyIncome =
    application.applicants
      .flatMap((a) => a.incomeSources)
      .reduce((sum, src) => {
        if (src.kind === 'employed') {
          return sum + (src.grossAnnualSalary + src.holidayAllowance + src.thirteenthMonth) / 12;
        }
        return sum;
      }, 0);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-purple-600 px-4 py-3">
        <h4 className="text-white font-semibold text-sm">Rentestresstest – betaalbaarheid bij hogere rente</h4>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-3">
          Wat zijn uw maandlasten als de rente na de rentevaste periode stijgt?
          Huidige rente: {formatPercent(mortgage.interestRate)} &middot; {mortgage.mortgageType} &middot; {mortgage.loanTerm} jaar
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-1.5 px-2 text-xs text-gray-500 font-medium">Rente</th>
                <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium">Maandlast</th>
                <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium">Verschil</th>
                {toetsMonthlyIncome > 0 && (
                  <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium">% inkomen</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rate, monthly, delta, isCurrent }) => {
                const incomeRatio = toetsMonthlyIncome > 0 ? (monthly / toetsMonthlyIncome) * 100 : null;
                const isHigh = incomeRatio !== null && incomeRatio > 35;
                return (
                  <tr
                    key={rate}
                    className={`border-b border-gray-50 ${isCurrent ? 'bg-purple-50 font-semibold' : ''}`}
                  >
                    <td className="py-1.5 px-2">
                      {formatPercent(rate)}
                      {isCurrent && (
                        <span className="ml-1.5 text-xs bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">
                          huidig
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right">{formatEuro(monthly)}</td>
                    <td className={`py-1.5 px-2 text-right ${delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${formatEuro(delta)}`}
                    </td>
                    {toetsMonthlyIncome > 0 && incomeRatio !== null && (
                      <td className={`py-1.5 px-2 text-right ${isHigh ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {incomeRatio.toFixed(1)}%
                        {isHigh && ' ⚠️'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Aanbeveling: controleer of u de lasten ook bij 6–7% kunt dragen.
        </p>
      </div>
    </div>
  );
}
