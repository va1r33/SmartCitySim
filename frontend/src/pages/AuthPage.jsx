import React, { useState } from 'react';
import { Activity, Eye, EyeOff } from 'lucide-react';
import cityBg from '../assets/smartcity_app_background.png';

export default function AuthPage({ onAuth }) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        <div className="min-h-screen flex">

            {/* LEFT PANEL */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-50">
                <img
                    src={cityBg}
                    alt="Seoul city streetscape illustration"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    style={{ opacity: 0.18 }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, #F9FAFB 100%)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #F9FAFB 0%, transparent 20%, transparent 75%, #F9FAFB 100%)' }} />
                <div className="relative z-10 flex flex-col justify-end px-14 pb-16 w-full">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" style={{ letterSpacing: '0.14em' }}>
                        SmartCitySim
                    </p>
                    <h2 className="text-3xl font-bold text-gray-900 leading-snug mb-3">
                        Build the city.<br />
                        <span className="text-gray-400 font-normal italic">Shape the future.</span>
                    </h2>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                        Place zones, roads and green infrastructure
                        on a live grid — then watch AI predict how
                        your decisions ripple across traffic, CO₂,
                        energy and happiness.
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL – form with password toggle */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 bg-white relative">
                {/* Mobile image strip */}
                <div className="lg:hidden absolute top-0 left-0 right-0 h-40 overflow-hidden" aria-hidden="true">
                    <img src={cityBg} alt="" className="w-full h-full object-cover object-top" style={{ opacity: 0.1 }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, white 100%)' }} />
                </div>

                {/* Brand */}
                <div className="mb-8 text-center relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center shadow-sm">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-gray-900 font-bold text-lg tracking-tight leading-tight">SmartCitySim</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">Urban Simulator</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">AI-Powered Sustainable City Simulation</p>
                </div>

                {/* Card */}
                <div className="w-full max-w-sm bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden relative z-10">
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
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Username</label>
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
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
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

                        {/* Password with show/hide toggle */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
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
                            {loading ? '…' : mode === 'login' ? 'Log in →' : 'Create account →'}
                        </button>

                        {/* Guest */}
                        <button
                            type="button"
                            onClick={() => onAuth(null, null)}
                            className="w-full py-2.5 text-xs text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            Continue as guest (progress won't be saved)
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-xs text-gray-300 italic relative z-10">
                    Urban Planning · AI/ML simulation · IoT gamification
                </p>
            </div>
        </div>
    );
}