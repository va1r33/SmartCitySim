import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import slotBg from '../assets/saveslot_background.png';

const API = 'http://localhost:5001';

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const LEVEL_LABELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };
const SCENARIO_EMOJIS = { 1: '🌿', 2: '🚌', 3: '🌊', 4: '🌐' };

export default function SaveSlotPage({ user, token, onLoad, onNew, onLogout }) {
    const [saves, setSaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetch(`${API}/saves`, { headers })
            .then(r => r.json())
            .then(data => { setSaves(data.saves || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        setDeleting(id);
        await fetch(`${API}/saves/${id}`, { method: 'DELETE', headers });
        setSaves(s => s.filter(x => x.id !== id));
        setDeleting(null);
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* ── LEFT PANEL – Save slots ───────────────────────────── */}
            <div className="flex-1 bg-white flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20">
                <div className="max-w-2xl w-full mx-auto lg:mx-0">

                    {/* Brand + logout row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center shadow-sm">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-gray-900 font-bold text-lg tracking-tight">SmartCitySim</div>
                                <div className="text-[9px] text-gray-400 uppercase tracking-widest">Urban Simulator</div>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl px-3 py-1.5 transition-all"
                        >
                            Log out
                        </button>
                    </div>

                    {/* Welcome */}
                    <p className="text-sm text-gray-500 mb-8">Welcome back, <span className="font-semibold text-gray-800">{user?.username}</span></p>

                    {/* Card */}
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Your Cities</h2>
                            <p className="text-sm text-gray-400 mt-1">Pick up where you left off, or start a new city.</p>
                        </div>

                        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                            {loading && (
                                <div className="px-6 py-12 text-center text-sm text-gray-300">Loading saves…</div>
                            )}
                            {!loading && saves.map(save => (
                                <div key={save.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/70 transition-colors group">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                                        {SCENARIO_EMOJIS[save.current_level] || '🏙️'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                            {save.name || `City #${save.id}`}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {LEVEL_LABELS[save.current_level] || 'Beginner'} · Tick {save.tick_count}
                                            &nbsp;·&nbsp; Score {save.city_score ?? '—'}
                                        </div>
                                        <div className="text-[10px] text-gray-300 mt-0.5">{formatDate(save.updated_at)}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => onLoad(save)}
                                            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-all"
                                        >
                                            Continue
                                        </button>
                                        <button
                                            onClick={() => handleDelete(save.id)}
                                            disabled={deleting === save.id}
                                            className="px-2.5 py-1.5 border border-gray-200 text-gray-400 text-xs rounded-xl hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-40"
                                        >
                                            {deleting === save.id ? '…' : '✕'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {!loading && saves.length === 0 && (
                                <div className="px-6 py-12 text-center">
                                    <div className="text-4xl mb-3">🏗️</div>
                                    <div className="text-base font-medium text-gray-600">No saved cities yet</div>
                                    <div className="text-sm text-gray-400 mt-1">Start building your first smart city below.</div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={onNew}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-sm font-semibold text-gray-600 hover:border-gray-500 hover:text-gray-800 hover:bg-white transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">+</span> Start a new city
                            </button>
                        </div>
                    </div>

                    <p className="mt-6 text-xs text-gray-300 text-center lg:text-left">
                        Up to 5 save slots per account
                    </p>
                </div>
            </div>

            {/* ── RIGHT PANEL – Illustration with slightly larger background image ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-50">
                <img
                    src={slotBg}
                    alt="City skyline illustration"
                    className="absolute inset-0 w-full h-full object-contain object-center"
                    style={{ opacity: 0.7 }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #F9FAFB 0%, transparent 30%, transparent 70%, #F9FAFB 100%)' }} />

                <div className="relative z-10 flex flex-col justify-end items-end text-right p-12 pb-16 w-full">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-sm border border-gray-100 max-w-sm">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Continue your journey</p>
                        <h2 className="text-xl font-bold text-gray-700 leading-tight">Your saved cities await</h2>
                        <p className="text-sm text-gray-500 mt-2">Load any city and keep shaping its future with smart policies and AI predictions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}