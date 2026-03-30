'use client';

import { type Balans, type Bedrijfsvorm, BEDRIJFSVORM_INFO, formatEuro } from '@/lib/jaarcijfers';

interface Props {
  data: Balans;
  bedrijfsvorm: Bedrijfsvorm;
  onChange: (data: Balans) => void;
  totaalActiva: number;
  totaalPassiva: number;
  eigenVermogen: number;
  kortlopendeSchulden: number;
  langlopendeSchulden: number;
  vasteActiva: number;
  vlottendeActiva: number;
  totaalVoorzieningen: number;
  totaalVreemdVermogen: number;
  balansverschil: number;
}

function NumInput({
  label,
  value,
  onChange,
  indent = false,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  indent?: boolean;
  hint?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${indent ? 'pl-3 border-l-2 border-gray-100' : ''}`}>
      <div className="flex-1 min-w-0 pr-3">
        <span className="text-sm text-gray-700">{label}</span>
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

function SubTotaal({ label, value, indent = false }: { label: string; value: number; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 bg-gray-50 rounded-lg px-2 my-1 ${indent ? 'ml-3' : ''}`}>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{formatEuro(value)}</span>
    </div>
  );
}

function Totaal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-t-2 border-gray-300 mt-2">
      <span className="text-sm font-bold text-gray-900">{label}</span>
      <span className="text-base font-bold text-blue-700">{formatEuro(value)}</span>
    </div>
  );
}

export function StepBalans({
  data,
  bedrijfsvorm,
  onChange,
  totaalActiva,
  totaalPassiva,
  eigenVermogen,
  kortlopendeSchulden,
  langlopendeSchulden,
  vasteActiva,
  vlottendeActiva,
  totaalVoorzieningen,
  totaalVreemdVermogen,
  balansverschil,
}: Props) {
  const set = <K extends keyof Balans>(key: K, value: number) => onChange({ ...data, [key]: value });
  const isIB = BEDRIJFSVORM_INFO[bedrijfsvorm].isIB;
  const isVPB = !isIB;
  const verschilOk = Math.abs(balansverschil) < 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Balans</h2>
        <p className="text-sm text-gray-500">
          Voer de balansposten in per einde boekjaar. Bedragen in euro's (zonder decimalen).
        </p>
      </div>

      {/* Balans check banner */}
      {(totaalActiva > 0 || totaalPassiva > 0) && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
            verschilOk
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          <span>{verschilOk ? '✓' : '⚠'}</span>
          <span>
            Activa {formatEuro(totaalActiva)} &nbsp;·&nbsp; Passiva {formatEuro(totaalPassiva)}
            {!verschilOk && (
              <> &nbsp;·&nbsp; <strong>Verschil: {formatEuro(balansverschil)}</strong></>
            )}
            {verschilOk && totaalActiva > 0 && <> &nbsp;·&nbsp; Balans klopt ✓</>}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- ACTIVA ---- */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Activa</h3>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Vaste activa</p>
            <NumInput
              label="Immateriële vaste activa"
              hint="goodwill, octrooien, licenties"
              value={data.immaterieleVasteActiva}
              onChange={(v) => set('immaterieleVasteActiva', v)}
              indent
            />
            <NumInput
              label="Materiële vaste activa"
              hint="gebouwen, machines, inventaris, vervoermiddelen"
              value={data.materieleVasteActiva}
              onChange={(v) => set('materieleVasteActiva', v)}
              indent
            />
            <NumInput
              label="Financiële vaste activa"
              hint="deelnemingen, leningen u/g, effecten"
              value={data.financieleVasteActiva}
              onChange={(v) => set('financieleVasteActiva', v)}
              indent
            />
            <SubTotaal label="Totaal vaste activa" value={vasteActiva} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Vlottende activa</p>
            <NumInput
              label="Voorraden"
              hint="grondstoffen, halffabrikaten, gereed product"
              value={data.voorraden}
              onChange={(v) => set('voorraden', v)}
              indent
            />
            <NumInput
              label="Debiteuren"
              hint="openstaande facturen klanten"
              value={data.debiteuren}
              onChange={(v) => set('debiteuren', v)}
              indent
            />
            <NumInput
              label="Overige vorderingen"
              hint="vooruitbetaalde kosten, overige vorderingen"
              value={data.overigeVorderingen}
              onChange={(v) => set('overigeVorderingen', v)}
              indent
            />
            <NumInput
              label="Liquide middelen"
              hint="kas, bankrekeningen"
              value={data.liquideMiddelen}
              onChange={(v) => set('liquideMiddelen', v)}
              indent
            />
            <SubTotaal label="Totaal vlottende activa" value={vlottendeActiva} />
          </div>

          <Totaal label="TOTAAL ACTIVA" value={totaalActiva} />
        </div>

        {/* ---- PASSIVA ---- */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Passiva</h3>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Eigen vermogen</p>
            <NumInput
              label={isVPB ? 'Aandelenkapitaal' : 'Kapitaalrekening eigenaar(s)'}
              value={data.aandelenkapitaal}
              onChange={(v) => set('aandelenkapitaal', v)}
              indent
            />
            {isVPB && (
              <NumInput
                label="Agioreserve"
                hint="storting boven nominale waarde"
                value={data.agioreserve}
                onChange={(v) => set('agioreserve', v)}
                indent
              />
            )}
            <NumInput
              label="Wettelijke reserves"
              value={data.wettelijkeReserves}
              onChange={(v) => set('wettelijkeReserves', v)}
              indent
            />
            <NumInput
              label="Overige reserves"
              hint="onverdeelde winst vorige jaren"
              value={data.overigeReserves}
              onChange={(v) => set('overigeReserves', v)}
              indent
            />
            <NumInput
              label="Resultaat boekjaar"
              hint="winst of verlies huidig boekjaar"
              value={data.winstBoekjaar}
              onChange={(v) => set('winstBoekjaar', v)}
              indent
            />
            <SubTotaal label="Totaal eigen vermogen" value={eigenVermogen} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Voorzieningen</p>
            <NumInput
              label="Voorzieningen"
              hint="pensioen, jubileum, garanties, reorganisatie"
              value={data.voorzieningen}
              onChange={(v) => set('voorzieningen', v)}
              indent
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Langlopende schulden (&gt; 1 jaar)</p>
            <NumInput
              label="Langlopende leningen"
              hint="bankleningen, hypothecaire leningen"
              value={data.langlopendeLeningen}
              onChange={(v) => set('langlopendeLeningen', v)}
              indent
            />
            <NumInput
              label="Overige langlopende schulden"
              hint="achtergestelde leningen, obligaties"
              value={data.overigeLanglopendeSchulden}
              onChange={(v) => set('overigeLanglopendeSchulden', v)}
              indent
            />
            <SubTotaal label="Totaal langlopende schulden" value={langlopendeSchulden} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Kortlopende schulden (≤ 1 jaar)</p>
            <NumInput
              label="Crediteuren"
              hint="openstaande leveranciersfacturen"
              value={data.crediteuren}
              onChange={(v) => set('crediteuren', v)}
              indent
            />
            <NumInput
              label="Kortlopende bankkrediet"
              hint="rekening-courant, kortlopend deel leningen"
              value={data.kortlopendeBank}
              onChange={(v) => set('kortlopendeBank', v)}
              indent
            />
            <NumInput
              label="Belastingen en premies"
              hint="BTW, loonheffing, VPB-schuld"
              value={data.belastingenPremies}
              onChange={(v) => set('belastingenPremies', v)}
              indent
            />
            <NumInput
              label="Overige kortlopende schulden"
              hint="vooruitontvangen omzet, overlopende posten"
              value={data.overigeKortlopendeSchulden}
              onChange={(v) => set('overigeKortlopendeSchulden', v)}
              indent
            />
            <SubTotaal label="Totaal kortlopende schulden" value={kortlopendeSchulden} />
          </div>

          <SubTotaal label="Totaal vreemd vermogen" value={totaalVreemdVermogen} />
          <Totaal label="TOTAAL PASSIVA" value={totaalPassiva} />
        </div>
      </div>
    </div>
  );
}
