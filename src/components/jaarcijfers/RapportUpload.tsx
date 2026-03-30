'use client';

import { useRef, useState } from 'react';
import type { Balans, WinstVerlies, Bedrijfsvorm } from '@/lib/jaarcijfers';

export interface ExtractieData {
  naam?: string;
  boekjaar?: string;
  bedrijfsvorm?: Bedrijfsvorm;
  balans: Partial<Balans>;
  winstVerlies: Partial<WinstVerlies>;
}

interface Props {
  onExtracted: (data: ExtractieData) => void;
}

type Status = 'idle' | 'uploading' | 'success' | 'error';

function safeNum(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

function parseExtractie(raw: Record<string, unknown>): ExtractieData {
  const b = (raw.balans ?? {}) as Record<string, unknown>;
  const wv = (raw.winstVerlies ?? {}) as Record<string, unknown>;

  return {
    naam: typeof raw.naam === 'string' ? raw.naam : undefined,
    boekjaar: typeof raw.boekjaar === 'string' ? raw.boekjaar : undefined,
    bedrijfsvorm:
      typeof raw.bedrijfsvorm === 'string' &&
      ['eenmanszaak', 'vof', 'maatschap', 'cv', 'bv', 'nv'].includes(raw.bedrijfsvorm)
        ? (raw.bedrijfsvorm as Bedrijfsvorm)
        : undefined,
    balans: {
      immaterieleVasteActiva: safeNum(b.immaterieleVasteActiva),
      materieleVasteActiva: safeNum(b.materieleVasteActiva),
      financieleVasteActiva: safeNum(b.financieleVasteActiva),
      voorraden: safeNum(b.voorraden),
      debiteuren: safeNum(b.debiteuren),
      overigeVorderingen: safeNum(b.overigeVorderingen),
      liquideMiddelen: safeNum(b.liquideMiddelen),
      aandelenkapitaal: safeNum(b.aandelenkapitaal),
      agioreserve: safeNum(b.agioreserve),
      wettelijkeReserves: safeNum(b.wettelijkeReserves),
      overigeReserves: safeNum(b.overigeReserves),
      winstBoekjaar: safeNum(b.winstBoekjaar),
      voorzieningen: safeNum(b.voorzieningen),
      langlopendeLeningen: safeNum(b.langlopendeLeningen),
      overigeLanglopendeSchulden: safeNum(b.overigeLanglopendeSchulden),
      crediteuren: safeNum(b.crediteuren),
      kortlopendeBank: safeNum(b.kortlopendeBank),
      belastingenPremies: safeNum(b.belastingenPremies),
      overigeKortlopendeSchulden: safeNum(b.overigeKortlopendeSchulden),
    },
    winstVerlies: {
      omzet: safeNum(wv.omzet),
      kostprijsOmzet: safeNum(wv.kostprijsOmzet),
      personeelskosten: safeNum(wv.personeelskosten),
      afschrijvingen: safeNum(wv.afschrijvingen),
      huisvestingkosten: safeNum(wv.huisvestingkosten),
      verkoopkosten: safeNum(wv.verkoopkosten),
      algemeneBeheerkosten: safeNum(wv.algemeneBeheerkosten),
      overigeBedrKosten: safeNum(wv.overigeBedrKosten),
      financieleBaten: safeNum(wv.financieleBaten),
      rentelasten: safeNum(wv.rentelasten),
      zelfstandigenaftrek: safeNum(wv.zelfstandigenaftrek),
      startersaftrek: safeNum(wv.startersaftrek),
      meewerkaftrek: safeNum(wv.meewerkaftrek),
      vpbBelasting: safeNum(wv.vpbBelasting),
      dgaSalaris: safeNum(wv.dgaSalaris),
    },
  };
}

function countNonZero(obj: Partial<Record<string, number>>): number {
  return Object.values(obj).filter((v) => v !== undefined && v !== 0).length;
}

export function RapportUpload({ onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [bestandsnaam, setBestandsnaam] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [gevonden, setGevonden] = useState<{ balans: number; wv: number; naam?: string; boekjaar?: string } | null>(null);
  const [pendingData, setPendingData] = useState<ExtractieData | null>(null);

  async function verwerk(file: File) {
    if (file.type !== 'application/pdf') {
      setError('Alleen PDF-bestanden worden ondersteund.');
      setStatus('error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Bestand is te groot (max. 20 MB).');
      setStatus('error');
      return;
    }

    setBestandsnaam(file.name);
    setStatus('uploading');
    setError('');
    setGevonden(null);
    setPendingData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract-jaarcijfers', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error ?? 'Onbekende fout');
      }

      const extracted = parseExtractie(json.data as Record<string, unknown>);
      const nBalans = countNonZero(extracted.balans as Record<string, number>);
      const nWV = countNonZero(extracted.winstVerlies as Record<string, number>);

      setPendingData(extracted);
      setGevonden({ balans: nBalans, wv: nWV, naam: extracted.naam, boekjaar: extracted.boekjaar });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout bij verwerken.');
      setStatus('error');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) verwerk(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) verwerk(file);
  }

  function handleToepassen() {
    if (pendingData) {
      onExtracted(pendingData);
      setPendingData(null);
      setStatus('idle');
      setBestandsnaam('');
    }
  }

  function handleNieuw() {
    setStatus('idle');
    setError('');
    setBestandsnaam('');
    setGevonden(null);
    setPendingData(null);
  }

  return (
    <div className="mb-6">
      {/* Dropzone – idle of error */}
      {(status === 'idle' || status === 'error') && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-6 cursor-pointer transition ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
          }`}
        >
          <span className="text-3xl">📄</span>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              Sleep een jaarrapport hierheen of klik om te uploaden
            </p>
            <p className="text-xs text-gray-400 mt-0.5">PDF · max. 20 MB</p>
          </div>
          {status === 'error' && (
            <p className="text-sm text-red-600 font-medium mt-1">{error}</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Loading */}
      {status === 'uploading' && (
        <div className="flex items-center gap-4 border border-blue-200 bg-blue-50 rounded-xl px-5 py-4">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Rapport wordt uitgelezen…</p>
            <p className="text-xs text-blue-600 mt-0.5 truncate max-w-xs">{bestandsnaam}</p>
          </div>
        </div>
      )}

      {/* Success – wachten op toepassen */}
      {status === 'success' && gevonden && (
        <div className="border border-green-200 bg-green-50 rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-lg shrink-0">✓</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">Rapport uitgelezen</p>
              <p className="text-xs text-green-600 truncate mt-0.5">{bestandsnaam}</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                {gevonden.naam && (
                  <span className="text-xs bg-white border border-green-200 rounded-full px-2 py-0.5 text-green-800">
                    {gevonden.naam}
                  </span>
                )}
                {gevonden.boekjaar && (
                  <span className="text-xs bg-white border border-green-200 rounded-full px-2 py-0.5 text-green-800">
                    Boekjaar {gevonden.boekjaar}
                  </span>
                )}
                {gevonden.balans > 0 && (
                  <span className="text-xs bg-white border border-green-200 rounded-full px-2 py-0.5 text-green-800">
                    {gevonden.balans} balansposten
                  </span>
                )}
                {gevonden.wv > 0 && (
                  <span className="text-xs bg-white border border-green-200 rounded-full px-2 py-0.5 text-green-800">
                    {gevonden.wv} W&amp;V-posten
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleToepassen}
                className="bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition whitespace-nowrap"
              >
                Toepassen
              </button>
              <button
                onClick={handleNieuw}
                className="text-sm text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
