'use client';

import { type WinstVerlies, type Bedrijfsvorm, BEDRIJFSVORM_INFO, formatEuro } from '@/lib/jaarcijfers';

interface Props {
  data: WinstVerlies;
  bedrijfsvorm: Bedrijfsvorm;
  onChange: (data: WinstVerlies) => void;
  brutowinst: number;
  totaleBedrijfskosten: number;
  ebit: number;
  ebitda: number;
  resultaatVoorBelasting: number;
  nettoresultaat: number;
  ondernemersaftrek: number;
  belastbaarInkomenVoorMKB: number;
  mkbVrijstelling: number;
  belastbaarInkomen: number;
}

function NumInput({
  label,
  value,
  onChange,
  indent = false,
  hint,
  negative = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  indent?: boolean;
  hint?: string;
  negative?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${indent ? 'pl-3 border-l-2 border-gray-100' : ''}`}>
      <div className="flex-1 min-w-0 pr-3">
        <span className="text-sm text-gray-700">
          {negative && <span className="text-red-400 mr-1">−</span>}
          {label}
        </span>
        {hint && <span className="block text-xs text-gray-400">{hint}</span>}
      </div>
      <input
        type="number"
        min="0"
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-40 text-right border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="0"
      />
    </div>
  );
}

function CalcRow({
  label,
  value,
  highlight = false,
  muted = false,
  warning = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
  warning?: boolean;
}) {
  const color =
    warning && value < 0
      ? 'text-red-600'
      : highlight
      ? 'text-blue-700'
      : 'text-gray-900';

  return (
    <div
      className={`flex items-center justify-between py-2.5 border-t mt-1 ${
        highlight ? 'border-gray-300' : 'border-gray-200'
      } ${muted ? 'opacity-60' : ''}`}
    >
      <span className={`text-sm ${highlight ? 'font-bold' : 'font-semibold'} text-gray-700`}>
        {label}
      </span>
      <span className={`text-sm ${highlight ? 'text-base font-bold' : 'font-semibold'} ${color}`}>
        {formatEuro(value)}
      </span>
    </div>
  );
}

export function StepWinstVerlies({
  data,
  bedrijfsvorm,
  onChange,
  brutowinst,
  totaleBedrijfskosten,
  ebit,
  ebitda,
  resultaatVoorBelasting,
  nettoresultaat,
  ondernemersaftrek,
  belastbaarInkomenVoorMKB,
  mkbVrijstelling,
  belastbaarInkomen,
}: Props) {
  const set = <K extends keyof WinstVerlies>(key: K, value: number) =>
    onChange({ ...data, [key]: value });

  const isIB = BEDRIJFSVORM_INFO[bedrijfsvorm].isIB;
  const isVPB = !isIB;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Winst- &amp; verliesrekening</h2>
        <p className="text-sm text-gray-500">
          Voer de cijfers uit de W&amp;V-rekening in. Tussenstanden worden automatisch berekend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- Linker kolom: omzet, kosten, EBIT ---- */}
        <div className="space-y-4">
          {/* Omzet & inkoop */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Omzet & kostprijs</p>
            <NumInput
              label="Netto-omzet"
              hint="omzet excl. BTW, na kortingen"
              value={data.omzet}
              onChange={(v) => set('omzet', v)}
            />
            <NumInput
              label="Kostprijs omzet"
              hint="inkoop, productiekosten"
              value={data.kostprijsOmzet}
              onChange={(v) => set('kostprijsOmzet', v)}
              negative
            />
            <CalcRow label="= Brutowinst" value={brutowinst} warning />
          </div>

          {/* Bedrijfskosten */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bedrijfskosten</p>
            <NumInput
              label="Personeelskosten"
              hint="salarissen, sociale lasten, pensioenbijdrage"
              value={data.personeelskosten}
              onChange={(v) => set('personeelskosten', v)}
              negative
              indent
            />
            <NumInput
              label="Afschrijvingen"
              hint="over vaste activa"
              value={data.afschrijvingen}
              onChange={(v) => set('afschrijvingen', v)}
              negative
              indent
            />
            <NumInput
              label="Huisvestingkosten"
              hint="huur, energie, onderhoud pand"
              value={data.huisvestingkosten}
              onChange={(v) => set('huisvestingkosten', v)}
              negative
              indent
            />
            <NumInput
              label="Verkoopkosten"
              hint="marketing, reclame, provisies"
              value={data.verkoopkosten}
              onChange={(v) => set('verkoopkosten', v)}
              negative
              indent
            />
            <NumInput
              label="Algemene beheerkosten"
              hint="administratie, automatisering, advies"
              value={data.algemeneBeheerkosten}
              onChange={(v) => set('algemeneBeheerkosten', v)}
              negative
              indent
            />
            <NumInput
              label="Overige bedrijfskosten"
              value={data.overigeBedrKosten}
              onChange={(v) => set('overigeBedrKosten', v)}
              negative
              indent
            />
            <CalcRow label="Totale bedrijfskosten" value={totaleBedrijfskosten} />
            <CalcRow label="= EBIT (bedrijfsresultaat)" value={ebit} highlight warning />
          </div>
        </div>

        {/* ---- Rechter kolom: financieel, belasting, resultaat ---- */}
        <div className="space-y-4">
          {/* EBITDA info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Afgeleide grootheden</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">EBITDA</span>
                <span className="font-semibold text-blue-800">{formatEuro(ebitda)}</span>
              </div>
              <p className="text-xs text-blue-600">EBIT + afschrijvingen ({formatEuro(data.afschrijvingen)})</p>
            </div>
          </div>

          {/* Financieel */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Financiële baten en lasten</p>
            <NumInput
              label="Financiële baten"
              hint="rente-ontvangsten, dividendinkomsten"
              value={data.financieleBaten}
              onChange={(v) => set('financieleBaten', v)}
              indent
            />
            <NumInput
              label="Rentelasten"
              hint="rente op leningen, bankkosten"
              value={data.rentelasten}
              onChange={(v) => set('rentelasten', v)}
              negative
              indent
            />
            <CalcRow label="= Resultaat vóór belasting" value={resultaatVoorBelasting} highlight warning />
          </div>

          {/* IB-specifiek */}
          {isIB && (
            <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-2">
                IB-ondernemersaftrekken (boekjaar 2025)
              </p>
              <NumInput
                label="Zelfstandigenaftrek"
                hint="max. €2.470 (2025) bij ≥ 1.225 uur"
                value={data.zelfstandigenaftrek}
                onChange={(v) => set('zelfstandigenaftrek', v)}
                indent
              />
              <NumInput
                label="Startersaftrek"
                hint="extra €2.123 de eerste 3 jaar"
                value={data.startersaftrek}
                onChange={(v) => set('startersaftrek', v)}
                indent
              />
              <NumInput
                label="Meewerkaftrek"
                hint="bij meewerken partner"
                value={data.meewerkaftrek}
                onChange={(v) => set('meewerkaftrek', v)}
                indent
              />
              <CalcRow label="Totale ondernemersaftrek" value={ondernemersaftrek} />
              <CalcRow label="Winst na aftrek" value={belastbaarInkomenVoorMKB} />

              <div className="mt-2 pt-2 border-t border-amber-100">
                <div className="flex justify-between py-1">
                  <span className="text-xs text-amber-700">MKB-winstvrijstelling (12,71%)</span>
                  <span className="text-xs font-medium text-amber-700">− {formatEuro(mkbVrijstelling)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-amber-200 mt-1">
                  <span className="text-sm font-bold text-gray-700">Belastbaar inkomen</span>
                  <span className="text-sm font-bold text-blue-700">{formatEuro(belastbaarInkomen)}</span>
                </div>
              </div>
            </div>
          )}

          {/* VPB-specifiek */}
          {isVPB && (
            <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-purple-700 uppercase mb-2">
                VPB & DGA (Besloten / Naamloze Vennootschap)
              </p>
              <NumInput
                label="DGA-salaris"
                hint="gebruikelijk loon DGA – reeds in personeelskosten? Dan 0"
                value={data.dgaSalaris}
                onChange={(v) => set('dgaSalaris', v)}
                indent
              />
              <NumInput
                label="Vennootschapsbelasting"
                hint="19% t/m €200k, daarboven 25,8% (2025)"
                value={data.vpbBelasting}
                onChange={(v) => set('vpbBelasting', v)}
                negative
                indent
              />
            </div>
          )}

          {/* Nettoresultaat */}
          <div
            className={`rounded-xl p-4 border-2 ${
              nettoresultaat >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Nettoresultaat</span>
              <span
                className={`text-lg font-bold ${
                  nettoresultaat >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {formatEuro(nettoresultaat)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isIB
                ? 'Winst na ondernemersaftrek en MKB-winstvrijstelling'
                : 'Winst na vennootschapsbelasting'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
