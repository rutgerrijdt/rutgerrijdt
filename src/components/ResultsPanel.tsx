'use client';

import type { Application, CalculationResult } from '@/lib/types';
import { runFullCalculation, formatEuro, formatPercent } from '@/lib/utils';
import { calculateBijkomendeKosten, calculateOVB } from '@/lib/nhg';

interface Props {
  application: Application;
}

export function ResultsPanel({ application }: Props) {
  const result: CalculationResult = runFullCalculation(application);
  const { ghf, nhg, actualPayment, feasible, warnings, advice } = result;

  const hoofdaanvrager = application.applicants.find((a) => a.role === 'hoofdaanvrager');
  const dob = hoofdaanvrager?.personal.dateOfBirth ?? '';
  const ovb = calculateOVB(application.mortgage.propertyValue, dob, true);
  const bijkomend = calculateBijkomendeKosten(
    application.mortgage.propertyValue,
    application.mortgage.requestedAmount,
    nhg.eligible,
    ovb.amount
  );

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Berekening & advies</h3>

      {/* Feasibility badge */}
      <div
        className={`rounded-xl p-4 ${
          feasible
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{feasible ? '✅' : '❌'}</span>
          <div>
            <p className={`font-bold text-base ${feasible ? 'text-green-800' : 'text-red-800'}`}>
              {feasible ? 'Hypotheek lijkt haalbaar' : 'Hypotheek niet haalbaar op basis van opgegeven gegevens'}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              Indicatieve berekening — definitief oordeel door geldverstrekker
            </p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Aandachtspunten</h4>
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
              <span className="mt-0.5">⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* GHF Result */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-blue-600 px-4 py-3">
          <h4 className="text-white font-semibold text-sm">GHF – Inkomen & maximale hypotheek</h4>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ResultCard label="Toetsinkomen" value={formatEuro(ghf.totalIncome)} sub="bruto per jaar" />
            <ResultCard
              label="Financieringslast %"
              value={`${ghf.financingLoadPercentage}%`}
              sub="van bruto inkomen"
            />
            <ResultCard
              label="Toetsrente"
              value={formatPercent(ghf.toetsRente)}
              sub={application.mortgage.fixedRatePeriod < 10 ? 'minimale toetsrente' : 'werkelijke rente'}
            />
            <ResultCard
              label="Max. maandlast"
              value={formatEuro(ghf.maxMonthlyPayment)}
              sub="bruto woonlast"
              highlight
            />
            <ResultCard
              label="Max. hypotheek"
              value={formatEuro(ghf.maxMortgage)}
              sub="op basis van inkomen"
              highlight
            />
            <ResultCard
              label="LTV ratio"
              value={`${ghf.ltvRatio}%`}
              sub={ghf.ltvAllowed ? 'binnen norm (≤100%)' : 'boven maximum'}
              alert={!ghf.ltvAllowed}
            />
          </div>

          {application.mortgage.requestedAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div
                  className={`text-sm font-medium ${
                    application.mortgage.requestedAmount <= ghf.maxMortgage
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}
                >
                  Gevraagd bedrag: {formatEuro(application.mortgage.requestedAmount)}
                </div>
                <div className="text-sm text-gray-500">
                  {application.mortgage.requestedAmount <= ghf.maxMortgage
                    ? `(${formatEuro(ghf.maxMortgage - application.mortgage.requestedAmount)} onder maximum)`
                    : `(${formatEuro(application.mortgage.requestedAmount - ghf.maxMortgage)} boven maximum)`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NHG Result */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className={`px-4 py-3 ${nhg.eligible ? 'bg-green-600' : 'bg-gray-400'}`}>
          <h4 className="text-white font-semibold text-sm">
            NHG – Nationale Hypotheek Garantie {nhg.eligible ? '(van toepassing)' : '(niet van toepassing)'}
          </h4>
        </div>
        <div className="p-4">
          {nhg.eligible ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ResultCard label="NHG-grens" value={formatEuro(nhg.maxLimit)} sub="maximaal" />
              <ResultCard label="Borgtochtprovisie" value={formatEuro(nhg.fee)} sub="eenmalig (0,6%)" />
              <ResultCard
                label="Rente­voordeel"
                value={formatPercent(nhg.interestDiscount)}
                sub="indicatief p.j."
                highlight
              />
              <ResultCard
                label="Netto besparing"
                value={formatEuro(Math.max(0, nhg.netBenefit))}
                sub="over gehele looptijd"
                highlight
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">{nhg.reason}</p>
          )}
        </div>
      </div>

      {/* Actual monthly payment */}
      {application.mortgage.requestedAmount > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3">
            <h4 className="text-white font-semibold text-sm">Werkelijke maandlasten</h4>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultCard
                label="1e maand"
                value={formatEuro(actualPayment.firstMonth)}
                sub="bruto maandlast"
                highlight
              />
              {application.mortgage.mortgageType === 'lineair' && (
                <ResultCard
                  label="Laatste maand"
                  value={formatEuro(actualPayment.lastMonth)}
                  sub="bruto maandlast"
                />
              )}
              <ResultCard
                label="Totale rente"
                value={formatEuro(actualPayment.totalInterest)}
                sub={`over ${application.mortgage.loanTerm} jaar`}
              />
              <ResultCard
                label="Totaal betaald"
                value={formatEuro(actualPayment.totalRepayment)}
                sub="rente + aflossing"
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Rente: {formatPercent(application.mortgage.interestRate)} &middot;{' '}
              {application.mortgage.mortgageType === 'annuiteit' ? 'Annuïtair' : 'Lineair'} &middot;{' '}
              {application.mortgage.loanTerm} jaar
            </p>
          </div>
        </div>
      )}

      {/* Bijkomende kosten */}
      {application.mortgage.propertyValue > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-orange-500 px-4 py-3">
            <h4 className="text-white font-semibold text-sm">Bijkomende kosten (indicatief)</h4>
          </div>
          <div className="p-4 space-y-2">
            <CostRow label="Overdrachtsbelasting" value={bijkomend.ovb} note={ovb.starterVrijstelling ? 'Startersvrijstelling toegepast' : '2%'} />
            <CostRow label="Notariskosten" value={bijkomend.notariskosten} />
            <CostRow label="Taxatiekosten" value={bijkomend.taxatiekosten} />
            {nhg.eligible && <CostRow label="NHG borgtochtprovisie" value={bijkomend.nhgFee} note="0,6%" />}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="text-sm font-semibold text-gray-800">Totaal bijkomende kosten</span>
              <span className="text-sm font-bold text-gray-900">{formatEuro(bijkomend.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Advice */}
      {advice.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Advies & aanbevelingen</h4>
          {advice.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-blue-800">
              <span className="mt-0.5">💡</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Deze berekening is indicatief en gebaseerd op GHF-normen 2025. Definitieve acceptatie is aan de geldverstrekker.
      </p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  sub,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${
        alert ? 'bg-red-50' : highlight ? 'bg-blue-50' : 'bg-gray-50'
      }`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-base font-bold mt-0.5 ${
          alert ? 'text-red-700' : highlight ? 'text-blue-700' : 'text-gray-800'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function CostRow({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">
        {label}
        {note && <span className="text-xs text-gray-400 ml-1">({note})</span>}
      </span>
      <span className="font-medium text-gray-800">{formatEuro(value)}</span>
    </div>
  );
}
