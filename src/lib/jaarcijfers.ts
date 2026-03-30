// ============================================================
// Jaarcijfers Analyse – Types, berekeningen & hulpfuncties
// ============================================================

export type Bedrijfsvorm = 'eenmanszaak' | 'vof' | 'maatschap' | 'cv' | 'bv' | 'nv';

export const BEDRIJFSVORM_INFO: Record<
  Bedrijfsvorm,
  { label: string; isIB: boolean; omschrijving: string }
> = {
  eenmanszaak: {
    label: 'Eenmanszaak',
    isIB: true,
    omschrijving: 'Éénpersoonsbedrijf zonder rechtspersoonlijkheid. Eigenaar is persoonlijk aansprakelijk.',
  },
  vof: {
    label: 'VOF (Vennootschap Onder Firma)',
    isIB: true,
    omschrijving: 'Samenwerkingsverband tussen twee of meer vennoten. Alle vennoten zijn hoofdelijk aansprakelijk.',
  },
  maatschap: {
    label: 'Maatschap',
    isIB: true,
    omschrijving: 'Samenwerking, veelgebruikt door vrije beroepen (arts, notaris, advocaat).',
  },
  cv: {
    label: 'CV (Commanditaire Vennootschap)',
    isIB: true,
    omschrijving: 'Combinatie van beherende (actieve) en stille (passieve) vennoten.',
  },
  bv: {
    label: 'BV (Besloten Vennootschap)',
    isIB: false,
    omschrijving: 'Rechtspersoon met beperkte aansprakelijkheid. Vennootschapsbelasting van toepassing.',
  },
  nv: {
    label: 'NV (Naamloze Vennootschap)',
    isIB: false,
    omschrijving: 'Rechtspersoon met vrij verhandelbare aandelen. Vennootschapsbelasting van toepassing.',
  },
};

// ---- Data interfaces ----

export interface Bedrijfsgegevens {
  naam: string;
  kvkNummer: string;
  bedrijfsvorm: Bedrijfsvorm;
  boekjaar: string;
  sector: string;
  contactpersoon: string;
}

export interface Balans {
  // Vaste activa
  immaterieleVasteActiva: number;
  materieleVasteActiva: number;
  financieleVasteActiva: number;
  // Vlottende activa
  voorraden: number;
  debiteuren: number;
  overigeVorderingen: number;
  liquideMiddelen: number;
  // Eigen vermogen
  aandelenkapitaal: number;
  agioreserve: number;
  wettelijkeReserves: number;
  overigeReserves: number;
  winstBoekjaar: number;
  // Voorzieningen
  voorzieningen: number;
  // Langlopende schulden
  langlopendeLeningen: number;
  overigeLanglopendeSchulden: number;
  // Kortlopende schulden
  crediteuren: number;
  kortlopendeBank: number;
  belastingenPremies: number;
  overigeKortlopendeSchulden: number;
}

export interface WinstVerlies {
  omzet: number;
  kostprijsOmzet: number;
  personeelskosten: number;
  afschrijvingen: number;
  huisvestingkosten: number;
  verkoopkosten: number;
  algemeneBeheerkosten: number;
  overigeBedrKosten: number;
  financieleBaten: number;
  rentelasten: number;
  // IB-specifiek
  zelfstandigenaftrek: number;
  startersaftrek: number;
  meewerkaftrek: number;
  // VPB-specifiek
  vpbBelasting: number;
  dgaSalaris: number;
}

// ---- Ratio types ----

export type Beoordeling = 'goed' | 'voldoende' | 'aandacht' | 'nvt';
export type FormatType = 'ratio' | 'pct' | 'days' | 'x' | 'eur';

export interface RatioResult {
  label: string;
  waarde: number | null;
  formatType: FormatType;
  norm: string;
  beoordeling: Beoordeling;
  toelichting: string;
}

// ---- Berekening resultaat ----

export interface Berekening {
  // Balans totalen
  vasteActiva: number;
  vlottendeActiva: number;
  totaalActiva: number;
  eigenVermogen: number;
  totaalVoorzieningen: number;
  langlopendeSchulden: number;
  kortlopendeSchulden: number;
  totaalVreemdVermogen: number;
  totaalPassiva: number;
  balansverschil: number;
  // W&V totalen
  brutowinst: number;
  totaleBedrijfskosten: number;
  ebit: number;
  ebitda: number;
  resultaatVoorBelasting: number;
  nettoresultaat: number;
  // IB-specifiek
  ondernemersaftrek: number;
  belastbaarInkomenVoorMKB: number;
  mkbVrijstelling: number;
  belastbaarInkomen: number;
  // Ratio groepen
  liquiditeit: RatioResult[];
  solvabiliteit: RatioResult[];
  rentabiliteit: RatioResult[];
  activiteit: RatioResult[];
}

// ---- Beoordelingshulpfuncties ----

function beoordeel(
  waarde: number | null,
  goedMin: number,
  goedMax: number,
  voldoendeMin: number,
  voldoendeMax: number,
): Beoordeling {
  if (waarde === null) return 'nvt';
  if (waarde >= goedMin && waarde <= goedMax) return 'goed';
  if (waarde >= voldoendeMin && waarde <= voldoendeMax) return 'voldoende';
  return 'aandacht';
}

function beoordeelInvers(waarde: number | null, goedMax: number, voldoendeMax: number): Beoordeling {
  if (waarde === null) return 'nvt';
  if (waarde <= goedMax) return 'goed';
  if (waarde <= voldoendeMax) return 'voldoende';
  return 'aandacht';
}

const div = (a: number, b: number): number | null => (b !== 0 ? a / b : null);
const pct = (a: number, b: number): number | null => (b !== 0 ? (a / b) * 100 : null);
const days = (a: number, b: number): number | null => (b > 0 ? (a / b) * 365 : null);

// ---- Hoofd-berekeningsfunctie ----

export function berekenJaarcijfers(
  bedrijfsgegevens: Bedrijfsgegevens,
  balans: Balans,
  wv: WinstVerlies,
): Berekening {
  const isIB = BEDRIJFSVORM_INFO[bedrijfsgegevens.bedrijfsvorm].isIB;

  // Balans – activa
  const vasteActiva =
    balans.immaterieleVasteActiva + balans.materieleVasteActiva + balans.financieleVasteActiva;
  const vlottendeActiva =
    balans.voorraden + balans.debiteuren + balans.overigeVorderingen + balans.liquideMiddelen;
  const totaalActiva = vasteActiva + vlottendeActiva;

  // Balans – passiva
  const eigenVermogen =
    balans.aandelenkapitaal +
    balans.agioreserve +
    balans.wettelijkeReserves +
    balans.overigeReserves +
    balans.winstBoekjaar;
  const totaalVoorzieningen = balans.voorzieningen;
  const langlopendeSchulden = balans.langlopendeLeningen + balans.overigeLanglopendeSchulden;
  const kortlopendeSchulden =
    balans.crediteuren +
    balans.kortlopendeBank +
    balans.belastingenPremies +
    balans.overigeKortlopendeSchulden;
  const totaalVreemdVermogen = totaalVoorzieningen + langlopendeSchulden + kortlopendeSchulden;
  const totaalPassiva = eigenVermogen + totaalVreemdVermogen;
  const balansverschil = totaalActiva - totaalPassiva;

  // W&V rekening
  const brutowinst = wv.omzet - wv.kostprijsOmzet;
  const totaleBedrijfskosten =
    wv.personeelskosten +
    wv.afschrijvingen +
    wv.huisvestingkosten +
    wv.verkoopkosten +
    wv.algemeneBeheerkosten +
    wv.overigeBedrKosten;
  const ebit = brutowinst - totaleBedrijfskosten;
  const ebitda = ebit + wv.afschrijvingen;
  const resultaatVoorBelasting = ebit + wv.financieleBaten - wv.rentelasten;

  // IB-fiscaal
  const ondernemersaftrek = wv.zelfstandigenaftrek + wv.startersaftrek + wv.meewerkaftrek;
  const belastbaarInkomenVoorMKB = Math.max(0, resultaatVoorBelasting - ondernemersaftrek);
  const mkbVrijstelling = belastbaarInkomenVoorMKB * 0.1271; // 2025 tarief
  const belastbaarInkomen = belastbaarInkomenVoorMKB - mkbVrijstelling;

  const nettoresultaat = isIB
    ? resultaatVoorBelasting - ondernemersaftrek - mkbVrijstelling
    : resultaatVoorBelasting - wv.vpbBelasting;

  // ---- Ratio's ----
  const nettoSchuld = langlopendeSchulden + balans.kortlopendeBank - balans.liquideMiddelen;

  const currentRatioVal = div(vlottendeActiva, kortlopendeSchulden);
  const quickRatioVal = div(vlottendeActiva - balans.voorraden, kortlopendeSchulden);
  const cashRatioVal = div(balans.liquideMiddelen, kortlopendeSchulden);
  const solvVal = pct(eigenVermogen, totaalActiva);
  const deVal = eigenVermogen > 0 ? div(totaalVreemdVermogen, eigenVermogen) : null;
  const nsEbitdaVal = ebitda > 0 ? div(nettoSchuld, ebitda) : null;
  const roeVal = eigenVermogen > 0 ? pct(nettoresultaat, eigenVermogen) : null;
  const roaVal = pct(ebit, totaalActiva);
  const rosVal = pct(nettoresultaat, wv.omzet);
  const brutomVal = pct(brutowinst, wv.omzet);
  const ebitdamVal = pct(ebitda, wv.omzet);
  const kostprijs = wv.kostprijsOmzet > 0 ? wv.kostprijsOmzet : wv.omzet;
  const debDagenVal = days(balans.debiteuren, wv.omzet);
  const credDagenVal = days(balans.crediteuren, kostprijs);
  const voorDagenVal = days(balans.voorraden, kostprijs);
  const omzetActiva = div(wv.omzet, totaalActiva);

  const liquiditeit: RatioResult[] = [
    {
      label: 'Current Ratio',
      waarde: currentRatioVal,
      formatType: 'ratio',
      norm: '> 1,5',
      beoordeling: beoordeel(currentRatioVal, 2, Infinity, 1, 2),
      toelichting:
        'Geeft aan in hoeverre vlottende activa de kortlopende schulden dekt. Boven 1,5 kan de onderneming haar kortetermijnverplichtingen comfortabel nakomen. Onder 1,0 kan een liquiditeitsrisico optreden.',
    },
    {
      label: 'Quick Ratio (Zuurtest)',
      waarde: quickRatioVal,
      formatType: 'ratio',
      norm: '> 1,0',
      beoordeling: beoordeel(quickRatioVal, 1, Infinity, 0.5, 1),
      toelichting:
        'Idem als current ratio, maar voorraden worden buiten beschouwing gelaten omdat deze minder snel liquide zijn. Een waarde ≥ 1,0 geeft aan dat de onderneming zonder haar voorraden aan kortlopende verplichtingen kan voldoen.',
    },
    {
      label: 'Cash Ratio',
      waarde: cashRatioVal,
      formatType: 'ratio',
      norm: '> 0,2',
      beoordeling: beoordeel(cashRatioVal, 0.5, Infinity, 0.2, 0.5),
      toelichting:
        'Toont welk deel van de kortlopende schulden direct met liquide middelen kan worden voldaan. Een lage waarde is niet altijd zorgelijk wanneer ruime kredietfaciliteiten beschikbaar zijn.',
    },
  ];

  const solvabiliteit: RatioResult[] = [
    {
      label: 'Solvabiliteitsratio',
      waarde: solvVal,
      formatType: 'pct',
      norm: '> 25%',
      beoordeling: beoordeel(solvVal, 40, 100, 20, 40),
      toelichting:
        'Percentage van het totale vermogen dat gefinancierd is met eigen vermogen. Een hogere ratio duidt op een sterkere financiële positie en grotere weerbaarheid bij tegenvallers. Banken hanteren veelal een minimum van 20–25%.',
    },
    {
      label: 'Debt / Equity Ratio',
      waarde: deVal,
      formatType: 'ratio',
      norm: '< 2,0',
      beoordeling: beoordeelInvers(deVal, 0.5, 2),
      toelichting:
        'Verhouding vreemd vermogen ten opzichte van eigen vermogen. Een hoge ratio duidt op meer financiële hefboom, wat zowel resultaten als risico versterkt. Bij een ratio boven 2,0 zijn kredietverstrekkers doorgaans terughoudender.',
    },
    {
      label: 'Netto Schuld / EBITDA',
      waarde: nsEbitdaVal,
      formatType: 'x',
      norm: '< 3,0x',
      beoordeling: nsEbitdaVal === null ? 'nvt' : beoordeelInvers(nsEbitdaVal, 2, 4),
      toelichting:
        'Geeft aan hoeveel jaar nodig is om de nettoschuld af te lossen uit de operationele kasstroom. Banken hanteren doorgaans een maximum van 3–4x. Een negatieve waarde betekent een nettokaspositie.',
    },
  ];

  const rentabiliteit: RatioResult[] = [
    {
      label: 'Brutowinstmarge',
      waarde: brutomVal,
      formatType: 'pct',
      norm: 'Sectorafhankelijk',
      beoordeling: beoordeel(brutomVal, 40, 100, 20, 40),
      toelichting:
        'Brutowinst als percentage van de omzet. Een hoge brutomarge wijst op sterke prijszettingskracht of lage inkoopkosten. Sterk sectorafhankelijk: retail ≈ 30%, softwarebedrijven ≈ 70%+.',
    },
    {
      label: 'EBITDA-marge',
      waarde: ebitdamVal,
      formatType: 'pct',
      norm: '> 10%',
      beoordeling: beoordeel(ebitdamVal, 20, 100, 10, 20),
      toelichting:
        'Operationele winstmarge vóór rente, belastingen en afschrijvingen. Veelgebruikte maatstaf bij bedrijfswaardering en financieringsaanvragen. Geeft inzicht in de onderliggende operationele winstkracht.',
    },
    {
      label: 'ROA (Return on Assets)',
      waarde: roaVal,
      formatType: 'pct',
      norm: '> 5%',
      beoordeling: beoordeel(roaVal, 10, 100, 5, 10),
      toelichting:
        'EBIT als percentage van het totale vermogen. Geeft aan hoe efficiënt de onderneming haar bezittingen inzet om operationele winst te genereren. Hogere waarden zijn beter.',
    },
    {
      label: 'ROE (Return on Equity)',
      waarde: roeVal,
      formatType: 'pct',
      norm: '> 10%',
      beoordeling: beoordeel(roeVal, 15, 100, 5, 15),
      toelichting:
        'Nettoresultaat als percentage van het eigen vermogen. Geeft het rendement voor de eigenaren/aandeelhouders. Dient vergeleken te worden met alternatieve beleggingsopbrengsten.',
    },
    {
      label: 'Nettowinstmarge (ROS)',
      waarde: rosVal,
      formatType: 'pct',
      norm: '> 5%',
      beoordeling: beoordeel(rosVal, 10, 100, 3, 10),
      toelichting:
        'Nettoresultaat als percentage van de omzet. Geeft de winstgevendheid na alle kosten, rente en belastingen. Een dalende nettomarge bij gelijkblijvende omzet wijst op kostenstijgingen.',
    },
  ];

  const activiteit: RatioResult[] = [
    {
      label: 'Debiteurendagen',
      waarde: debDagenVal,
      formatType: 'days',
      norm: '< 30 dagen',
      beoordeling: debDagenVal === null ? 'nvt' : beoordeelInvers(debDagenVal, 30, 60),
      toelichting:
        'Gemiddeld aantal dagen dat het duurt voordat debiteuren (klanten) betalen. Lange debiteurendagen binden werkkapitaal en verhogen het risico op oninbare vorderingen. Actief debiteurenbeheer verkort dit.',
    },
    {
      label: 'Crediteurendagen',
      waarde: credDagenVal,
      formatType: 'days',
      norm: '15–45 dagen',
      beoordeling: credDagenVal === null ? 'nvt' : beoordeelInvers(credDagenVal, 45, 90),
      toelichting:
        'Gemiddeld aantal dagen dat de onderneming haar leveranciers laat wachten. Te lang betalen schaadt leveranciersrelaties; te vroeg betalen verslechtert de cashflowpositie onnodig.',
    },
    {
      label: 'Voorraaddagen',
      waarde: voorDagenVal,
      formatType: 'days',
      norm: 'Sectorafhankelijk',
      beoordeling: voorDagenVal === null ? 'nvt' : beoordeelInvers(voorDagenVal, 30, 90),
      toelichting:
        'Gemiddeld aantal dagen dat voorraden in het magazijn liggen voordat ze worden verkocht. Hoge voorraaddagen binden werkkapitaal en verhogen opslagkosten. Laag is beter, mits leverzekerheid gewaarborgd blijft.',
    },
    {
      label: 'Omzetsnelheid Activa',
      waarde: omzetActiva,
      formatType: 'x',
      norm: '> 1,0x',
      beoordeling: beoordeel(omzetActiva, 1.5, Infinity, 0.8, 1.5),
      toelichting:
        'Geeft aan hoe efficiënt de totale activa worden ingezet om omzet te genereren. Een hogere waarde duidt op efficiënter gebruik van bezittingen. Kapitaalintensieve sectoren (industrie) scoren doorgaans lager dan dienstverlenende sectoren.',
    },
  ];

  return {
    vasteActiva,
    vlottendeActiva,
    totaalActiva,
    eigenVermogen,
    totaalVoorzieningen,
    langlopendeSchulden,
    kortlopendeSchulden,
    totaalVreemdVermogen,
    totaalPassiva,
    balansverschil,
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
    liquiditeit,
    solvabiliteit,
    rentabiliteit,
    activiteit,
  };
}

// ---- Formatteerhulpfuncties ----

export function formatEuro(val: number): string {
  return val.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function formatRatioWaarde(waarde: number | null, type: FormatType): string {
  if (waarde === null) return 'n.v.t.';
  switch (type) {
    case 'pct':
      return `${waarde.toFixed(1)}%`;
    case 'days':
      return `${Math.round(waarde)} dgn`;
    case 'x':
      return `${waarde.toFixed(1)}x`;
    case 'eur':
      return formatEuro(waarde);
    default:
      return waarde.toFixed(2);
  }
}

// ---- Lege startwaarden ----

export function emptyBedrijfsgegevens(): Bedrijfsgegevens {
  return {
    naam: '',
    kvkNummer: '',
    bedrijfsvorm: 'bv',
    boekjaar: String(new Date().getFullYear() - 1),
    sector: '',
    contactpersoon: '',
  };
}

export function emptyBalans(): Balans {
  return {
    immaterieleVasteActiva: 0,
    materieleVasteActiva: 0,
    financieleVasteActiva: 0,
    voorraden: 0,
    debiteuren: 0,
    overigeVorderingen: 0,
    liquideMiddelen: 0,
    aandelenkapitaal: 0,
    agioreserve: 0,
    wettelijkeReserves: 0,
    overigeReserves: 0,
    winstBoekjaar: 0,
    voorzieningen: 0,
    langlopendeLeningen: 0,
    overigeLanglopendeSchulden: 0,
    crediteuren: 0,
    kortlopendeBank: 0,
    belastingenPremies: 0,
    overigeKortlopendeSchulden: 0,
  };
}

export function emptyWinstVerlies(): WinstVerlies {
  return {
    omzet: 0,
    kostprijsOmzet: 0,
    personeelskosten: 0,
    afschrijvingen: 0,
    huisvestingkosten: 0,
    verkoopkosten: 0,
    algemeneBeheerkosten: 0,
    overigeBedrKosten: 0,
    financieleBaten: 0,
    rentelasten: 0,
    zelfstandigenaftrek: 0,
    startersaftrek: 0,
    meewerkaftrek: 0,
    vpbBelasting: 0,
    dgaSalaris: 0,
  };
}
