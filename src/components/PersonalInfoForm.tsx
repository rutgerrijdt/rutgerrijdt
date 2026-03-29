'use client';

import type { PersonalInfo } from '@/lib/types';

interface Props {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  title?: string;
}

export function PersonalInfoForm({ data, onChange, title = 'Persoonlijke gegevens' }: Props) {
  const set = <K extends keyof PersonalInfo>(key: K, value: PersonalInfo[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam *</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jan"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Achternaam *</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="de Vries"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum *</label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BSN</label>
          <input
            type="text"
            value={data.bsn}
            onChange={(e) => set('bsn', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123456789"
            maxLength={9}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => set('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="jan@email.nl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="06-12345678"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Straat en huisnummer</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => set('address', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kerkstraat 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
          <input
            type="text"
            value={data.postalCode}
            onChange={(e) => set('postalCode', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1234 AB"
            maxLength={7}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Woonplaats</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => set('city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Amsterdam"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationaliteit</label>
          <input
            type="text"
            value={data.nationality}
            onChange={(e) => set('nationality', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nederlands"
          />
        </div>
      </div>
    </div>
  );
}
