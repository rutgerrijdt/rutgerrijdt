// ============================================================
// Nederlandse Leningen & Financieringsberekeningen 2026
// ============================================================

// ============================================================
// PERSOONLIJKE LENING
// ============================================================

export interface PersonalLoanInput {
  leenbedrag: number;
  looptijdMaanden: number;
  jaarrentePercent: number;
  type: 'doorlopend' | 'persoonlijk';
}

export interface PersonalLoanResult {
  maandlast: number;
  totaalKosten: number;
  totaalRente: number;
  effectieveRente: number;
  schema: LoanPayment[];
}

export interface LoanPayment {
  maand: number;
  beginSaldo: number;
  rente: number;
  aflossing: number;
  maandlast: number;
  eindSaldo: number;
}

export function calculatePersonalLoan(input: PersonalLoanInput): PersonalLoanResult {
  const { leenbedrag, looptijdMaanden, jaarrentePercent } = input;
  const maandrente = jaarrentePercent / 100 / 12;

  let maandlast: number;
  if (maandrente === 0) {
    maandlast = leenbedrag / looptijdMaanden;
  } else {
    maandlast = leenbedrag * (maandrente * Math.pow(1 + maandrente, looptijdMaanden)) /
      (Math.pow(1 + maandrente, looptijdMaanden) - 1);
  }

  const schema: LoanPayment[] = [];
  let saldo = leenbedrag;
  let totaalRente = 0;

  for (let m = 1; m <= looptijdMaanden; m++) {
    const beginSaldo = saldo;
    const rente = Math.round(saldo * maandrente * 100) / 100;
    const aflossing = Math.round((maandlast - rente) * 100) / 100;
    saldo = Math.max(0, saldo - aflossing);
    totaalRente += rente;
    schema.push({ maand: m, beginSaldo: Math.round(beginSaldo), rente: Math.round(rente), aflossing: Math.round(aflossing), maandlast: Math.round(maandlast), eindSaldo: Math.round(saldo) });
  }

  return {
    maandlast: Math.round(maandlast),
    totaalKosten: Math.round(maandlast * looptijdMaanden),
    totaalRente: Math.round(totaalRente),
    effectieveRente: jaarrentePercent,
    schema,
  };
}

// ============================================================
// STUDIELENING DUO
// ============================================================

export const DUO_RENTE_2026 = 2.56;
export const DUO_LOOPTIJD_JAAR = 35;
export const DUO_DRAAGKRACHT_PERCENTAGE = 0.04;
export const DUO_DREMPELINKOMEN_ENKEL = 24_500;
export const DUO_DREMPELINKOMEN_PARTNER = 33_700;
export const GHF_STUDIELENING_FACTOR = 0.0045;

export interface StudentLoanInput {
  schuldbedrag: number;
  maandelijksInkomen: number;
  heeftPartner: boolean;
  partnerInkomen: number;
  gewenstAflossing: 'minimaal' | 'maximaal' | 'custom';
  customMaandlast?: number;
}

export interface StudentLoanResult {
  minimaalMaandlast: number;
  annuïtairMaandlast: number;
  restschuld15Jaar: number;
  restschuld35Jaar: number;
  totaalRente: number;
  hypotheekImpact: number;
  toelichting: string[];
}

export function calculateStudentLoan(input: StudentLoanInput): StudentLoanResult {
  const { schuldbedrag, maandelijksInkomen, heeftPartner, partnerInkomen } = input;
  const drempel = heeftPartner ? DUO_DREMPELINKOMEN_PARTNER : DUO_DREMPELINKOMEN_ENKEL;
  const jaarInkomen = maandelijksInkomen * 12 + (heeftPartner ? partnerInkomen * 12 : 0);

  const draagkrachtInkomen = Math.max(0, jaarInkomen - drempel);
  const minimaalMaandlast = Math.round((draagkrachtInkomen * DUO_DRAAGKRACHT_PERCENTAGE) / 12);

  const r = DUO_RENTE_2026 / 100 / 12;
  const n = DUO_LOOPTIJD_JAAR * 12;
  const annuïtairMaandlast = r === 0 ? Math.round(schuldbedrag / n) :
    Math.round(schuldbedrag * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

  let saldo15 = schuldbedrag;
  let saldo35 = schuldbedrag;
  let totaalRente = 0;
  for (let m = 1; m <= n; m++) {
    const rente = saldo35 * r;
    totaalRente += rente;
    saldo35 = Math.max(0, saldo35 - (annuïtairMaandlast - rente));
    if (m === 180) saldo15 = saldo35;
  }

  const hypotheekImpact = Math.round(schuldbedrag * GHF_STUDIELENING_FACTOR * 12);

  const toelichting = [
    `DUO rente 2026: ${DUO_RENTE_2026}% (jaarlijks vastgesteld)`,
    `Socialeleenstelsel: terugbetaling max 35 jaar`,
    `Draagkrachttoets: 4% van inkomen boven drempel (${drempel.toLocaleString('nl-NL')})`,
    `Hypotheekimpact: ${GHF_STUDIELENING_FACTOR * 100}% × schuld = ${hypotheekImpact.toLocaleString('nl-NL')} minder max hypotheek/jaar`,
    'Na 35 jaar wordt eventuele restschuld kwijtgescholden',
  ];

  return { minimaalMaandlast, annuïtairMaandlast, restschuld15Jaar: Math.round(saldo15), restschuld35Jaar: Math.round(saldo35), totaalRente: Math.round(totaalRente), hypotheekImpact, toelichting };
}

// ============================================================
// AUTO: KOOP VS LEASE VERGELIJKING
// ============================================================

export interface AutoKoopInput {
  aanschafprijs: number;
  eigenInbreng: number;
  financieringsbedrag: number;
  looptijdMaanden: number;
  financieringsrente: number;
  restwaarde: number;
  brandstofKostenMaand: number;
  verzekeringsKostenMaand: number;
  onderhoudMaand: number;
  motorrijtuigenBelastingMaand: number;
}

export interface AutoLeaseInput {
  maandleasePrijs: number;
  looptijdMaanden: number;
  kilometerVergoeding: number;
  jaarlijkseKilometers: number;
  brandstofKostenMaand: number;
  eigenRijdersBijdrage: number;
}

export interface AutoVergelijkingResult {
  koopMaandlast: number;
  koopTotaalKosten: number;
  koopMaandlastIncl: number;
  leaseMaandlastIncl: number;
  leaseTotaalKosten: number;
  verschilPerMaand: number;
  goedkoperOptie: 'koop' | 'lease';
  koopDetails: { label: string; bedrag: number }[];
  leaseDetails: { label: string; bedrag: number }[];
  toelichting: string[];
}

export function compareAutoLease(koop: AutoKoopInput, lease: AutoLeaseInput): AutoVergelijkingResult {
  const r = koop.financieringsrente / 100 / 12;
  const n = koop.looptijdMaanden;
  let financieringMaandlast = 0;
  if (koop.financieringsbedrag > 0) {
    financieringMaandlast = r === 0 ? koop.financieringsbedrag / n :
      Math.round(koop.financieringsbedrag * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }

  const koopDetails = [
    { label: 'Financiering', bedrag: financieringMaandlast },
    { label: 'Brandstof', bedrag: koop.brandstofKostenMaand },
    { label: 'Verzekering', bedrag: koop.verzekeringsKostenMaand },
    { label: 'Onderhoud', bedrag: koop.onderhoudMaand },
    { label: 'Motorrijtuigenbelasting', bedrag: koop.motorrijtuigenBelastingMaand },
  ];

  const koopMaandlastIncl = koopDetails.reduce((s, d) => s + d.bedrag, 0);
  const koopTotaalKosten = koopMaandlastIncl * n - koop.restwaarde;

  const extraKm = Math.max(0, lease.jaarlijkseKilometers - 25000);
  const kmKosten = Math.round((extraKm * lease.kilometerVergoeding) / 12 / 100);

  const leaseDetails = [
    { label: 'Leasebedrag', bedrag: lease.maandleasePrijs },
    { label: 'Eigen rijdersbijdrage', bedrag: lease.eigenRijdersBijdrage },
    { label: 'Brandstof', bedrag: lease.brandstofKostenMaand },
    { label: 'Km-vergoeding (extra)', bedrag: kmKosten },
  ];

  const leaseMaandlastIncl = leaseDetails.reduce((s, d) => s + d.bedrag, 0);
  const leaseTotaalKosten = leaseMaandlastIncl * lease.looptijdMaanden;

  const verschilPerMaand = koopMaandlastIncl - leaseMaandlastIncl;
  const goedkoperOptie = verschilPerMaand > 0 ? 'lease' : 'koop';

  const toelichting = [
    'Koop: restwaarde verrekend in totaalkosten',
    'Lease: inclusief eigen bijdrage en eventuele km-meerkosten',
    'Bijtelling bij zakelijk gebruik niet meegenomen',
    'Kosten zijn indicatief — vraag offertes op',
  ];

  return { koopMaandlast: financieringMaandlast, koopTotaalKosten, koopMaandlastIncl, leaseMaandlastIncl, leaseTotaalKosten, verschilPerMaand: Math.abs(verschilPerMaand), goedkoperOptie, koopDetails, leaseDetails, toelichting };
}

// ============================================================
// HUREN VS KOPEN
// ============================================================

export interface HuurVsKoopInput {
  koopprijs: number;
  hypotheekBedrag: number;
  hypotheekRente: number;
  looptijdJaar: number;
  ozb: number;
  vveOnderhoud: number;
  maandHuur: number;
  jaarlijkseHuurstijging: number;
  jaarlijkseWoningwaardeStijging: number;
  eigenVermogenInvestmentReturn: number;
  horizonJaar: number;
}

export interface HuurVsKoopJaar {
  jaar: number;
  koopNettolast: number;
  huurNettolast: number;
  koopVermogensopbouw: number;
  huurVermogensMisloop: number;
  koopVoordeel: number;
}

export interface HuurVsKoopResult {
  koopMaandlastNetto: number;
  huurMaandStart: number;
  koopEigenVermogenEind: number;
  huurAlternatiefVermogen: number;
  breakEvenJaar: number | null;
  jaarlijks: HuurVsKoopJaar[];
  toelichting: string[];
}

export function calculateHuurVsKoop(input: HuurVsKoopInput): HuurVsKoopResult {
  const { koopprijs, hypotheekBedrag, hypotheekRente, looptijdJaar, ozb, vveOnderhoud, maandHuur, jaarlijkseHuurstijging, jaarlijkseWoningwaardeStijging, eigenVermogenInvestmentReturn, horizonJaar } = input;

  const r = hypotheekRente / 12;
  const n = looptijdJaar * 12;
  const annuity = r === 0 ? hypotheekBedrag / n : hypotheekBedrag * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const eigenInbreng = koopprijs - hypotheekBedrag;

  const aftrekRate = Math.min(0.3697, hypotheekBedrag > 38441 ? 0.495 : 0.3582);
  const maandRente1 = hypotheekBedrag * r;
  const maandAftrek = maandRente1 * aftrekRate;
  const koopMaandlastNetto = Math.round(annuity - maandAftrek + ozb / 12 + vveOnderhoud / 12);

  const jaarlijks: HuurVsKoopJaar[] = [];
  let saldo = hypotheekBedrag;
  let woningWaarde = koopprijs;
  let huur = maandHuur;
  let huurAlternatief = eigenInbreng;
  let breakEvenJaar: number | null = null;
  let cumulatiefKoopVoordeel = 0;

  for (let jaar = 1; jaar <= horizonJaar; jaar++) {
    const jaarAnnuity = annuity * 12;
    const jaarRente = saldo * hypotheekRente / 100;
    const jaarAflossing = Math.min(saldo, jaarAnnuity - jaarRente);
    saldo = Math.max(0, saldo - jaarAflossing);
    woningWaarde *= (1 + jaarlijkseWoningwaardeStijging / 100);

    const koopNettolast = Math.round((annuity * 12 - jaarRente * aftrekRate + ozb + vveOnderhoud));
    const huurNettolast = Math.round(huur * 12);

    const koopVermogensopbouw = Math.round(woningWaarde - saldo - eigenInbreng);
    huurAlternatief *= (1 + eigenVermogenInvestmentReturn / 100);
    huurAlternatief += (huurNettolast - koopNettolast) > 0 ? (huurNettolast - koopNettolast) : 0;
    const huurVermogensMisloop = Math.round(koopVermogensopbouw - (huurAlternatief - eigenInbreng));

    cumulatiefKoopVoordeel += (huurNettolast - koopNettolast);
    if (breakEvenJaar === null && cumulatiefKoopVoordeel > 0) breakEvenJaar = jaar;

    jaarlijks.push({ jaar, koopNettolast, huurNettolast, koopVermogensopbouw, huurVermogensMisloop, koopVoordeel: cumulatiefKoopVoordeel });
    huur *= (1 + jaarlijkseHuurstijging / 100);
  }

  const toelichting = [
    'Koop: hypotheeklast - renteaftrek + OZB + VVE/onderhoud',
    'Huur: stijgt jaarlijks met opgegeven percentage',
    'Vermogensopbouw koop: woningwaardestijging + aflossing',
    'Renteaftrek beperkt tot 36,97% (2026)',
    'Indicatieve berekening — marktomstandigheden kunnen wijzigen',
  ];

  return { koopMaandlastNetto, huurMaandStart: maandHuur, koopEigenVermogenEind: Math.round(woningWaarde - saldo - eigenInbreng), huurAlternatiefVermogen: Math.round(huurAlternatief - eigenInbreng), breakEvenJaar, jaarlijks, toelichting };
}

// ============================================================
// SCHENKING & ERFBELASTING 2026
// ============================================================

export type RelatieSoort = 'kind' | 'kleinkind' | 'partner' | 'overig';

// Schenkingsvrijstellingen 2026
export const SCHENKING_JAARLIJKS_VRIJ = 6_633;           // Vrije jaarlijkse schenking
export const SCHENKING_KIND_VERHOOGD = 31_813;            // Eenmalig verhoogde vrijstelling kind
export const SCHENKING_KIND_STUDIE = 66_268;              // Eenmalige vrijstelling studie kind (t/m 40 jaar)
export const SCHENKING_VRIJE_DERDEN = 2_658;              // Vrije schenking aan derden

export interface SchenkingInput {
  bedrag: number;
  relatie: RelatieSoort;
  leeftijdOntvanger: number;
  eerderGebruiktVerhoogd: boolean;
  doel: 'vrij' | 'studie' | 'woning';
}

export interface SchenkingResult {
  vrijgesteld: number;
  belastbaar: number;
  schenkbelasting: number;
  effectiefTarief: number;
  toelichting: string[];
}

// Schenkbelasting tarieven 2026
function calcSchenkbelasting(belastbaar: number, relatie: RelatieSoort): number {
  if (belastbaar <= 0) return 0;
  const bracket1 = 138_642;
  if (relatie === 'kind' || relatie === 'kleinkind' || relatie === 'partner') {
    const s1 = Math.min(belastbaar, bracket1) * 0.10;
    const s2 = Math.max(0, belastbaar - bracket1) * 0.20;
    return Math.round(s1 + s2);
  } else {
    const s1 = Math.min(belastbaar, bracket1) * 0.30;
    const s2 = Math.max(0, belastbaar - bracket1) * 0.40;
    return Math.round(s1 + s2);
  }
}

export function calculateSchenking(input: SchenkingInput): SchenkingResult {
  const { bedrag, relatie, leeftijdOntvanger, eerderGebruiktVerhoogd, doel } = input;
  const toelichting: string[] = [];
  let vrijgesteld = 0;

  if (relatie === 'kind' || relatie === 'kleinkind') {
    if (!eerderGebruiktVerhoogd && leeftijdOntvanger <= 40) {
      if (doel === 'studie') {
        vrijgesteld = Math.min(bedrag, SCHENKING_KIND_STUDIE);
        toelichting.push(`Eenmalige verhoogde vrijstelling studie (t/m 40 jaar): ${SCHENKING_KIND_STUDIE.toLocaleString('nl-NL')}`);
      } else {
        vrijgesteld = Math.min(bedrag, SCHENKING_KIND_VERHOOGD);
        toelichting.push(`Eenmalige verhoogde vrijstelling kind: ${SCHENKING_KIND_VERHOOGD.toLocaleString('nl-NL')}`);
      }
    } else {
      vrijgesteld = Math.min(bedrag, SCHENKING_JAARLIJKS_VRIJ);
      if (eerderGebruiktVerhoogd) toelichting.push('Verhoogde vrijstelling al eerder gebruikt');
      if (leeftijdOntvanger > 40) toelichting.push('Ontvanger ouder dan 40 jaar — verhoogde vrijstelling niet van toepassing');
    }
  } else if (relatie === 'partner') {
    vrijgesteld = Math.min(bedrag, SCHENKING_JAARLIJKS_VRIJ);
    toelichting.push('Partners kunnen ook vrij schenken aan elkaar via huwelijkse voorwaarden');
  } else {
    vrijgesteld = Math.min(bedrag, SCHENKING_VRIJE_DERDEN);
    toelichting.push(`Vrijstelling derden: ${SCHENKING_VRIJE_DERDEN.toLocaleString('nl-NL')}`);
  }

  const belastbaar = Math.max(0, bedrag - vrijgesteld);
  const schenkbelasting = calcSchenkbelasting(belastbaar, relatie);
  const effectiefTarief = bedrag > 0 ? schenkbelasting / bedrag : 0;

  toelichting.push('Jubelton (schenking eigen woning) is per 2024 afgeschaft');
  toelichting.push('Aangifte schenkbelasting doen vóór 1 maart van het volgend jaar');

  return { vrijgesteld, belastbaar, schenkbelasting, effectiefTarief, toelichting };
}

// Erfbelasting 2026
export const ERF_VRIJSTELLING_PARTNER = 795_156;
export const ERF_VRIJSTELLING_KIND = 22_918;
export const ERF_VRIJSTELLING_KLEINKIND = 22_918;
export const ERF_VRIJSTELLING_OVERIG = 2_658;

export interface ErfbelastingInput {
  erfenis: number;
  relatie: RelatieSoort;
}

export interface ErfbelastingResult {
  vrijstelling: number;
  belastbaar: number;
  erfbelasting: number;
  nettoBedrag: number;
  effectiefTarief: number;
  toelichting: string[];
}

export function calculateErfbelasting(input: ErfbelastingInput): ErfbelastingResult {
  const { erfenis, relatie } = input;

  const vrijstellingen: Record<RelatieSoort, number> = {
    partner: ERF_VRIJSTELLING_PARTNER,
    kind: ERF_VRIJSTELLING_KIND,
    kleinkind: ERF_VRIJSTELLING_KLEINKIND,
    overig: ERF_VRIJSTELLING_OVERIG,
  };

  const vrijstelling = Math.min(erfenis, vrijstellingen[relatie]);
  const belastbaar = Math.max(0, erfenis - vrijstelling);

  const bracket1 = 138_642;
  let erfbelasting = 0;
  if (relatie === 'partner' || relatie === 'kind' || relatie === 'kleinkind') {
    erfbelasting = Math.min(belastbaar, bracket1) * 0.10 + Math.max(0, belastbaar - bracket1) * 0.20;
  } else {
    erfbelasting = Math.min(belastbaar, bracket1) * 0.30 + Math.max(0, belastbaar - bracket1) * 0.40;
  }
  erfbelasting = Math.round(erfbelasting);

  const nettoBedrag = erfenis - erfbelasting;
  const effectiefTarief = erfenis > 0 ? erfbelasting / erfenis : 0;

  const toelichting = [
    `Vrijstelling ${relatie}: ${vrijstellingen[relatie].toLocaleString('nl-NL')}`,
    relatie === 'kind' || relatie === 'kleinkind' ? 'Tarief: 10% t/m €138.642, 20% daarboven' : '',
    relatie === 'overig' ? 'Tarief: 30% t/m €138.642, 40% daarboven' : '',
    'Aangifte erfbelasting binnen 8 maanden na overlijden',
    'Woning: WOZ-waarde geldt als grondslag',
  ].filter(Boolean);

  return { vrijstelling, belastbaar, erfbelasting, nettoBedrag, effectiefTarief, toelichting };
}
