'use client';

import { useState, useMemo } from 'react';
import {
  emptyBedrijfsgegevens,
  emptyBalans,
  emptyWinstVerlies,
  berekenJaarcijfers,
  BEDRIJFSVORM_INFO,
  type Bedrijfsgegevens,
  type Balans,
  type WinstVerlies,
} from '@/lib/jaarcijfers';
import { StepBedrijfsgegevens } from '@/components/jaarcijfers/StepBedrijfsgegevens';
import { StepBalans } from '@/components/jaarcijfers/StepBalans';
import { StepWinstVerlies } from '@/components/jaarcijfers/StepWinstVerlies';
import { StepAnalyse } from '@/components/jaarcijfers/StepAnalyse';
import { RapportUpload, type ExtractieData } from '@/components/jaarcijfers/RapportUpload';

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
  const [uploadSucces, setUploadSucces] = useState<string | null>(null);

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
    setUploadSucces(null);
    setStep('bedrijfsgegevens');
  };

  // ---- Verwerk geëxtraheerde rapportgegevens ----
  function handleExtracted(data: ExtractieData) {
    // Bedrijfsgegevens
    setBedrijfsgegevens((prev) => ({
      ...prev,
      ...(data.naam ? { naam: data.naam } : {}),
      ...(data.boekjaar ? { boekjaar: data.boekjaar } : {}),
      ...(data.bedrijfsvorm ? { bedrijfsvorm: data.bedrijfsvorm } : {}),
    }));

    // Balans – vervang alleen als er data is
    if (Object.values(data.balans).some((v) => v !== 0)) {
      setBalans((prev) => ({ ...prev, ...data.balans }));
    }

    // W&V – vervang alleen als er data is
    if (Object.values(data.winstVerlies).some((v) => v !== 0)) {
      setWinstVerlies((prev) => ({ ...prev, ...data.winstVerlies }));
    }

    // Toon bevestigingsbanner
    const naam = data.naam ?? 'Rapport';
    const boekjaar = data.boekjaar ? ` (${data.boekjaar})` : '';
    setUploadSucces(`${naam}${boekjaar} is ingelezen en verwerkt.`);

    // Ga naar balans zodat gebruiker direct kan controleren
    setStep('balans');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Jaarcijfersanalyse</h1>
            <p className="text-xs text-gray-500">
              {bedrijfsgegevens.naam
                ? `${bedrijfsgegevens.naam} · ${BEDRIJFSVORM_INFO[bedrijfsgegevens.bedrijfsvorm].label} · ${bedrijfsgegevens.boekjaar}`
                : 'Alle bedrijfsvormen · Ratio-analyse · Rapport'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-blue-600 hover:underline hidden sm:inline">
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

      {/* Upload-succesbanner */}
      {uploadSucces && (
        <div className="max-w-5xl mx-auto px-4 pt-4 no-print">
          <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <span className="text-sm text-green-800">
              <strong>✓ Automatisch ingevuld:</strong> {uploadSucces} Controleer de velden en pas aan waar nodig.
            </span>
            <button
              onClick={() => setUploadSucces(null)}
              className="text-green-600 hover:text-green-800 text-lg leading-none shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Inhoud */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">

          {/* Upload-sectie: toon op alle stappen behalve analyse */}
          {step !== 'analyse' && (
            <div className="mb-2">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 list-none flex items-center gap-1.5 mb-3">
                  <span>📤</span>
                  <span>Snel invullen via jaarrapport (PDF)</span>
                  <span className="text-gray-400 text-xs ml-1">▼</span>
                </summary>
                <RapportUpload onExtracted={handleExtracted} />
              </details>
              <hr className="border-gray-100 mb-4" />
            </div>
          )}

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
