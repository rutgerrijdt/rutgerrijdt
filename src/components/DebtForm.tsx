'use client';

import type { DebtItem, DebtType } from '@/lib/debts';
import {
  calculateMonthlyObligation,
  totalMonthlyObligations,
  emptyDebt,
  DEBT_LABELS,
  debtImpactOnMortgage,
} from '@/lib/debts';
import { formatEuro } from '@/lib/utils';

interface Props {
  debts: DebtItem[];
  onChange: (debts: DebtItem[]) => void;
  interestRate?: number;
  loanTerm?: number;
}

// Types where originalAmount drives the calculation
const AMOUNT_DRIVEN: DebtType[] = ['studieschuld_oud', 'studieschuld_nieuw', 'doorlopend_krediet', 'roodstand'];
// Types where monthly payment is entered directly
const PAYMENT_DRIVEN: DebtType[] = ['persoonlijke_lening', 'huurkoop', 'alimentatie', 'andere_hypotheek', 'overig'];

export function DebtForm({ debts, onChange, interestRate = 0.05, loanTerm = 30 }: Props) {
  const add = () => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `debt-${Date.now()}`;
    onChange([...debts, { ...emptyDebt(), id }]);
  };

  const remove = (id: string) => onChange(debts.filter((d) => d.id !== id));

  const update = (id: string, updates: Partial<DebtItem>) =>
    onChange(debts.map((d) => (d.id === id ? { ...d, ...updates } : d)));

  const totalMonthly = totalMonthlyObligations(debts);
  const totalImpact = debtImpactOnMortgage(totalMonthly, interestRate, loanTerm);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Schulden & verplichtingen</h3>
        <p className="text-sm text-gray-500 mt-1">
          Bestaande kredietverplichtingen verlagen uw maximale hypotheek (GHF art. 6).
          Voeg alleen lopende verplichtingen toe.
        </p>
      </div>

      {debts.length === 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Geen schulden opgegeven — maximale hypotheek wordt niet verlaagd.</p>
        </div>
      )}

      {debts.map((debt) => {
        const isAmountDriven = AMOUNT_DRIVEN.includes(debt.type);
        const monthly = calculateMonthlyObligation(debt);
        const impact = debtImpactOnMortgage(monthly, interestRate, loanTerm);

        return (
          <div key={debt.id} className="border border-orange-200 rounded-xl p-4 bg-orange-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-800">Schuld / verplichting</span>
              <button
                onClick={() => remove(debt.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Verwijderen
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type schuld</label>
                <select
                  value={debt.type}
                  onChange={(e) => update(debt.id, { type: e.target.value as DebtType, monthlyPayment: 0, originalAmount: 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  {(Object.entries(DEBT_LABELS) as [DebtType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Omschrijving</label>
                <input
                  type="text"
                  value={debt.description}
                  onChange={(e) => update(debt.id, { description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="bv. ABN AMRO persoonlijke lening"
                />
              </div>

              {isAmountDriven ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {debt.type.startsWith('studieschuld') ? 'Oorspronkelijk leenbedrag (€)' : 'Kredietlimiet (€)'}
                  </label>
                  <input
                    type="number"
                    value={debt.originalAmount || ''}
                    onChange={(e) => update(debt.id, { originalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="25000"
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {debt.type === 'studieschuld_nieuw' && 'Fictieve last = 0,45% per maand'}
                    {debt.type === 'studieschuld_oud' && 'Fictieve last = 0,75% per maand'}
                    {(debt.type === 'doorlopend_krediet' || debt.type === 'roodstand') && 'Last = 2% van limiet per maand'}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Werkelijke maandlast (€)</label>
                  <input
                    type="number"
                    value={debt.monthlyPayment || ''}
                    onChange={(e) => update(debt.id, { monthlyPayment: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="350"
                    min={0}
                  />
                </div>
              )}
            </div>

            {monthly > 0 && (
              <div className="bg-white rounded-lg p-2 text-xs text-orange-700 flex gap-4">
                <span>Maandlast: <strong>{formatEuro(monthly)}</strong></span>
                <span>Verlaging max. hypotheek: <strong>−{formatEuro(impact)}</strong></span>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={add}
        className="w-full py-2.5 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 hover:bg-orange-50 text-sm font-medium transition"
      >
        + Schuld / verplichting toevoegen
      </button>

      {totalMonthly > 0 && (
        <div className="bg-orange-100 border border-orange-300 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-orange-900 mb-2">Totaaloverzicht schulden</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-orange-700">Totale maandlast schulden</p>
              <p className="text-lg font-bold text-orange-900">{formatEuro(totalMonthly)}</p>
            </div>
            <div>
              <p className="text-xs text-orange-700">Verlaging max. hypotheek</p>
              <p className="text-lg font-bold text-red-700">−{formatEuro(totalImpact)}</p>
            </div>
          </div>
          <p className="text-xs text-orange-600 mt-2">
            U kunt dit verminderen door schulden vóór de hypotheekaanvraag af te lossen.
          </p>
        </div>
      )}
    </div>
  );
}
