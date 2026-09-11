import { useState } from 'react';
import { LockKeyhole, LogIn, UtensilsCrossed } from 'lucide-react';
import api from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/cashier/login', {
        username: username.trim(),
        password,
      });

      onLogin({
        accessToken: data.access_token,
        cashier: data.cashier,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 sm:px-6 flex items-center justify-center">
      <section className="w-full max-w-md bg-white border border-neutral-200 rounded-lg shadow-md overflow-hidden">
        <div className="bg-neutral-900 text-white px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={22} />
            <h1 className="text-xl font-semibold">Cashier Login</h1>
          </div>
          <p className="text-sm text-neutral-300 mt-1">Login to access KOT</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-neutral-600 mb-1">
              Username
            </label>
            <input
              id="username"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-neutral-600 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              <LockKeyhole size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md py-2.5 font-medium text-sm hover:bg-neutral-800"
          >
            <LogIn size={16} />
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}
