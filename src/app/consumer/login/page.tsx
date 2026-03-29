'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginConsumer, getCurrentConsumer } from '@/lib/auth';

export default function ConsumerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getCurrentConsumer()) {
      router.replace('/consumer');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Vul uw e-mailadres en wachtwoord in.');
      setLoading(false);
      return;
    }

    const result = loginConsumer(email, password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push('/consumer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900">Hypotheken App</h1>
          <p className="text-gray-500 text-sm mt-1">Consumentenportaal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Inloggen</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uw@email.nl"
                autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Inloggen
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-5">
            Uw inloggegevens ontvangt u van uw hypotheekadviseur.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Bent u een hypotheekadviseur?{' '}
          <a href="/" className="text-blue-600 hover:underline">
            Ga naar het adviseursdashboard
          </a>
        </p>
      </div>
    </div>
  );
}
