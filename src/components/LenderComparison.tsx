'use client';

// Indicatieve rentetarieven grote Nederlandse geldverstrekkers (Q1 2026)
// Let op: dit zijn indicatieve tarieven — altijd actueel tarief opvragen bij geldverstrekker

import type { MortgageDetails } from '@/lib/types';
import { NHG_NORMS } from '@/lib/nhg';
import { calculateActualMonthlyPayment } from '@/lib/ghf';
import { formatEuro, formatPercent } from '@/lib/utils';

interface LenderRate {
  name: string;
  logo: string; // Emoji als placeholder
  rate10yrNHG: number;
  rate10yrNoNHG: number;
  rate20yrNHG: number;
  rate20yrNoNHG: number;
  nhgSurcharge: number; // extra provisie NHG
  greenDiscount: number; // korting energielabel A of beter
  minIncome: number;
  maxLTV: number;
  notes?: string;
}

// Indicatieve tarieven Q1 2026 (niet actueel – alleen ter illustratie)
const LENDERS: LenderRate[] = [
  { name: 'ABN AMRO', logo: '🏦', rate10yrNHG: 0.0389, rate10yrNoNHG: 0.0419, rate20yrNHG: 0.0409, rate20yrNoNHG: 0.0439, nhgSurcharge: 0, greenDiscount: 0.001, minIncome: 18000, maxLTV: 100, notes: 'Groene hypotheek beschikbaar' },
  { name: 'Rabobank',  logo: '🌱', rate10yrNHG: 0.0385, rate10yrNoNHG: 0.0415, rate20yrNHG: 0.0405, rate20yrNoNHG: 0.0435, nhgSurcharge: 0, greenDiscount: 0.002, minIncome: 18000, maxLTV: 100, notes: 'Extra korting bij A+++ label' },
  { name: 'ING',       logo: '🦁', rate10yrNHG: 0.0392, rate10yrNoNHG: 0.0422, rate20yrNHG: 0.0412, rate20yrNoNHG: 0.0442, nhgSurcharge: 0, greenDiscount: 0.001, minIncome: 20000, maxLTV: 100 },
  { name: 'Nationale-Nederlanden', logo: '🔶', rate10yrNHG: 0.0381, rate10yrNoNHG: 0.0411, rate20yrNHG: 0.0401, rate20yrNoNHG: 0.0431, nhgSurcharge: 0, greenDiscount: 0.0015, minIncome: 18000, maxLTV: 100, notes: 'Gunstig voor starters' },
  { name: 'Obvion',    logo: '🟠', rate10yrNHG: 0.0378, rate10yrNoNHG: 0.0408, rate20yrNHG: 0.0398, rate20yrNoNHG: 0.0428, nhgSurcharge: 0, greenDiscount: 0.001, minIncome: 18000, maxLTV: 100, notes: 'Voorkeur voor NHG' },
  { name: 'Aegon',     logo: '🦅', rate10yrNHG: 0.0384, rate10yrNoNHG: 0.0414, rate20yrNHG: 0.0404, rate20yrNoNHG: 0.0434, nhgSurcharge: 0, greenDiscount: 0.001, minIncome: 20000, maxLTV: 100 },
];

interface Props {
  mortgage: MortgageDetails;
}

export function LenderComparison({ mortgage }: Props) {
  if (!mortgage.requestedAmount) return null;

  const nhgEligible =
    mortgage.nhgDesired &&
    mortgage.propertyValue <= NHG_NORMS[mortgage.nhgYear ?? 2026].limit;

  const energyGood = ['A+++', 'A++', 'A+', 'A'].includes(mortgage.energyLabel ?? 'onbekend');

  const getRateForLender = (lender: LenderRate): number => {
    let base: number;
    if (mortgage.fixedRatePeriod <= 10) {
      base = nhgEligible ? lender.rate10yrNHG : lender.rate10yrNoNHG;
    } else {
      base = nhgEligible ? lender.rate20yrNHG : lender.rate20yrNoNHG;
    }
    if (energyGood) base -= lender.greenDiscount;
    return Math.max(0.01, base);
  };

  const rows = LENDERS.map((lender) => {
    const rate = getRateForLender(lender);
    const payment = calculateActualMonthlyPayment(
      mortgage.requestedAmount,
      rate,
      mortgage.loanTerm,
      mortgage.mortgageType
    );
    return { lender, rate, monthly: payment.firstMonth, totalInterest: payment.totalInterest };
  }).sort((a, b) => a.rate - b.rate);

  const cheapest = rows[0];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-900 px-4 py-3">
        <h4 className="text-white font-semibold text-sm">Indicatieve geldverstrekkersvergelijking (Q1 2026)</h4>
        <p className="text-gray-400 text-xs mt-0.5">Illustratief — raadpleeg altijd actuele tarieven bij de geldverstrekker</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span className={`px-2 py-0.5 rounded-full ${nhgEligible ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
            {nhgEligible ? '✓ NHG' : '— Geen NHG'}
          </span>
          <span className={`px-2 py-0.5 rounded-full ${energyGood ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
            Energielabel: {mortgage.energyLabel ?? 'onbekend'} {energyGood ? '→ groenkorting' : ''}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Rentevaste periode: {mortgage.fixedRatePeriod} jaar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-1.5 px-2 text-xs text-gray-500 font-medium">Geldverstrekker</th>
                <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium">Rente</th>
                <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium">Maandlast</th>
                <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium hidden sm:table-cell">Totale rente</th>
                <th className="text-right py-1.5 px-2 text-xs text-gray-500 font-medium hidden md:table-cell">vs. goedkoopste</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ lender, rate, monthly, totalInterest }, i) => {
                const isCheapest = i === 0;
                const extraMonthly = monthly - cheapest.monthly;
                const extraTotal = totalInterest - cheapest.totalInterest;
                return (
                  <tr key={lender.name} className={`border-b border-gray-50 ${isCheapest ? 'bg-green-50' : ''}`}>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span>{lender.logo}</span>
                        <div>
                          <span className="font-medium text-gray-800">{lender.name}</span>
                          {isCheapest && (
                            <span className="ml-1.5 text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">laagste</span>
                          )}
                          {lender.notes && (
                            <p className="text-xs text-gray-400">{lender.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`py-2 px-2 text-right font-semibold ${isCheapest ? 'text-green-700' : 'text-gray-700'}`}>
                      {formatPercent(rate)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-700">{formatEuro(monthly)}</td>
                    <td className="py-2 px-2 text-right text-gray-600 hidden sm:table-cell">{formatEuro(totalInterest)}</td>
                    <td className="py-2 px-2 text-right hidden md:table-cell">
                      {isCheapest ? (
                        <span className="text-green-600 font-medium">—</span>
                      ) : (
                        <span className="text-red-500 text-xs">
                          +{formatEuro(extraMonthly)}/mnd
                          <br />
                          +{formatEuro(extraTotal)} totaal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          Tarieven zijn indicatief en gebaseerd op openbare informatie Q1 2026.
          Definitieve tarieven en acceptatiecriteria via de geldverstrekker of een onafhankelijk adviseur.
        </p>
      </div>
    </div>
  );
}
