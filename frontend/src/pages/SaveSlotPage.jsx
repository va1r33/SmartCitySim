import React, { useState, useEffect } from 'react';

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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">

            {/* Brand row */}
            <div className="w-full max-w-lg flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-lg">🏙️</div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">SmartCitySim</div>
                        <div className="text-xs text-gray-400">Welcome back, {user?.username}</div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl px-3 py-1.5 transition-all"
                >
                    Log out
                </button>
            </div>

            {/* Main card */}
            <div className="w-full max-w-lg bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">

                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Your Cities</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Pick up where you left off, or start a new city.</p>
                </div>

                <div className="divide-y divide-gray-50">

                    {/* Loading */}
                    {loading && (
                        <div className="px-6 py-10 text-center text-xs text-gray-300">Loading saves…</div>
                    )}

                    {/* Save slots */}
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

                    {/* Empty */}
                    {!loading && saves.length === 0 && (
                        <div className="px-6 py-10 text-center">
                            <div className="text-3xl mb-3">🏗️</div>
                            <div className="text-sm text-gray-500 font-medium">No saved cities yet</div>
                            <div className="text-xs text-gray-300 mt-1">Start building your first smart city below.</div>
                        </div>
                    )}
                </div>

                {/* New city */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onNew}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">+</span> Start a new city
                    </button>
                </div>
            </div>

            <p className="mt-8 text-xs text-gray-300">
                Up to 5 save slots per account
            </p>
        </div>
    );
}