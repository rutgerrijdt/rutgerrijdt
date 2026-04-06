/**
 * Scheidingsberekeningen 2026
 * - Partneralimentatie (Tremanormen)
 * - Kinderalimentatie (Nibud-tabellen)
 * - Echtscheidingsplan (boedel, pensioen, kosten)
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Ruwe netto-schatting vanuit bruto jaarsalaris (vereenvoudigd, t.b.v. alimentatieberekeningen)
 * Gebaseerd op belastingtarieven 2026 incl. heffingskortingen.
 */
export function bruttoNaarNBI(brutoJaar: number): number {
  if (brutoJaar <= 0) return 0;

  const SCHIJF1_GRENS = 38441;
  const SCHIJF1_TARIEF = 0.3582;
  const SCHIJF2_TARIEF = 0.495;

  // Inkomstenbelasting
  let ib: number;
  if (brutoJaar <= SCHIJF1_GRENS) {
    ib = brutoJaar * SCHIJF1_TARIEF;
  } else {
    ib = SCHIJF1_GRENS * SCHIJF1_TARIEF + (brutoJaar - SCHIJF1_GRENS) * SCHIJF2_TARIEF;
  }

  // Arbeidskorting (2026)
  let arbeidskorting = 0;
  if (brutoJaar <= 11491) {
    arbeidskorting = brutoJaar * 0.08425;
  } else if (brutoJaar <= 24820) {
    arbeidskorting = 968 + (brutoJaar - 11491) * 0.31433;
  } else if (brutoJaar <= 39957) {
    arbeidskorting = 5158;
  } else if (brutoJaar <= 124935) {
    arbeidskorting = 5158 - (brutoJaar - 39957) * 0.06510;
  } else {
    arbeidskorting = 0;
  }
  arbeidskorting = Math.max(0, Math.min(5158, arbeidskorting));

  // Algemene heffingskorting (2026)
  let ahk: number;
  if (brutoJaar <= 24813) {
    ahk = 3362;
  } else if (brutoJaar <= 75518) {
    ahk = 3362 - (brutoJaar - 24813) * 0.06630;
  } else {
    ahk = 0;
  }
  ahk = Math.max(0, ahk);

  const netto = brutoJaar - ib + arbeidskorting + ahk;
  // Maandelijks NBI
  return Math.max(0, netto / 12);
}

// ─── PARTNER ALIMENTATIE ─────────────────────────────────────────────────────

export interface PartnerAlimentatieInput {
  /** Bruto jaarsalaris betaler */
  brutoBetaler: number;
  /** Bruto jaarsalaris ontvanger */
  brutoOntvanger: number;
  /** Huwelijksduur in jaren */
  huwelijksduur: number;
  /** Aantal kinderen < 18 jaar */
  aantalKinderen: number;
  /** Leeftijd ontvanger (voor uitzondering duurberekening) */
  leeftijdOntvanger: number;
  /** Eigen woonlasten betaler per maand (default: forfaitair €975) */
  woonlastenBetaler?: number;
  /** Eigen woonlasten ontvanger per maand (default: forfaitair €875) */
  woonlastenOntvanger?: number;
}

export interface PartnerAlimentatieResult {
  /** NBI betaler per maand */
  nbiBetaler: number;
  /** NBI ontvanger per maand */
  nbiOntvanger: number;
  /** Behoefte ontvanger per maand (60% × NBI huwelijk) */
  behoefte: number;
  /** Behoeftigheid (behoefte minus eigen netto inkomen) */
  behoeftigheid: number;
  /** Draagkracht betaler per maand */
  draagkrachtBetaler: number;
  /** Berekende alimentatie per maand */
  alimentatie: number;
  /** Duur in maanden */
  duurMaanden: number;
  /** Totaal te betalen alimentatie */
  totaalTeBetalen: number;
  /** Toelichting per stap */
  stappen: { label: string; waarde: string; toelichting?: string }[];
}

export function calculatePartnerAlimentatie(
  input: PartnerAlimentatieInput
): PartnerAlimentatieResult {
  const nbiBetaler = bruttoNaarNBI(input.brutoBetaler);
  const nbiOntvanger = bruttoNaarNBI(input.brutoOntvanger);

  // Stap 1: NBI gezin tijdens huwelijk
  const nbiGezin = nbiBetaler + nbiOntvanger;

  // Stap 2: Behoefte ontvanger = 60% × NBI gezin
  // (minus eigen netto aandeel wonen; vereenvoudigd zonder correctie)
  const woonlastenOntvanger = input.woonlastenOntvanger ?? 875;
  const behoefte = Math.max(0, nbiGezin * 0.6 - woonlastenOntvanger * 0.3);

  // Stap 3: Behoeftigheid = behoefte - eigen netto inkomen ontvanger
  const behoeftigheid = Math.max(0, behoefte - nbiOntvanger);

  // Stap 4: Draagkracht betaler
  // Draagkrachtloos bedrag: woonlasten + 30% van rest NBI
  const woonlastenBetaler = input.woonlastenBetaler ?? 975;
  const draagkrachtloosBasisbedrag = 1100; // forfaitair levensonderhoud excl. wonen
  const draagkrachtloosAdrag = woonlastenBetaler + draagkrachtloosBasisbedrag;
  const restNBI = Math.max(0, nbiBetaler - draagkrachtloosAdrag);
  const draagkrachtBetaler = restNBI * 0.60; // 60% van resterende NBI is beschikbaar

  // Stap 5: Alimentatie = laagste van behoeftigheid en draagkracht
  const alimentatie = Math.min(behoeftigheid, draagkrachtBetaler);

  // Stap 6: Duur berekening (Wet Herziening Partneralimentatie 2020)
  let duurMaanden: number;
  if (input.huwelijksduur < 10) {
    // Max helft huwelijksduur, maar minimaal 3 jaar als er kinderen < 12 zijn
    duurMaanden = Math.max(
      input.aantalKinderen > 0 ? 36 : 0,
      Math.ceil(input.huwelijksduur * 0.5 * 12)
    );
  } else if (input.huwelijksduur >= 10 && input.huwelijksduur < 15) {
    duurMaanden = 60; // max 5 jaar
  } else {
    // Huwelijk ≥ 15 jaar: max 10 jaar als ontvanger ≥ 50 of geboren voor 1970
    const lang = input.leeftijdOntvanger >= 50 || (new Date().getFullYear() - input.leeftijdOntvanger) <= 1970;
    duurMaanden = lang ? 120 : 60;
  }

  const totaalTeBetalen = alimentatie * duurMaanden;

  const fmt = (n: number) =>
    n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const stappen: PartnerAlimentatieResult['stappen'] = [
    { label: 'NBI betaler', waarde: fmt(nbiBetaler) + '/mnd', toelichting: 'Netto besteedbaar inkomen na belasting en heffingskortingen' },
    { label: 'NBI ontvanger', waarde: fmt(nbiOntvanger) + '/mnd', toelichting: 'Netto besteedbaar inkomen na belasting en heffingskortingen' },
    { label: 'NBI gezin tijdens huwelijk', waarde: fmt(nbiGezin) + '/mnd', toelichting: 'Optelsom beide partners' },
    { label: 'Behoefte ontvanger (60% NBI)', waarde: fmt(behoefte) + '/mnd', toelichting: '60% van gezamenlijk NBI is de welstandsmaatstaf (Tremanorm)' },
    { label: 'Behoeftigheid', waarde: fmt(behoeftigheid) + '/mnd', toelichting: 'Behoefte minus eigen inkomen ontvanger' },
    { label: 'Draagkracht betaler', waarde: fmt(draagkrachtBetaler) + '/mnd', toelichting: '60% van NBI minus forfaitaire lasten' },
    { label: 'Alimentatie', waarde: fmt(alimentatie) + '/mnd', toelichting: 'Laagste van behoeftigheid en draagkracht' },
    { label: 'Duur', waarde: `${duurMaanden} maanden (${(duurMaanden / 12).toFixed(1)} jaar)`, toelichting: 'Conform Wet Herziening Partneralimentatie 2020' },
    { label: 'Totaal te betalen', waarde: fmt(totaalTeBetalen), toelichting: 'Alimentatie × duur (nominaal, geen indexering)' },
  ];

  return { nbiBetaler, nbiOntvanger, behoefte, behoeftigheid, draagkrachtBetaler, alimentatie, duurMaanden, totaalTeBetalen, stappen };
}

// ─── KINDERALIMENTATIE ───────────────────────────────────────────────────────

export type Zorgkorting = 'geen' | 'laag' | 'midden' | 'hoog';

export interface KindData {
  leeftijd: number; // 0-17
}

export interface KinderalimentatieInput {
  /** Bruto jaarsalaris ouder 1 */
  brutoOuder1: number;
  /** Bruto jaarsalaris ouder 2 */
  brutoOuder2: number;
  /** Kinderen met hun leeftijd */
  kinderen: KindData[];
  /** Zorgkorting op basis van co-ouderschap */
  zorgkorting: Zorgkorting;
  /** Kinderopvangkosten per maand (eigen bijdrage ouder 1) */
  kinderopvangKosten?: number;
}

export interface KindBijdrage {
  leeftijd: number;
  kostenKind: number; // totale maandelijkse kosten
  aandeel1: number;   // bijdrage ouder 1 (voor zorgkorting)
  aandeel2: number;   // bijdrage ouder 2
  zorgkorting: number;
  alimentatie: number; // te betalen door ouder 2 aan ouder 1
}

export interface KinderalimentatieResult {
  nbiOuder1: number;
  nbiOuder2: number;
  totaleKosten: number;
  kindBijdragen: KindBijdrage[];
  totaalAlimentatie: number;
  zorgkortingTotaal: number;
  toelichting: string[];
}

/**
 * Nibud kosten per kind per leeftijdscategorie (2024, per maand)
 * Gebaseerd op gecombineerd NBI van beide ouders
 */
function getNibudKosten(gecombineerdNBI: number, leeftijd: number): number {
  // Leeftijdscategorie: 0-5, 6-11, 12-17
  const cat = leeftijd <= 5 ? 0 : leeftijd <= 11 ? 1 : 2;

  // Nibud-tabellen 2024 (gecombineerd NBI per maand → kosten per kind)
  // Tabel vereenvoudigd naar 7 inkomensbrackets
  const brackets = [
    { max: 2000,  kosten: [525, 575, 650] },
    { max: 2500,  kosten: [600, 675, 775] },
    { max: 3000,  kosten: [700, 775, 900] },
    { max: 3500,  kosten: [800, 900, 1025] },
    { max: 4000,  kosten: [900, 1025, 1175] },
    { max: 5000,  kosten: [1075, 1200, 1375] },
    { max: 6000,  kosten: [1275, 1425, 1625] },
    { max: 7500,  kosten: [1500, 1700, 1950] },
    { max: Infinity, kosten: [1750, 1975, 2250] },
  ];

  const bracket = brackets.find((b) => gecombineerdNBI <= b.max) ?? brackets[brackets.length - 1];
  return bracket.kosten[cat];
}

const ZORGKORTING_PCT: Record<Zorgkorting, number> = {
  geen: 0,
  laag: 0.15,   // 1-3 dagen per week
  midden: 0.25, // 3-4 dagen per week (bijna co-ouderschap)
  hoog: 0.35,   // Co-ouderschap ≥ 4 dagen per week
};

export function calculateKinderalimentatie(
  input: KinderalimentatieInput
): KinderalimentatieResult {
  const nbiOuder1 = bruttoNaarNBI(input.brutoOuder1);
  const nbiOuder2 = bruttoNaarNBI(input.brutoOuder2);
  const gecombineerdNBI = nbiOuder1 + nbiOuder2;

  const zorgkortingPct = ZORGKORTING_PCT[input.zorgkorting];

  // Prorata verdeling kosten op basis van NBI
  const totaalNBI = nbiOuder1 + nbiOuder2;
  const ratio1 = totaalNBI > 0 ? nbiOuder1 / totaalNBI : 0.5;
  const ratio2 = 1 - ratio1;

  const kindBijdragen: KindBijdrage[] = input.kinderen.map((kind) => {
    const kostenKind = getNibudKosten(gecombineerdNBI, kind.leeftijd);
    const aandeel1 = kostenKind * ratio1;
    const aandeel2 = kostenKind * ratio2;

    // Zorgkorting wordt afgetrokken van het te betalen bedrag door ouder 2
    const zorgkorting = aandeel2 * zorgkortingPct;
    const alimentatie = Math.max(0, aandeel2 - zorgkorting);

    return {
      leeftijd: kind.leeftijd,
      kostenKind,
      aandeel1,
      aandeel2,
      zorgkorting,
      alimentatie,
    };
  });

  const totaalAlimentatie = kindBijdragen.reduce((s, k) => s + k.alimentatie, 0);
  const zorgkortingTotaal = kindBijdragen.reduce((s, k) => s + k.zorgkorting, 0);
  const totaleKosten = kindBijdragen.reduce((s, k) => s + k.kostenKind, 0);

  const toelichting: string[] = [
    'Kindkosten gebaseerd op Nibud-tabellen 2024.',
    `Ouder 1 draagt ${(ratio1 * 100).toFixed(0)}% bij, ouder 2 draagt ${(ratio2 * 100).toFixed(0)}% bij (prorata NBI).`,
    zorgkorting !== 'geen'
      ? `Zorgkorting ${(zorgkortingPct * 100).toFixed(0)}% toegepast op aandeel ouder 2 (omgangsregeling).`
      : 'Geen zorgkorting toegepast (ouder 2 heeft geen omgang).',
    'Draagkrachttoets niet meegenomen — raadpleeg een mediator/advocaat voor definitieve berekening.',
  ];

  return { nbiOuder1, nbiOuder2, totaleKosten, kindBijdragen, totaalAlimentatie, zorgkortingTotaal, toelichting };
}

// ─── ECHTSCHEIDINGSPLAN ───────────────────────────────────────────────────────

export interface WoningData {
  woningWaarde: number;
  hypotheekSchuld: number;
}

export interface PensioenData {
  /** Opgebouwd pensioen betaler gedurende huwelijk (jaarlijks) */
  opgebouwdPensioenP1: number;
  /** Opgebouwd pensioen ontvanger gedurende huwelijk (jaarlijks) */
  opgebouwdPensioenP2: number;
}

export interface EchtscheidingsplanInput {
  huwelijksduur: number;
  gezamenlijkVermogen: number;
  gezamenlijkeSchulden: number;
  woning?: WoningData;
  pensioen?: PensioenData;
  /** Mediator gekozen (anders advocaat) */
  mediation: boolean;
  aantalKinderen: number;
  /** Partner 1 inkomen bruto jaar */
  inkomenP1: number;
  /** Partner 2 inkomen bruto jaar */
  inkomenP2: number;
}

export interface EchtscheidingsplanItem {
  categorie: string;
  omschrijving: string;
  bedragP1: number;
  bedragP2: number;
  toelichting?: string;
}

export interface EchtscheidingsplanResult {
  items: EchtscheidingsplanItem[];
  totaalP1: number;
  totaalP2: number;
  geschatteKosten: {
    mediator?: number;
    advocaatP1?: number;
    advocaatP2?: number;
    notaris: number;
    griffierecht: number;
    totaal: number;
  };
  checklist: { item: string; afgerond: boolean }[];
  overwaarde: number;
  pensioenVereveningJaarlijks: number;
}

export function calculateEchtscheidingsplan(
  input: EchtscheidingsplanInput
): EchtscheidingsplanResult {
  const items: EchtscheidingsplanItem[] = [];

  // 1. Boedel verdeling (50/50)
  const nettoBoedem = input.gezamenlijkVermogen - input.gezamenlijkeSchulden;
  const boedelPerPersoon = nettoBoedem / 2;
  items.push({
    categorie: 'Vermogen',
    omschrijving: 'Gemeenschappelijk vermogen (excl. woning)',
    bedragP1: boedelPerPersoon,
    bedragP2: boedelPerPersoon,
    toelichting: `Gezamenlijk vermogen €${input.gezamenlijkVermogen.toLocaleString('nl-NL')} minus schulden €${input.gezamenlijkeSchulden.toLocaleString('nl-NL')} = netto €${nettoBoedem.toLocaleString('nl-NL')}, ieder de helft`,
  });

  // 2. Woning
  let overwaarde = 0;
  if (input.woning) {
    overwaarde = input.woning.woningWaarde - input.woning.hypotheekSchuld;
    const overwaardePerPersoon = overwaarde / 2;
    items.push({
      categorie: 'Woning',
      omschrijving: 'Overwaarde / onderwaarde woning',
      bedragP1: overwaardePerPersoon,
      bedragP2: overwaardePerPersoon,
      toelichting: `Woningwaarde €${input.woning.woningWaarde.toLocaleString('nl-NL')} minus hypotheek €${input.woning.hypotheekSchuld.toLocaleString('nl-NL')} = ${overwaarde >= 0 ? 'overwaarde' : 'onderwaarde'} €${Math.abs(overwaarde).toLocaleString('nl-NL')}, ieder 50%`,
    });
  }

  // 3. Pensioenverevening (Wet Verevening Pensioenrechten bij Scheiding)
  let pensioenVereveningJaarlijks = 0;
  if (input.pensioen) {
    // Pensioen opgebouwd tijdens huwelijk wordt 50/50 verdeeld
    pensioenVereveningJaarlijks =
      Math.abs(input.pensioen.opgebouwdPensioenP1 - input.pensioen.opgebouwdPensioenP2) / 2;

    items.push({
      categorie: 'Pensioen',
      omschrijving: 'Pensioenverevening (jaarlijks bij pensionering)',
      bedragP1: input.pensioen.opgebouwdPensioenP1 / 2,
      bedragP2: input.pensioen.opgebouwdPensioenP2 / 2,
      toelichting: 'Conform Wet Verevening Pensioenrechten bij Scheiding: opgebouwd pensioen tijdens huwelijk wordt 50/50 verdeeld',
    });
  }

  // 4. Kosten
  const griffierecht = 310; // 2026
  const notariskosten = 1200; // convenant + verklaring
  let mediatorKosten: number | undefined;
  let advocaatKosten: number | undefined;

  if (input.mediation) {
    mediatorKosten = Math.min(4500, 2000 + input.huwelijksduur * 100 + input.aantalKinderen * 300);
  } else {
    advocaatKosten = Math.min(9500, 3500 + input.huwelijksduur * 150 + input.aantalKinderen * 400);
  }

  const totaalKosten =
    griffierecht +
    notariskosten +
    (input.mediation ? (mediatorKosten ?? 0) : (advocaatKosten ?? 0) * 2);

  items.push({
    categorie: 'Kosten',
    omschrijving: input.mediation ? 'Mediator + notaris + griffierecht' : 'Advocaten (2×) + notaris + griffierecht',
    bedragP1: -totaalKosten / 2,
    bedragP2: -totaalKosten / 2,
    toelichting: 'Gemiddelde schatting; werkelijke kosten kunnen afwijken',
  });

  const totaalP1 = items.reduce((s, i) => s + i.bedragP1, 0);
  const totaalP2 = items.reduce((s, i) => s + i.bedragP2, 0);

  const checklist = [
    { item: 'Echtscheidingsconvenant opstellen', afgerond: false },
    { item: 'Ouderschapsplan (verplicht bij kinderen < 18)', afgerond: input.aantalKinderen === 0 },
    { item: 'Woning: beslissen kopen/verkopen/overnemen', afgerond: !input.woning },
    { item: 'Hypotheek herfinancieren of oversluiten', afgerond: !input.woning },
    { item: 'Pensioenverevening regelen (formulier Pensioenuitvoerder)', afgerond: !input.pensioen },
    { item: 'Verdeling bankrekeningen en spaargeld', afgerond: false },
    { item: 'Zorgverzekering aanpassen (apart afsluiten)', afgerond: false },
    { item: 'Toeslagen herzien (zorgtoeslag, huurtoeslag)', afgerond: false },
    { item: 'Inschrijving gemeente wijzigen', afgerond: false },
    { item: 'Testament en begunstigingen bijwerken', afgerond: false },
    { item: 'Partneralimentatie vastleggen in convenant', afgerond: false },
    { item: input.aantalKinderen > 0 ? 'Kinderalimentatie vastleggen in convenant' : 'Geen kinderalimentatie (geen kinderen)', afgerond: input.aantalKinderen === 0 },
  ];

  return {
    items,
    totaalP1,
    totaalP2,
    geschatteKosten: {
      mediator: mediatorKosten,
      advocaatP1: advocaatKosten,
      advocaatP2: advocaatKosten,
      notaris: notariskosten,
      griffierecht,
      totaal: totaalKosten,
    },
    checklist,
    overwaarde,
    pensioenVereveningJaarlijks,
  };
}
