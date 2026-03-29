'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Application, Applicant } from '@/lib/types';
import { emptyMortgageDetails, emptyPersonalInfo } from '@/lib/types';
import { loadApplications, saveApplication, deleteApplication } from '@/lib/utils';
import { createConsumerAccount, getConsumerAccount } from '@/lib/auth';
import { IncomeStep } from '@/components/IncomeStep';
import { DebtForm } from '@/components/DebtForm';
import { MortgageForm } from '@/components/MortgageForm';
import { DocumentUpload } from '@/components/DocumentUpload';
import { ResultsPanel } from '@/components/ResultsPanel';

// ---- Types ----
type Step = 'inkomen' | 'schulden' | 'hypotheek' | 'documenten' | 'resultaat';

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'inkomen',    label: 'Aanvrager & inkomen', icon: '\u{1f464}' },
  { id: 'schulden',   label: 'Schulden',            icon: '\u{1f4b3}' },
  { id: 'hypotheek',  label: 'Hypotheek',           icon: '\u{1f3e0}' },
  { id: 'documenten', label: 'Documenten',          icon: '\u{1f4ce}' },
  { id: 'resultaat',  label: 'Berekening',          icon: '\u{1f4ca}' },
];

function createApplication(): Application {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `app-${Date.now()}`;

  const hoofdaanvrager: Applicant = {
    id: `aanvr-${Date.now()}`,
    role: 'hoofdaanvrager',
    personal: emptyPersonalInfo(),
    incomeSources: [],
  };

  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'concept',
    applicants: [hoofdaanvrager],
    mortgage: emptyMortgageDetails(),
    debts: [],
    documents: [],
    notes: '',
  };
}

// ============================================================
// Consumer account modal (for advisor)
// ============================================================
function ConsumerAccountModal({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) {
  const hoofdaanvrager = app.applicants.find((a) => a.role === 'hoofdaanvrager');
  const prefillEmail = hoofdaanvrager?.personal.email?.trim() ?? '';
  const prefillName =
    `${hoofdaanvrager?.personal.firstName ?? ''} ${hoofdaanvrager?.personal.lastName ?? ''}`.trim();

  const [email, setEmail] = useState(prefillEmail);
  const [name, setName] = useState(prefillName);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const existingAccount = prefillEmail ? getConsumerAccount(prefillEmail) : null;
  const [hasExisting] = useState(!!existingAccount);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vul een e-mailadres in.');
      return;
    }

    const result = createConsumerAccount(email, password, name);
    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {hasExisting ? 'Wachtwoord bijgewerkt' : 'Account aangemaakt'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            De consument kan nu inloggen op het portaal met:
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-1">
            <div>
              <span className="text-gray-500">E-mail: </span>
              <span className="font-medium text-gray-900">{email.trim().toLowerCase()}</span>
            </div>
            <div>
              <span className="text-gray-500">Wachtwoord: </span>
              <span className="font-medium text-gray-900">{password}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Deel deze gegevens veilig met de consument.</p>
          <button
            onClick={onClose}
            className="mt-5 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Sluiten
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-semibold text-gray-900 mb-1">
        {hasExisting ? 'Portaalaccount bijwerken' : 'Portaalaccount aanmaken'}
      </h3>
      <p className="text-xs text-gray-500 mb-5">
        {hasExisting
          ? 'Stel een nieuw wachtwoord in voor de consument.'
          : 'Maak inloggegevens aan voor de consument zodat zij hun aanvraag kunnen volgen.'}
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Naam consument</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Volledige naam"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mailadres <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="consument@email.nl"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {hasExisting ? 'Nieuw wachtwoord' : 'Wachtwoord'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimaal 6 tekens"
            autoComplete="off"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Zichtbaar zodat u het kunt doorgeven aan de consument.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            {hasExisting ? 'Wachtwoord instellen' : 'Account aanmaken'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Sluiten"
        >
          \u00d7
        </button>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function Home() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [applications, setApplications] = useState<Application[]>([]);
  const [current, setCurrent] = useState<Application | null>(null);
  const [step, setStep] = useState<Step>('inkomen');
  const [saved, setSaved] = useState(false);
  const [accountModalApp, setAccountModalApp] = useState<Application | null>(null);
  // Track which applications have a consumer account (re-evaluate after modal closes)
  const [accountEmails, setAccountEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    const apps = loadApplications();
    setApplications(apps);
    const emails = new Set<string>();
    apps.forEach((app) => {
      const email = app.applicants.find((a) => a.role === 'hoofdaanvrager')?.personal.email?.trim().toLowerCase();
      if (email && getConsumerAccount(email)) emails.add(email);
    });
    setAccountEmails(emails);
  }, []);

  const refreshAccountEmails = useCallback((apps: Application[]) => {
    const emails = new Set<string>();
    apps.forEach((app) => {
      const email = app.applicants.find((a) => a.role === 'hoofdaanvrager')?.personal.email?.trim().toLowerCase();
      if (email && getConsumerAccount(email)) emails.add(email);
    });
    setAccountEmails(emails);
  }, []);

  const persistSave = useCallback((app: Application) => {
    saveApplication(app);
    const apps = loadApplications();
    setApplications(apps);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const updateCurrent = useCallback(
    (updates: Partial<Application>) => {
      if (!current) return;
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      setCurrent(updated);
      persistSave(updated);
    },
    [current, persistSave]
  );

  const openNew = () => {
    const app = createApplication();
    setCurrent(app);
    setStep('inkomen');
    setView('form');
  };

  const openExisting = (app: Application) => {
    setCurrent({ ...app });
    setStep('inkomen');
    setView('form');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Weet u zeker dat u deze aanvraag wilt verwijderen?')) return;
    deleteApplication(id);
    const apps = loadApplications();
    setApplications(apps);
    refreshAccountEmails(apps);
  };

  const handleSubmit = () => {
    if (!current) return;
    updateCurrent({ status: 'ingediend' });
    alert('Aanvraag is als "ingediend" gemarkeerd.');
  };

  // ---- List view ----
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        {accountModalApp && (
          <ConsumerAccountModal
            app={accountModalApp}
            onClose={() => {
              setAccountModalApp(null);
              refreshAccountEmails(applications);
            }}
          />
        )}

        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Hypotheken App</h1>
              <p className="text-xs text-gray-500 mt-0.5">GHF &amp; NHG Berekeningen 2025</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/consumer/login"
                className="text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 transition"
              >
                Consumentenportaal
              </a>
              <button
                onClick={openNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
              >
                + Nieuwe aanvraag
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {applications.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">\u{1f3e0}</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Nog geen aanvragen</h2>
              <p className="text-gray-400 mb-6">Maak een nieuwe hypotheekaanvraag aan om te beginnen.</p>
              <button
                onClick={openNew}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
              >
                Eerste aanvraag starten
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-gray-700">
                  {applications.length} aanvra{applications.length === 1 ? 'ag' : 'gen'}
                </h2>
              </div>
              {applications.map((app) => {
                const hoofdaanvrager = app.applicants.find((a) => a.role === 'hoofdaanvrager');
                const naam = hoofdaanvrager
                  ? `${hoofdaanvrager.personal.firstName} ${hoofdaanvrager.personal.lastName}`.trim() || 'Naamloos'
                  : 'Naamloos';
                const consumerEmail = hoofdaanvrager?.personal.email?.trim().toLowerCase() ?? '';
                const hasAccount = consumerEmail ? accountEmails.has(consumerEmail) : false;

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{naam}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <StatusBadge status={app.status} />
                          <span className="text-xs text-gray-400">
                            Aangemaakt: {new Date(app.createdAt).toLocaleDateString('nl-NL')}
                          </span>
                          <span className="text-xs text-gray-400">
                            Gewijzigd: {new Date(app.updatedAt).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                          {app.mortgage.requestedAmount > 0 && (
                            <span>
                              Hypotheek:{' '}
                              <span className="font-medium">
                                {app.mortgage.requestedAmount.toLocaleString('nl-NL', {
                                  style: 'currency',
                                  currency: 'EUR',
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </span>
                          )}
                          {app.mortgage.propertyValue > 0 && (
                            <span>
                              Waarde:{' '}
                              <span className="font-medium">
                                {app.mortgage.propertyValue.toLocaleString('nl-NL', {
                                  style: 'currency',
                                  currency: 'EUR',
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </span>
                          )}
                          {app.documents.length > 0 && (
                            <span>
                              {app.documents.length} document{app.documents.length !== 1 ? 'en' : ''}
                            </span>
                          )}
                        </div>

                        {/* Consumer account status */}
                        <div className="mt-3 flex items-center gap-2">
                          {hasAccount ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                                \u2713 Portaalaccount actief
                              </span>
                              <span className="text-xs text-gray-400">{consumerEmail}</span>
                              <button
                                onClick={() => setAccountModalApp(app)}
                                className="text-xs text-gray-500 hover:text-blue-600 underline"
                              >
                                Wachtwoord wijzigen
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setAccountModalApp(app)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 hover:bg-blue-100 transition"
                            >
                              + Portaalaccount aanmaken
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4 shrink-0">
                        <button
                          onClick={() => openExisting(app)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 font-medium transition"
                        >
                          Openen
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 font-medium transition"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ---- Form view ----
  if (!current) return null;

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            \u2190 Overzicht
          </button>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-600 font-medium animate-pulse">Opgeslagen \u2713</span>
            )}
            <StatusBadge status={current.status} />
            <select
              value={current.status}
              onChange={(e) =>
                updateCurrent({ status: e.target.value as Application['status'] })
              }
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
            >
              <option value="concept">Concept</option>
              <option value="ingediend">Ingediend</option>
              <option value="in_behandeling">In behandeling</option>
              <option value="goedgekeurd">Goedgekeurd</option>
              <option value="afgewezen">Afgewezen</option>
            </select>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100">
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
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          {step === 'inkomen' && (
            <IncomeStep
              applicants={current.applicants}
              onChange={(applicants) => updateCurrent({ applicants })}
            />
          )}
          {step === 'schulden' && (
            <DebtForm
              debts={current.debts ?? []}
              onChange={(debts) => updateCurrent({ debts })}
              interestRate={current.mortgage.interestRate}
              loanTerm={current.mortgage.loanTerm}
            />
          )}
          {step === 'hypotheek' && (
            <MortgageForm
              data={current.mortgage}
              onChange={(mortgage) => updateCurrent({ mortgage })}
            />
          )}
          {step === 'documenten' && (
            <DocumentUpload
              documents={current.documents}
              onChange={(documents) => updateCurrent({ documents })}
            />
          )}
          {step === 'resultaat' && <ResultsPanel application={current} />}
        </div>

        {/* Notes */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notities</label>
          <textarea
            value={current.notes}
            onChange={(e) => updateCurrent({ notes: e.target.value })}
            rows={3}
            placeholder="Interne notities, opmerkingen, aandachtspunten..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              const prev = STEPS[stepIdx - 1];
              if (prev) setStep(prev.id);
            }}
            disabled={stepIdx === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            \u2190 Vorige
          </button>
          <div className="flex gap-2">
            {step === 'resultaat' && current.status === 'concept' && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm"
              >
                Aanvraag indienen
              </button>
            )}
            {stepIdx < STEPS.length - 1 && (
              <button
                onClick={() => {
                  const next = STEPS[stepIdx + 1];
                  if (next) setStep(next.id);
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Volgende \u2192
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- Status badge ----
function StatusBadge({ status }: { status: Application['status'] }) {
  const config: Record<Application['status'], { label: string; cls: string }> = {
    concept: { label: 'Concept', cls: 'bg-gray-100 text-gray-600' },
    ingediend: { label: 'Ingediend', cls: 'bg-blue-100 text-blue-700' },
    in_behandeling: { label: 'In behandeling', cls: 'bg-amber-100 text-amber-700' },
    goedgekeurd: { label: 'Goedgekeurd', cls: 'bg-green-100 text-green-700' },
    afgewezen: { label: 'Afgewezen', cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = config[status];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}
