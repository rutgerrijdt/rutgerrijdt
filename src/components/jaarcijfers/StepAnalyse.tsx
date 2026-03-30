'use client';

import {
  type Berekening,
  type Bedrijfsgegevens,
  type Balans,
  type WinstVerlies,
  type RatioResult,
  type Beoordeling,
  BEDRIJFSVORM_INFO,
  formatEuro,
  formatRatioWaarde,
} from '@/lib/jaarcijfers';

interface Props {
  bedrijfsgegevens: Bedrijfsgegevens;
  balans: Balans;
  winstVerlies: WinstVerlies;
  berekening: Berekening;
}

// ---- Hulpcomponenten ----

function BeoordelingBadge({ beoordeling }: { beoordeling: Beoordeling }) {
  const config: Record<Beoordeling, { label: string; cls: string }> = {
    goed: { label: 'Goed', cls: 'bg-green-100 text-green-700' },
    voldoende: { label: 'Voldoende', cls: 'bg-amber-100 text-amber-700' },
    aandacht: { label: 'Aandacht', cls: 'bg-red-100 text-red-700' },
    nvt: { label: 'n.v.t.', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = config[beoordeling];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

function RatioGroep({ titel, ratios }: { titel: string; ratios: RatioResult[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
        <h3 className="text-sm font-bold text-gray-800">{titel}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {ratios.map((r) => (
          <details key={r.label} className="group">
            <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{r.label}</span>
                  <span className="text-xs text-gray-400">norm: {r.norm}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                  {formatRatioWaarde(r.waarde, r.formatType)}
                </span>
                <BeoordelingBadge beoordeling={r.beoordeling} />
                <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
              </div>
            </summary>
            <div className="px-4 pb-3 pt-1 text-sm text-gray-600 bg-gray-50/50 border-t border-gray-100">
              {r.toelichting}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function SamenvattingRij({ label, value, highlight = false, negatief = false }: { label: string; value: number; highlight?: boolean; negatief?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${highlight ? 'border-t border-gray-200 mt-1 pt-2' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-semibold' : ''} text-gray-700`}>{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight
            ? value >= 0
              ? 'text-blue-700'
              : 'text-red-700'
            : negatief && value < 0
            ? 'text-red-600'
            : 'text-gray-900'
        }`}
      >
        {formatEuro(value)}
      </span>
    </div>
  );
}

// ---- Rapport HTML generator ----

function generateRapportHtml(
  bg: Bedrijfsgegevens,
  b: Berekening,
  balans: Balans,
  wv: WinstVerlies,
): string {
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const isIB = BEDRIJFSVORM_INFO[bg.bedrijfsvorm].isIB;

  const beoordelingKleur: Record<Beoordeling, string> = {
    goed: '#166534',
    voldoende: '#92400e',
    aandacht: '#991b1b',
    nvt: '#6b7280',
  };
  const beoordelingBg: Record<Beoordeling, string> = {
    goed: '#dcfce7',
    voldoende: '#fef3c7',
    aandacht: '#fee2e2',
    nvt: '#f3f4f6',
  };

  const ratioTabel = (ratios: RatioResult[]) =>
    ratios
      .map(
        (r) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px">${r.label}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;text-align:right">${formatRatioWaarde(r.waarde, r.formatType)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center">${r.norm}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center">
          <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${beoordelingBg[r.beoordeling]};color:${beoordelingKleur[r.beoordeling]}">${r.beoordeling === 'nvt' ? 'n.v.t.' : r.beoordeling.charAt(0).toUpperCase() + r.beoordeling.slice(1)}</span>
        </td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#4b5563">${r.toelichting}</td>
      </tr>`,
      )
      .join('');

  const allRatios = [
    { titel: 'Liquiditeitsratio\'s', ratios: b.liquiditeit },
    { titel: 'Solvabiliteitsratio\'s', ratios: b.solvabiliteit },
    { titel: 'Rentabiliteitsratio\'s', ratios: b.rentabiliteit },
    { titel: 'Activiteitsratio\'s', ratios: b.activiteit },
  ];

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Jaarcijfersanalyse ${bg.naam} – ${bg.boekjaar}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; margin: 0; padding: 0; font-size: 13px; }
  .page { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
  h1 { font-size: 22px; font-weight: 800; color: #1e3a5f; margin: 0 0 4px; }
  h2 { font-size: 15px; font-weight: 700; color: #1e40af; margin: 28px 0 10px; border-bottom: 2px solid #dbeafe; padding-bottom: 6px; }
  h3 { font-size: 13px; font-weight: 700; margin: 16px 0 6px; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1e3a8a; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  .header-box { background: #1e3a8a; color: white; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px; font-size: 12px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; text-align: center; }
  .kpi-val { font-size: 18px; font-weight: 800; color: #0369a1; }
  .kpi-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .col-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
  .row-total { display: flex; justify-content: space-between; padding: 6px 0; border-top: 2px solid #d1d5db; font-weight: 700; font-size: 13px; margin-top: 4px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  @media print { body { font-size: 11px; } .page { padding: 16px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header-box">
    <h1>Jaarcijfersanalyse</h1>
    <div style="font-size:18px;font-weight:700;margin:4px 0">${bg.naam || 'Onbekend bedrijf'}</div>
    <div class="info-grid">
      <span>Boekjaar: <strong>${bg.boekjaar}</strong></span>
      <span>Rechtsvorm: <strong>${BEDRIJFSVORM_INFO[bg.bedrijfsvorm].label}</strong></span>
      ${bg.kvkNummer ? `<span>KvK: <strong>${bg.kvkNummer}</strong></span>` : ''}
      ${bg.sector ? `<span>Sector: <strong>${bg.sector}</strong></span>` : ''}
      ${bg.contactpersoon ? `<span>Contactpersoon: <strong>${bg.contactpersoon}</strong></span>` : ''}
    </div>
  </div>

  <!-- KPI's -->
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-val">${formatEuro(wv.omzet)}</div>
      <div class="kpi-label">Netto-omzet</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color:${b.ebitda >= 0 ? '#0369a1' : '#dc2626'}">${formatEuro(b.ebitda)}</div>
      <div class="kpi-label">EBITDA</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color:${b.nettoresultaat >= 0 ? '#166534' : '#dc2626'}">${formatEuro(b.nettoresultaat)}</div>
      <div class="kpi-label">Nettoresultaat</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">${formatEuro(b.eigenVermogen)}</div>
      <div class="kpi-label">Eigen vermogen</div>
    </div>
  </div>

  <!-- Balans & W&V samenvatting -->
  <h2>Financiële samenvatting</h2>
  <div class="two-col">
    <div class="col-box">
      <h3>Balans – Activa</h3>
      <div class="row"><span>Immateriële vaste activa</span><span>${formatEuro(balans.immaterieleVasteActiva)}</span></div>
      <div class="row"><span>Materiële vaste activa</span><span>${formatEuro(balans.materieleVasteActiva)}</span></div>
      <div class="row"><span>Financiële vaste activa</span><span>${formatEuro(balans.financieleVasteActiva)}</span></div>
      <div class="row" style="font-weight:600"><span>Totaal vaste activa</span><span>${formatEuro(b.vasteActiva)}</span></div>
      <div class="row" style="margin-top:8px"><span>Voorraden</span><span>${formatEuro(balans.voorraden)}</span></div>
      <div class="row"><span>Debiteuren</span><span>${formatEuro(balans.debiteuren)}</span></div>
      <div class="row"><span>Overige vorderingen</span><span>${formatEuro(balans.overigeVorderingen)}</span></div>
      <div class="row"><span>Liquide middelen</span><span>${formatEuro(balans.liquideMiddelen)}</span></div>
      <div class="row" style="font-weight:600"><span>Totaal vlottende activa</span><span>${formatEuro(b.vlottendeActiva)}</span></div>
      <div class="row-total"><span>TOTAAL ACTIVA</span><span>${formatEuro(b.totaalActiva)}</span></div>
    </div>
    <div class="col-box">
      <h3>Balans – Passiva</h3>
      <div class="row"><span>Aandelenkapitaal / Kapitaal</span><span>${formatEuro(balans.aandelenkapitaal)}</span></div>
      <div class="row"><span>Reserves</span><span>${formatEuro(balans.wettelijkeReserves + balans.overigeReserves)}</span></div>
      <div class="row"><span>Resultaat boekjaar</span><span>${formatEuro(balans.winstBoekjaar)}</span></div>
      <div class="row" style="font-weight:600"><span>Totaal eigen vermogen</span><span>${formatEuro(b.eigenVermogen)}</span></div>
      <div class="row" style="margin-top:8px"><span>Voorzieningen</span><span>${formatEuro(balans.voorzieningen)}</span></div>
      <div class="row"><span>Langlopende leningen</span><span>${formatEuro(balans.langlopendeLeningen)}</span></div>
      <div class="row"><span>Overige langlopende schulden</span><span>${formatEuro(balans.overigeLanglopendeSchulden)}</span></div>
      <div class="row" style="font-weight:600"><span>Totaal langlopende schulden</span><span>${formatEuro(b.langlopendeSchulden)}</span></div>
      <div class="row" style="margin-top:8px"><span>Crediteuren</span><span>${formatEuro(balans.crediteuren)}</span></div>
      <div class="row"><span>Kortlopende bank</span><span>${formatEuro(balans.kortlopendeBank)}</span></div>
      <div class="row"><span>Belastingen en premies</span><span>${formatEuro(balans.belastingenPremies)}</span></div>
      <div class="row" style="font-weight:600"><span>Totaal kortlopende schulden</span><span>${formatEuro(b.kortlopendeSchulden)}</span></div>
      <div class="row-total"><span>TOTAAL PASSIVA</span><span>${formatEuro(b.totaalPassiva)}</span></div>
    </div>
  </div>

  <!-- W&V samenvatting -->
  <div class="col-box" style="margin-top:16px">
    <h3>Winst- &amp; verliesrekening</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <div class="row"><span>Netto-omzet</span><span>${formatEuro(wv.omzet)}</span></div>
        <div class="row"><span>− Kostprijs omzet</span><span>${formatEuro(wv.kostprijsOmzet)}</span></div>
        <div class="row" style="font-weight:600"><span>= Brutowinst</span><span>${formatEuro(b.brutowinst)}</span></div>
        <div class="row"><span>− Totale bedrijfskosten</span><span>${formatEuro(b.totaleBedrijfskosten)}</span></div>
        <div class="row" style="font-weight:600"><span>= EBIT</span><span>${formatEuro(b.ebit)}</span></div>
        <div class="row"><span>+ Afschrijvingen</span><span>${formatEuro(wv.afschrijvingen)}</span></div>
        <div class="row" style="font-weight:600"><span>= EBITDA</span><span>${formatEuro(b.ebitda)}</span></div>
      </div>
      <div>
        <div class="row"><span>+ Financiële baten</span><span>${formatEuro(wv.financieleBaten)}</span></div>
        <div class="row"><span>− Rentelasten</span><span>${formatEuro(wv.rentelasten)}</span></div>
        <div class="row" style="font-weight:600"><span>= Resultaat vóór belasting</span><span>${formatEuro(b.resultaatVoorBelasting)}</span></div>
        ${isIB ? `
        <div class="row"><span>− Ondernemersaftrek</span><span>${formatEuro(b.ondernemersaftrek)}</span></div>
        <div class="row"><span>− MKB-winstvrijstelling</span><span>${formatEuro(b.mkbVrijstelling)}</span></div>
        <div class="row" style="font-weight:600"><span>= Belastbaar inkomen</span><span>${formatEuro(b.belastbaarInkomen)}</span></div>
        ` : `
        <div class="row"><span>− Vennootschapsbelasting</span><span>${formatEuro(wv.vpbBelasting)}</span></div>
        `}
        <div class="row-total"><span>NETTORESULTAAT</span><span>${formatEuro(b.nettoresultaat)}</span></div>
      </div>
    </div>
  </div>

  <!-- Ratio's -->
  <h2>Ratio-analyse</h2>
  ${allRatios
    .map(
      (groep) => `
    <h3>${groep.titel}</h3>
    <table>
      <thead><tr>
        <th style="width:22%">Ratio</th>
        <th style="width:14%;text-align:right">Waarde</th>
        <th style="width:14%;text-align:center">Norm</th>
        <th style="width:12%;text-align:center">Beoordeling</th>
        <th>Toelichting</th>
      </tr></thead>
      <tbody>${ratioTabel(groep.ratios)}</tbody>
    </table>`,
    )
    .join('')}

  <div class="footer">
    Rapport gegenereerd op ${datum} &nbsp;·&nbsp; Jaarcijfersanalyse Tool &nbsp;·&nbsp; Boekjaar ${bg.boekjaar}
  </div>
</div>
</body>
</html>`;
}

// ---- Hoofd-analysecomponent ----

export function StepAnalyse({ bedrijfsgegevens, balans, winstVerlies, berekening: b }: Props) {
  const isIB = BEDRIJFSVORM_INFO[bedrijfsgegevens.bedrijfsvorm].isIB;

  const handleDownload = () => {
    const html = generateRapportHtml(bedrijfsgegevens, b, balans, winstVerlies);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const alleRatios = [...b.liquiditeit, ...b.solvabiliteit, ...b.rentabiliteit, ...b.activiteit];
  const aantalGoed = alleRatios.filter((r) => r.beoordeling === 'goed').length;
  const aantalAandacht = alleRatios.filter((r) => r.beoordeling === 'aandacht').length;
  const aantalVoldoende = alleRatios.filter((r) => r.beoordeling === 'voldoende').length;

  return (
    <div className="space-y-6">
      {/* Header met download */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Analyse &amp; Rapport</h2>
          <p className="text-sm text-gray-500">
            Klik op een ratio voor uitgebreide toelichting. Download het volledige rapport als PDF.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="shrink-0 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <span>⬇</span> Download rapport (PDF)
        </button>
      </div>

      {/* Score overzicht */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{formatEuro(winstVerlies.omzet)}</div>
          <div className="text-xs text-gray-500 mt-1">Netto-omzet</div>
        </div>
        <div
          className={`border rounded-xl p-3 text-center ${
            b.nettoresultaat >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div
            className={`text-2xl font-bold ${b.nettoresultaat >= 0 ? 'text-green-700' : 'text-red-700'}`}
          >
            {formatEuro(b.nettoresultaat)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Nettoresultaat</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-slate-700">{formatEuro(b.eigenVermogen)}</div>
          <div className="text-xs text-gray-500 mt-1">Eigen vermogen</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">{formatEuro(b.ebitda)}</div>
          <div className="text-xs text-gray-500 mt-1">EBITDA</div>
        </div>
      </div>

      {/* Ratio score samenvatting */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-sm font-medium text-green-800">{aantalGoed} ratio{aantalGoed !== 1 ? "'s" : ''} goed</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-medium text-amber-800">{aantalVoldoende} voldoende</span>
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <span className="text-sm font-medium text-red-800">{aantalAandacht} vereisen aandacht</span>
        </div>
      </div>

      {/* Ratio groepen */}
      <RatioGroep titel="Liquiditeitsratio's" ratios={b.liquiditeit} />
      <RatioGroep titel="Solvabiliteitsratio's" ratios={b.solvabiliteit} />
      <RatioGroep titel="Rentabiliteitsratio's" ratios={b.rentabiliteit} />
      <RatioGroep titel="Activiteitsratio's" ratios={b.activiteit} />

      {/* Financiële samenvatting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Balans samenvatting */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Balans samenvatting</h3>
          <div className="space-y-0.5">
            <SamenvattingRij label="Vaste activa" value={b.vasteActiva} />
            <SamenvattingRij label="Vlottende activa" value={b.vlottendeActiva} />
            <SamenvattingRij label="Totaal activa" value={b.totaalActiva} highlight />
            <div className="pt-2" />
            <SamenvattingRij label="Eigen vermogen" value={b.eigenVermogen} />
            <SamenvattingRij label="Voorzieningen" value={b.totaalVoorzieningen} />
            <SamenvattingRij label="Langlopende schulden" value={b.langlopendeSchulden} />
            <SamenvattingRij label="Kortlopende schulden" value={b.kortlopendeSchulden} />
            <SamenvattingRij label="Totaal passiva" value={b.totaalPassiva} highlight />
            {Math.abs(b.balansverschil) >= 1 && (
              <div className="text-xs text-red-600 mt-1 font-medium">
                ⚠ Balansverschil: {formatEuro(b.balansverschil)}
              </div>
            )}
          </div>
        </div>

        {/* W&V samenvatting */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">W&amp;V samenvatting</h3>
          <div className="space-y-0.5">
            <SamenvattingRij label="Netto-omzet" value={winstVerlies.omzet} />
            <SamenvattingRij label="− Kostprijs omzet" value={winstVerlies.kostprijsOmzet} />
            <SamenvattingRij label="= Brutowinst" value={b.brutowinst} highlight />
            <SamenvattingRij label="− Totale bedrijfskosten" value={b.totaleBedrijfskosten} />
            <SamenvattingRij label="= EBIT" value={b.ebit} highlight />
            <SamenvattingRij label="= EBITDA" value={b.ebitda} highlight />
            <SamenvattingRij label="Resultaat vóór belasting" value={b.resultaatVoorBelasting} />
            {isIB && (
              <>
                <SamenvattingRij label="− Ondernemersaftrek" value={b.ondernemersaftrek} />
                <SamenvattingRij label="− MKB-winstvrijstelling" value={b.mkbVrijstelling} />
                <SamenvattingRij label="= Belastbaar inkomen" value={b.belastbaarInkomen} highlight />
              </>
            )}
            {!isIB && <SamenvattingRij label="− VPB-belasting" value={winstVerlies.vpbBelasting} />}
            <SamenvattingRij label="= Nettoresultaat" value={b.nettoresultaat} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}
