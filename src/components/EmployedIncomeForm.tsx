'use client';

import type { EmployedIncome } from '@/lib/types';
import { formatEuro } from '@/lib/utils';

interface Props {
  data: EmployedIncome;
  onChange: (data: EmployedIncome) => void;
  onRemove?: () => void;
}

export function EmployedIncomeForm({ data, onChange, onRemove }: Props) {
  const set = <K extends keyof EmployedIncome>(key: K, value: EmployedIncome[K]) =>
    onChange({ ...data, [key]: value });

  const setNum = (key: keyof EmployedIncome, value: string) => {
    const num = parseFloat(value.replace(',', '.')) || 0;
    set(key as never, num as never);
  };

  const toetsinkomen =
    data.grossAnnualSalary +
    data.holidayAllowance +
    data.thirteenthMonth +
    data.irregularityAllowance +
    data.otherAllowances;

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-blue-50">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-blue-800">Inkomen in loondienst</h4>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Verwijderen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type dienstverband</label>
          <select
            value={data.employmentType}
            onChange={(e) => set('employmentType', e.target.value as EmployedIncome['employmentType'])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="vast">Vast contract</option>
            <option value="tijdelijk">Tijdelijk contract</option>
            <option value="uitzend">Uitzendkracht</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Werkgever</label>
          <input
            type="text"
            value={data.employer}
            onChange={(e) => set('employer', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Naam werkgever"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">In dienst sinds</label>
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bruto jaarsalaris (€)</label>
          <input
            type="number"
            value={data.grossAnnualSalary || ''}
            onChange={(e) => setNum('grossAnnualSalary', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="45000"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vakantiegeld (€)</label>
          <input
            type="number"
            value={data.holidayAllowance || ''}
            onChange={(e) => setNum('holidayAllowance', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="3600"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">13e maand / eindejaarsuitkering (€)</label>
          <input
            type="number"
            value={data.thirteenthMonth || ''}
            onChange={(e) => setNum('thirteenthMonth', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Onregelmatigheidstoeslag (€)</label>
          <input
            type="number"
            value={data.irregularityAllowance || ''}
            onChange={(e) => setNum('irregularityAllowance', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overige vaste toeslagen (€)</label>
          <input
            type="number"
            value={data.otherAllowances || ''}
            onChange={(e) => setNum('otherAllowances', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min={0}
          />
        </div>
      </div>

      {toetsinkomen > 0 && (
        <div className="bg-blue-100 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Toetsinkomen:</span> {formatEuro(toetsinkomen)} per jaar
          </p>
          {data.employmentType === 'tijdelijk' && (
            <p className="text-xs text-amber-700 mt-1">
              Let op: met een tijdelijk contract vragen geldverstrekkers vaak een intentieverklaring van de werkgever.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
