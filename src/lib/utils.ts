// ============================================================
// Utility functions
// ============================================================

import type {
  Application,
  CalculationResult,
  IncomeSource,
  MortgageDetails,
} from './types';
import { calculateGHF, calculateActualMonthlyPayment } from './ghf';
import { checkNHG } from './nhg';

// ---- Format euro ----
export function formatEuro(amount: number, decimals = 0): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// ---- Format percentage ----
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals).replace('.', ',')}%`;
}

// ---- Format date ----
export function formatDate(isoDate: string): string {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleDateString('nl-NL');
}

// ---- Full calculation ----
export function runFullCalculation(application: Application): CalculationResult {
  const { applicants, mortgage } = application;

  const hoofdSources: IncomeSource[] =
    applicants
      .filter((a) => a.role === 'hoofdaanvrager')
      .flatMap((a) => a.incomeSources);

  const medeSources: IncomeSource[] =
    applicants
      .filter((a) => a.role === 'medeaanvrager')
      .flatMap((a) => a.incomeSources);

  const ghf = calculateGHF(hoofdSources, medeSources, mortgage);
  const nhg = checkNHG(mortgage);

  const actualPayment = calculateActualMonthlyPayment(
    mortgage.requestedAmount,
    mortgage.interestRate,
    mortgage.loanTerm,
    mortgage.mortgageType
  );

  const warnings: string[] = [];
  const advice: string[] = [];

  // Warnings
  if (mortgage.requestedAmount > ghf.maxMortgage) {
    warnings.push(
      `Gevraagd hypotheekbedrag (${formatEuro(mortgage.requestedAmount)}) overschrijdt het GHF-maximum (${formatEuro(ghf.maxMortgage)}) op basis van inkomen.`
    );
  }

  if (!ghf.ltvAllowed) {
    warnings.push(
      `LTV van ${ghf.ltvRatio}% overschrijdt het maximum van 100%. De hypotheek mag niet meer zijn dan de woningwaarde.`
    );
  }

  if (nhg.eligible && ghf.totalIncome < 20_000) {
    warnings.push('Inkomen is mogelijk te laag voor een hypotheek, ook met NHG.');
  }

  // Check ondernemer bedrijfsleeftijd
  const allSources = [...hoofdSources, ...medeSources];
  for (const src of allSources) {
    if (src.kind === 'entrepreneur') {
      const start = src.startDate ? new Date(src.startDate) : null;
      if (start) {
        const yearsActive = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const minRequired = src.businessType === 'bv_dga' ? 1 : 3;
        if (yearsActive < minRequired) {
          warnings.push(
            `Onderneming "${src.businessName}" is minder dan ${minRequired} jaar actief. De meeste geldverstrekkers vereisen minimaal ${minRequired} jaar.`
          );
        }
      }
    }
  }

  // Advice
  if (!nhg.eligible && mortgage.propertyValue <= 435_000) {
    advice.push('Overweeg NHG aan te vragen voor een lagere rente en extra zekerheid.');
  }

  if (ghf.ltvRatio > 90) {
    advice.push('Met een LTV > 90% is het verstandig om eigen middelen in te brengen voor lagere maandlasten.');
  }

  if (mortgage.mortgageType === 'lineair') {
    advice.push('Een lineaire hypotheek heeft hogere beginlasten maar u betaalt minder totale rente.');
  }

  const feasible =
    mortgage.requestedAmount <= ghf.maxMortgage &&
    ghf.ltvAllowed &&
    mortgage.requestedAmount > 0;

  return { ghf, nhg, actualPayment, feasible, warnings, advice };
}

// ---- LocalStorage persistence ----
const STORAGE_KEY = 'hypotheek_aanvragen';

export function loadApplications(): Application[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApplication(app: Application): void {
  if (typeof window === 'undefined') return;
  const apps = loadApplications();
  const idx = apps.findIndex((a) => a.id === app.id);
  const updated = { ...app, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    apps[idx] = updated;
  } else {
    apps.push(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function deleteApplication(id: string): void {
  if (typeof window === 'undefined') return;
  const apps = loadApplications().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function getApplication(id: string): Application | undefined {
  return loadApplications().find((a) => a.id === id);
}
