'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginConsumer, registerConsumer, getCurrentConsumer } from '@/lib/auth';

export default function ConsumerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
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
      setError('Vul alle verplichte velden in.');
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Vul uw naam in.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Wachtwoord moet minimaal 6 tekens zijn.');
        setLoading(false);
        return;
      }
      const result = registerConsumer(email, password, name);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }
    } else {
      const result = loginConsumer(email, password);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }
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
          {/* Tab toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Inloggen
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volledige naam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv. Jan de Vries"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mailadres <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uw@email.nl"
                autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mode === 'register' && (
                <p className="text-xs text-gray-400 mt-1">
                  Gebruik het e-mailadres dat u bij uw hypotheekadviseur heeft opgegeven.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimaal 6 tekens' : '••••••••'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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
              {mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
            </button>
          </form>
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
