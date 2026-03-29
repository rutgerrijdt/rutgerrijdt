'use client';

import { useState } from 'react';
import type { Applicant, IncomeSource } from '@/lib/types';
import { emptyEmployedIncome, emptyEntrepreneurIncome } from '@/lib/types';
import { EmployedIncomeForm } from './EmployedIncomeForm';
import { EntrepreneurIncomeForm } from './EntrepreneurIncomeForm';
import { PersonalInfoForm } from './PersonalInfoForm';
import { calculateIncomeFromSource } from '@/lib/ghf';
import { formatEuro } from '@/lib/utils';

interface Props {
  applicants: Applicant[];
  onChange: (applicants: Applicant[]) => void;
}

export function IncomeStep({ applicants, onChange }: Props) {
  const [showAddPartner, setShowAddPartner] = useState(false);

  const updateApplicant = (idx: number, updated: Applicant) => {
    const next = [...applicants];
    next[idx] = updated;
    onChange(next);
  };

  const addIncomeSource = (applicantIdx: number, kind: 'employed' | 'entrepreneur') => {
    const applicant = applicants[applicantIdx];
    const newSource: IncomeSource =
      kind === 'employed' ? emptyEmployedIncome() : emptyEntrepreneurIncome();
    updateApplicant(applicantIdx, {
      ...applicant,
      incomeSources: [...applicant.incomeSources, newSource],
    });
  };

  const updateIncomeSource = (applicantIdx: number, srcIdx: number, src: IncomeSource) => {
    const applicant = applicants[applicantIdx];
    const sources = [...applicant.incomeSources];
    sources[srcIdx] = src;
    updateApplicant(applicantIdx, { ...applicant, incomeSources: sources });
  };

  const removeIncomeSource = (applicantIdx: number, srcIdx: number) => {
    const applicant = applicants[applicantIdx];
    const sources = applicant.incomeSources.filter((_, i) => i !== srcIdx);
    updateApplicant(applicantIdx, { ...applicant, incomeSources: sources });
  };

  const addPartner = () => {
    const { v4: uuidv4 } = require('uuid');
    const partner: Applicant = {
      id: uuidv4(),
      role: 'medeaanvrager',
      personal: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        bsn: '',
        email: '',
        phone: '',
        address: '',
        postalCode: '',
        city: '',
        nationality: 'Nederlands',
      },
      incomeSources: [],
    };
    onChange([...applicants, partner]);
    setShowAddPartner(false);
  };

  const removePartner = (idx: number) => {
    onChange(applicants.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {applicants.map((applicant, aIdx) => {
        const totalIncome = applicant.incomeSources.reduce(
          (sum, src) => sum + calculateIncomeFromSource(src),
          0
        );

        return (
          <div key={applicant.id} className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {applicant.role === 'hoofdaanvrager' ? 'Aanvrager 1' : `Aanvrager 2 (medeaanvrager)`}
              </h3>
              {applicant.role === 'medeaanvrager' && (
                <button
                  onClick={() => removePartner(aIdx)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Medeaanvrager verwijderen
                </button>
              )}
            </div>

            {/* Personal info */}
            <div className="mb-5">
              <PersonalInfoForm
                data={applicant.personal}
                onChange={(p) => updateApplicant(aIdx, { ...applicant, personal: p })}
                title="Persoonlijke gegevens"
              />
            </div>

            {/* Income sources */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Inkomensbronnen</h4>

              {applicant.incomeSources.map((src, sIdx) => (
                <div key={sIdx}>
                  {src.kind === 'employed' ? (
                    <EmployedIncomeForm
                      data={src}
                      onChange={(updated) => updateIncomeSource(aIdx, sIdx, updated)}
                      onRemove={() => removeIncomeSource(aIdx, sIdx)}
                    />
                  ) : (
                    <EntrepreneurIncomeForm
                      data={src}
                      onChange={(updated) => updateIncomeSource(aIdx, sIdx, updated)}
                      onRemove={() => removeIncomeSource(aIdx, sIdx)}
                    />
                  )}
                </div>
              ))}

              {applicant.incomeSources.length === 0 && (
                <p className="text-sm text-gray-400 italic">Nog geen inkomensbron toegevoegd.</p>
              )}

              <div className="flex gap-2 flex-wrap pt-1">
                <button
                  onClick={() => addIncomeSource(aIdx, 'employed')}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition"
                >
                  + Loondienst
                </button>
                <button
                  onClick={() => addIncomeSource(aIdx, 'entrepreneur')}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition"
                >
                  + Ondernemer
                </button>
              </div>
            </div>

            {totalIncome > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Totaal toetsinkomen:</span>{' '}
                  {formatEuro(totalIncome)} per jaar
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Add partner */}
      {applicants.length === 1 && (
        <button
          onClick={addPartner}
          className="w-full py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 text-sm font-medium transition"
        >
          + Medeaanvrager / partner toevoegen
        </button>
      )}
    </div>
  );
}
