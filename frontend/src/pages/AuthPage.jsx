import React, { useState } from 'react';
import { Activity } from 'lucide-react';   // <-- import the same icon used in TopHUD

export default function AuthPage({ onAuth }) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API = 'http://localhost:5001';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
            const body = mode === 'login'
                ? { username: form.username, password: form.password }
                : { username: form.username, email: form.email, password: form.password };

            const res = await fetch(`${API}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');
            localStorage.setItem('scs_token', data.token);
            localStorage.setItem('scs_user', JSON.stringify(data.user));
            onAuth(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">

            {/* Brand */}
            <div className="mb-10 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shadow-sm">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-gray-900 font-bold text-xl tracking-tight">SmartCitySim</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Urban Simulator</span>
                    </div>
                </div>
                <p className="text-sm text-gray-400 italic mt-1">AI-Powered Sustainable City Simulation</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                {/* Tab switcher */}
                <div className="flex border-b border-gray-100">
                    {['login', 'signup'].map(m => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(''); }}
                            className={`flex-1 py-3.5 text-sm font-semibold transition-all ${mode === m
                                ? 'text-gray-900 border-b-2 border-gray-900'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {m === 'login' ? 'Log in' : 'Sign up'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                            Username
                        </label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                            placeholder="your_city_name"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                        />
                    </div>

                    {/* Email – signup only */}
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="you@example.com"
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                            />
                        </div>
                    )}

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium">
                            ⚠ {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                    >
                        {loading ? '...' : mode === 'login' ? 'Log in →' : 'Create account →'}
                    </button>

                    {/* Guest */}
                    <button
                        type="button"
                        onClick={() => onAuth(null, null)}
                        className="w-full py-2.5 text-xs text-gray-200 hover:text-gray-400 transition-colors"
                    >
                        Continue as guest (progress won't be saved)
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="mt-8 text-xs text-gray-300 italic">
                Urban Planning · AI/ML simulation · IoT gamification
            </p>
        </div>
    );
}