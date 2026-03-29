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

      {/* Inkomenstrend + toetsinkomen */}
      {!isDGA && toetsinkomen > 0 && (() => {
        const p1 = data.year1.fiscalProfit + data.year1.addBackItems;
        const p2 = data.year2.fiscalProfit + data.year2.addBackItems;
        const p3 = data.year3.fiscalProfit + data.year3.addBackItems;
        const allFilled = p1 > 0 && p2 > 0 && p3 > 0;
        const trend = allFilled
          ? p3 > p2 && p2 > p1 ? 'stijgend'
            : p3 < p2 && p2 < p1 ? 'dalend'
            : p3 > p1 ? 'licht stijgend'
            : p3 < p1 ? 'licht dalend'
            : 'stabiel'
          : null;
        const trendColor = trend?.includes('stijgend') ? 'text-green-700' : trend?.includes('dalend') ? 'text-red-600' : 'text-amber-600';
        const trendIcon = trend?.includes('stijgend') ? '↗' : trend?.includes('dalend') ? '↘' : '→';
        return (
          <div className="bg-green-100 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Toetsinkomen:</span> {formatEuro(toetsinkomen)} per jaar
              </p>
              {trend && (
                <span className={`text-sm font-semibold ${trendColor}`}>{trendIcon} {trend}</span>
              )}
            </div>
            {allFilled && (
              <div className="flex gap-2 items-end h-8 mt-1">
                {[p1, p2, p3].map((p, i) => {
                  const maxP = Math.max(p1, p2, p3);
                  const h = maxP > 0 ? (p / maxP) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                      <div
                        className={`w-full rounded-t ${trend?.includes('stijgend') ? 'bg-green-500' : trend?.includes('dalend') ? 'bg-red-400' : 'bg-amber-400'}`}
                        style={{ height: `${h}%` }}
                        title={formatEuro(p)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-green-700">
              Gemiddelde van 3 jaar fiscale winst + optelposten
              {trend === 'dalend' && ' — let op: geldverstrekkers kunnen het laagste jaar hanteren'}
            </p>
          </div>
        );
      })()}
      {isDGA && toetsinkomen > 0 && (
        <div className="bg-green-100 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <span className="font-semibold">Toetsinkomen:</span> {formatEuro(toetsinkomen)} per jaar
          </p>
          <p className="text-xs text-green-700 mt-1">Op basis van DGA-loon</p>
        </div>
      )}
    </div>
  );
}
