'use client';

import { useState, useMemo } from 'react';
import {
  emptyBedrijfsgegevens,
  emptyBalans,
  emptyWinstVerlies,
  berekenJaarcijfers,
  type Bedrijfsgegevens,
  type Balans,
  type WinstVerlies,
} from '@/lib/jaarcijfers';
import { StepBedrijfsgegevens } from '@/components/jaarcijfers/StepBedrijfsgegevens';
import { StepBalans } from '@/components/jaarcijfers/StepBalans';
import { StepWinstVerlies } from '@/components/jaarcijfers/StepWinstVerlies';
import { StepAnalyse } from '@/components/jaarcijfers/StepAnalyse';

type Step = 'bedrijfsgegevens' | 'balans' | 'winstVerlies' | 'analyse';

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'bedrijfsgegevens', label: 'Bedrijfsgegevens', icon: '🏢' },
  { id: 'balans', label: 'Balans', icon: '⚖️' },
  { id: 'winstVerlies', label: 'Winst & Verlies', icon: '📊' },
  { id: 'analyse', label: 'Analyse & Rapport', icon: '📋' },
];

export default function JaarcijfersPage() {
  const [step, setStep] = useState<Step>('bedrijfsgegevens');
  const [bedrijfsgegevens, setBedrijfsgegevens] = useState<Bedrijfsgegevens>(emptyBedrijfsgegevens());
  const [balans, setBalans] = useState<Balans>(emptyBalans());
  const [winstVerlies, setWinstVerlies] = useState<WinstVerlies>(emptyWinstVerlies());

  const berekening = useMemo(
    () => berekenJaarcijfers(bedrijfsgegevens, balans, winstVerlies),
    [bedrijfsgegevens, balans, winstVerlies],
  );

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  const reset = () => {
    if (!confirm('Weet u zeker dat u alle gegevens wilt wissen?')) return;
    setBedrijfsgegevens(emptyBedrijfsgegevens());
    setBalans(emptyBalans());
    setWinstVerlies(emptyWinstVerlies());
    setStep('bedrijfsgegevens');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Jaarcijfersanalyse</h1>
            <p className="text-xs text-gray-500">Alle bedrijfsvormen · Ratio-analyse · Rapport</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-sm text-blue-600 hover:underline hidden sm:inline"
            >
              ← Hypothekenapp
            </a>
            <button
              onClick={reset}
              className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg px-3 py-1.5 transition"
            >
              Opnieuw beginnen
            </button>
          </div>
        </div>
      </header>

      {/* Stap-navigatie */}
      <div className="bg-white border-b border-gray-100 no-print">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  s.id === step
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">{s.icon}</span>
                <span className="hidden md:inline">{s.label}</span>
                <span className="md:hidden">{i + 1}. {s.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inhoud */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          {step === 'bedrijfsgegevens' && (
            <StepBedrijfsgegevens data={bedrijfsgegevens} onChange={setBedrijfsgegevens} />
          )}

          {step === 'balans' && (
            <StepBalans
              data={balans}
              bedrijfsvorm={bedrijfsgegevens.bedrijfsvorm}
              onChange={setBalans}
              totaalActiva={berekening.totaalActiva}
              totaalPassiva={berekening.totaalPassiva}
              eigenVermogen={berekening.eigenVermogen}
              kortlopendeSchulden={berekening.kortlopendeSchulden}
              langlopendeSchulden={berekening.langlopendeSchulden}
              vasteActiva={berekening.vasteActiva}
              vlottendeActiva={berekening.vlottendeActiva}
              totaalVoorzieningen={berekening.totaalVoorzieningen}
              totaalVreemdVermogen={berekening.totaalVreemdVermogen}
              balansverschil={berekening.balansverschil}
            />
          )}

          {step === 'winstVerlies' && (
            <StepWinstVerlies
              data={winstVerlies}
              bedrijfsvorm={bedrijfsgegevens.bedrijfsvorm}
              onChange={setWinstVerlies}
              brutowinst={berekening.brutowinst}
              totaleBedrijfskosten={berekening.totaleBedrijfskosten}
              ebit={berekening.ebit}
              ebitda={berekening.ebitda}
              resultaatVoorBelasting={berekening.resultaatVoorBelasting}
              nettoresultaat={berekening.nettoresultaat}
              ondernemersaftrek={berekening.ondernemersaftrek}
              belastbaarInkomenVoorMKB={berekening.belastbaarInkomenVoorMKB}
              mkbVrijstelling={berekening.mkbVrijstelling}
              belastbaarInkomen={berekening.belastbaarInkomen}
            />
          )}

          {step === 'analyse' && (
            <StepAnalyse
              bedrijfsgegevens={bedrijfsgegevens}
              balans={balans}
              winstVerlies={winstVerlies}
              berekening={berekening}
            />
          )}
        </div>

        {/* Navigatieknoppen */}
        <div className="mt-4 flex items-center justify-between no-print">
          <button
            onClick={() => {
              const prev = STEPS[stepIdx - 1];
              if (prev) setStep(prev.id);
            }}
            disabled={stepIdx === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Vorige
          </button>

          {stepIdx < STEPS.length - 1 && (
            <button
              onClick={() => {
                const next = STEPS[stepIdx + 1];
                if (next) setStep(next.id);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Volgende →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
