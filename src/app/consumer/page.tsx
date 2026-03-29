'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentConsumer, logoutConsumer } from '@/lib/auth';
import { loadApplications } from '@/lib/utils';
import type { Application, UploadedDocument } from '@/lib/types';

const STATUS_STEPS = [
  { id: 'concept',         label: 'Aanvraag gestart' },
  { id: 'ingediend',       label: 'Ingediend' },
  { id: 'in_behandeling',  label: 'In behandeling' },
  { id: 'goedgekeurd',     label: 'Goedgekeurd' },
];

function statusIndex(status: Application['status']): number {
  if (status === 'afgewezen') return -1;
  return STATUS_STEPS.findIndex((s) => s.id === status);
}

export default function ConsumerDashboard() {
  const router = useRouter();
  const [consumerName, setConsumerName] = useState('');
  const [consumerEmail, setConsumerEmail] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const account = getCurrentConsumer();
    if (!account) {
      router.replace('/consumer/login');
      return;
    }
    setConsumerName(account.name);
    setConsumerEmail(account.email);

    // Find applications linked to this consumer by email
    const all = loadApplications();
    const linked = all.filter((app) =>
      app.applicants.some(
        (a) => a.personal.email.trim().toLowerCase() === account.email
      )
    );
    setApplications(linked);
    if (linked.length === 1) setSelectedApp(linked[0]);
  }, [router]);

  const handleLogout = () => {
    logoutConsumer();
    router.push('/consumer/login');
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedApp) return;
    setUploadError('');

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Bestand is te groot (max. 10 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newDoc: UploadedDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: 'overig',
        uploadedAt: new Date().toISOString(),
        dataUrl: reader.result as string,
      };

      const updatedApp: Application = {
        ...selectedApp,
        documents: [...selectedApp.documents, newDoc],
        updatedAt: new Date().toISOString(),
      };

      // Save back to localStorage
      const all = loadApplications();
      const updated = all.map((a) => (a.id === updatedApp.id ? updatedApp : a));
      localStorage.setItem('hypotheek_applications', JSON.stringify(updated));
      setSelectedApp(updatedApp);
      setApplications((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!consumerEmail) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏠</span>
            <div>
              <h1 className="text-base font-bold text-gray-900">Mijn Hypotheekaanvraag</h1>
              <p className="text-xs text-gray-500">{consumerEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 hidden sm:inline">Hallo, {consumerName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* No applications */}
        {applications.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Geen aanvraag gevonden</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Er is nog geen hypotheekaanvraag aan uw e-mailadres gekoppeld. Neem contact op
              met uw hypotheekadviseur.
            </p>
          </div>
        )}

        {/* Application selector (multiple) */}
        {applications.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Selecteer een aanvraag</p>
            <div className="space-y-2">
              {applications.map((app) => {
                const hoofdaanvrager = app.applicants.find((a) => a.role === 'hoofdaanvrager');
                const naam = hoofdaanvrager
                  ? `${hoofdaanvrager.personal.firstName} ${hoofdaanvrager.personal.lastName}`.trim() || 'Naamloos'
                  : 'Naamloos';
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                      selectedApp?.id === app.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{naam}</span>
                    <span className="text-gray-400 ml-2">
                      {new Date(app.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedApp && (
          <>
            {/* Status progress */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Status van uw aanvraag</h2>

              {selectedApp.status === 'afgewezen' ? (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-medium text-red-700">Aanvraag afgewezen</p>
                    <p className="text-sm text-red-500">Neem contact op met uw adviseur voor meer informatie.</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-blue-500 transition-all"
                    style={{
                      width: `${(statusIndex(selectedApp.status) / (STATUS_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((s, i) => {
                      const current = statusIndex(selectedApp.status);
                      const done = i <= current;
                      const active = i === current;
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-2" style={{ width: '25%' }}>
                          <div
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition ${
                              active
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : done
                                ? 'border-blue-400 bg-blue-100 text-blue-600'
                                : 'border-gray-200 bg-white text-gray-400'
                            }`}
                          >
                            {done && !active ? '✓' : i + 1}
                          </div>
                          <span
                            className={`text-xs text-center leading-tight ${
                              active ? 'font-semibold text-blue-600' : done ? 'text-gray-600' : 'text-gray-400'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mortgage summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Hypotheekgegevens</h2>
              <div className="grid grid-cols-2 gap-4">
                {selectedApp.mortgage.requestedAmount > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Gevraagd bedrag</p>
                    <p className="font-semibold text-gray-900">
                      {selectedApp.mortgage.requestedAmount.toLocaleString('nl-NL', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                )}
                {selectedApp.mortgage.propertyValue > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Woningwaarde</p>
                    <p className="font-semibold text-gray-900">
                      {selectedApp.mortgage.propertyValue.toLocaleString('nl-NL', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Hypotheekvorm</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {selectedApp.mortgage.mortgageType}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Looptijd</p>
                  <p className="font-semibold text-gray-900">
                    {selectedApp.mortgage.loanTerm} jaar
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Rentevaste periode</p>
                  <p className="font-semibold text-gray-900">
                    {selectedApp.mortgage.fixedRatePeriod} jaar
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Rente</p>
                  <p className="font-semibold text-gray-900">
                    {(selectedApp.mortgage.interestRate * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              {selectedApp.mortgage.nhgDesired && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2.5">
                  <span>✓</span>
                  <span>NHG (Nationale Hypotheek Garantie) gewenst</span>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Documenten</h2>
                <label className="cursor-pointer bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                  + Document toevoegen
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={handleDocumentUpload}
                  />
                </label>
              </div>

              {uploadError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  Document succesvol toegevoegd.
                </div>
              )}

              {selectedApp.documents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Nog geen documenten geüpload.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {selectedApp.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 py-3">
                      <span className="text-2xl">{fileIcon(doc.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatBytes(doc.fileSize)} &middot;{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Personal info (read-only) */}
            {(() => {
              const hoofdaanvrager = selectedApp.applicants.find((a) => a.role === 'hoofdaanvrager');
              if (!hoofdaanvrager) return null;
              const p = hoofdaanvrager.personal;
              return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Uw gegevens</h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {p.firstName && (
                      <div>
                        <p className="text-xs text-gray-500">Voornaam</p>
                        <p className="font-medium text-gray-800">{p.firstName}</p>
                      </div>
                    )}
                    {p.lastName && (
                      <div>
                        <p className="text-xs text-gray-500">Achternaam</p>
                        <p className="font-medium text-gray-800">{p.lastName}</p>
                      </div>
                    )}
                    {p.dateOfBirth && (
                      <div>
                        <p className="text-xs text-gray-500">Geboortedatum</p>
                        <p className="font-medium text-gray-800">{p.dateOfBirth}</p>
                      </div>
                    )}
                    {p.phone && (
                      <div>
                        <p className="text-xs text-gray-500">Telefoon</p>
                        <p className="font-medium text-gray-800">{p.phone}</p>
                      </div>
                    )}
                    {p.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Adres</p>
                        <p className="font-medium text-gray-800">
                          {p.address}{p.postalCode ? `, ${p.postalCode}` : ''}{p.city ? ` ${p.city}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Klopt er iets niet? Neem contact op met uw hypotheekadviseur.
                  </p>
                </div>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}

function fileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('word')) return '📝';
  return '📎';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
