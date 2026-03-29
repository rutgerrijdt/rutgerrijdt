'use client';

import type { EntrepreneurIncome, ProfitYear } from '@/lib/types';
import { calculateEntrepreneurToetsinkomen, checkBusinessAge } from '@/lib/ghf';
import { formatEuro } from '@/lib/utils';

interface Props {
  data: EntrepreneurIncome;
  onChange: (data: EntrepreneurIncome) => void;
  onRemove?: () => void;
}

export function EntrepreneurIncomeForm({ data, onChange, onRemove }: Props) {
  const set = <K extends keyof EntrepreneurIncome>(key: K, value: EntrepreneurIncome[K]) =>
    onChange({ ...data, [key]: value });

  const setYear = (field: 'year1' | 'year2' | 'year3', key: keyof ProfitYear, value: string) => {
    const num = parseFloat(value.replace(',', '.')) || 0;
    onChange({ ...data, [field]: { ...data[field], [key]: num } });
  };

  const toetsinkomen = calculateEntrepreneurToetsinkomen(data);
  const ageCheck = checkBusinessAge(data);

  const isDGA = data.businessType === 'bv_dga';

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-green-50">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-green-800">Inkomen als ondernemer</h4>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Type onderneming</label>
          <select
            value={data.businessType}
            onChange={(e) => set('businessType', e.target.value as EntrepreneurIncome['businessType'])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="zzp">ZZP / Eenmanszaak</option>
            <option value="bv_dga">BV – Directeur-grootaandeelhouder (DGA)</option>
            <option value="vof">VOF – Vennootschap onder firma</option>
            <option value="maatschap">Maatschap</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => set('businessName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Mijn Bedrijf BV"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">KvK-nummer</label>
          <input
            type="text"
            value={data.kvkNumber}
            onChange={(e) => set('kvkNumber', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="12345678"
            maxLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum onderneming</label>
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Bedrijfsleeftijd waarschuwing */}
      {data.startDate && !ageCheck.ok && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            Onderneming is {ageCheck.yearsActive} {ageCheck.yearsActive === 1 ? 'jaar' : 'jaar'} actief.
            De meeste geldverstrekkers vereisen minimaal {ageCheck.minRequired} jaar.
          </p>
        </div>
      )}

      {/* DGA specifiek */}
      {isDGA && (
        <div className="border-t border-green-200 pt-4">
          <h5 className="text-sm font-semibold text-green-700 mb-3">DGA / BV inkomen</h5>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DGA-loon (bruto per jaar, €)</label>
              <input
                type="number"
                value={data.dgaSalary ?? ''}
                onChange={(e) => set('dgaSalary', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="50000"
                min={0}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimaal gebruikelijk loon 2025: €56.000
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dividend (structureel, €/jaar)</label>
              <input
                type="number"
                value={data.dgaDividend ?? ''}
                onChange={(e) => set('dgaDividend', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min={0}
              />
              <p className="text-xs text-gray-500 mt-1">
                Dividend wordt doorgaans niet meegenomen tenzij structureel aangetoond.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ZZP / VOF / Maatschap: 3 jaar winst */}
      {!isDGA && (
        <div className="border-t border-green-200 pt-4">
          <h5 className="text-sm font-semibold text-green-700 mb-1">Fiscale winst laatste 3 jaar</h5>
          <p className="text-xs text-gray-500 mb-3">
            Toetsinkomen = gemiddelde van 3 jaar (fiscale winst + afschrijvingen)
          </p>
          <div className="space-y-3">
            {(['year1', 'year2', 'year3'] as const).map((fy, i) => (
              <div key={fy} className="border border-green-200 rounded-lg p-3 bg-white">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jaar</label>
                    <input
                      type="number"
                      value={data[fy].year || ''}
                      onChange={(e) => setYear(fy, 'year', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={String(new Date().getFullYear() - 3 + i)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fiscale winst (€)</label>
                    <input
                      type="number"
                      value={data[fy].fiscalProfit || ''}
                      onChange={(e) => setYear(fy, 'fiscalProfit', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="40000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Optelling (afschr. e.d.)</label>
                    <input
                      type="number"
                      value={data[fy].addBackItems || ''}
                      onChange={(e) => setYear(fy, 'addBackItems', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toetsinkomen samenvatting */}
      {toetsinkomen > 0 && (
        <div className="bg-green-100 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <span className="font-semibold">Toetsinkomen:</span> {formatEuro(toetsinkomen)} per jaar
          </p>
          <p className="text-xs text-green-700 mt-1">
            {isDGA
              ? 'Op basis van DGA-loon'
              : 'Gemiddelde van 3 jaar fiscale winst + optelposten'}
          </p>
        </div>
      )}
    </div>
  );
}
