'use client';

import { BEDRIJFSVORM_INFO, type Bedrijfsgegevens, type Bedrijfsvorm } from '@/lib/jaarcijfers';

interface Props {
  data: Bedrijfsgegevens;
  onChange: (data: Bedrijfsgegevens) => void;
}

export function StepBedrijfsgegevens({ data, onChange }: Props) {
  const set = <K extends keyof Bedrijfsgegevens>(key: K, value: Bedrijfsgegevens[K]) =>
    onChange({ ...data, [key]: value });

  const huidigBoekjaar = new Date().getFullYear();
  const boekjaarOpties = Array.from({ length: 6 }, (_, i) => String(huidigBoekjaar - i));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Bedrijfsgegevens</h2>
        <p className="text-sm text-gray-500">
          Vul de basisgegevens in van de onderneming waarvan u de jaarcijfers wilt analyseren.
        </p>
      </div>

      {/* Bedrijfsvorm selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Rechtsvorm / Bedrijfsvorm</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(BEDRIJFSVORM_INFO) as Bedrijfsvorm[]).map((vorm) => {
            const info = BEDRIJFSVORM_INFO[vorm];
            const selected = data.bedrijfsvorm === vorm;
            return (
              <button
                key={vorm}
                type="button"
                onClick={() => set('bedrijfsvorm', vorm)}
                className={`text-left p-3 rounded-xl border-2 transition ${
                  selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                    {info.label}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      info.isIB ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {info.isIB ? 'IB' : 'VPB'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{info.omschrijving}</p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          <strong>IB</strong> = inkomstenbelasting (privé aangifte) &nbsp;·&nbsp;
          <strong>VPB</strong> = vennootschapsbelasting (zakelijke aangifte)
        </p>
      </div>

      {/* Bedrijfsnaam & KvK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
          <input
            type="text"
            value={data.naam}
            onChange={(e) => set('naam', e.target.value)}
            placeholder="Naam onderneming"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">KvK-nummer</label>
          <input
            type="text"
            value={data.kvkNummer}
            onChange={(e) => set('kvkNummer', e.target.value)}
            placeholder="12345678"
            maxLength={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boekjaar</label>
          <select
            value={data.boekjaar}
            onChange={(e) => set('boekjaar', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {boekjaarOpties.map((jaar) => (
              <option key={jaar} value={jaar}>
                {jaar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sector / Branche <span className="text-gray-400 font-normal">(optioneel)</span>
          </label>
          <input
            type="text"
            value={data.sector}
            onChange={(e) => set('sector', e.target.value)}
            placeholder="bijv. Bouw, Retail, ICT, Horeca…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contactpersoon <span className="text-gray-400 font-normal">(optioneel)</span>
          </label>
          <input
            type="text"
            value={data.contactpersoon}
            onChange={(e) => set('contactpersoon', e.target.value)}
            placeholder="Naam accountmanager of ondernemer"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Info box */}
      {data.bedrijfsvorm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>{BEDRIJFSVORM_INFO[data.bedrijfsvorm].label}</strong>
          {' — '}
          {BEDRIJFSVORM_INFO[data.bedrijfsvorm].isIB
            ? 'IB-ondernemer: de ondernemersaftrek en MKB-winstvrijstelling zijn van toepassing. U kunt deze invullen bij de W&V-stap.'
            : 'VPB-plichtig: vennootschapsbelasting en eventueel DGA-salaris zijn van toepassing. U kunt dit invullen bij de W&V-stap.'}
        </div>
      )}
    </div>
  );
}
