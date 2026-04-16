import React, { useState } from 'react';
import { X, Home, Building2, Factory, TreePine, Sun, Bus, Route, Info, ChevronRight, ChevronLeft } from 'lucide-react';

const PAGES = [
    {
        title: 'Welcome to SmartCitySim',
        icon: '🏙️',
        content: (
            <div className="space-y-3">
                <p className="text-gray-600 text-sm leading-relaxed">
                    SmartCitySim is an urban planning simulator inspired by real-world city design principles.
                    Build a thriving smart city by placing zones, roads, and green infrastructure while meeting
                    environmental mandates.
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-blue-700 text-xs font-semibold mb-1">🎯 Your Goal</p>
                    <p className="text-blue-600 text-xs leading-relaxed">
                        Meet each scenario's mandate targets by balancing residential areas, commercial districts,
                        industry, parks, solar energy, and public transit — all while respecting urban planning rules.
                    </p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-amber-700 text-xs font-semibold mb-1">🌐 AR/VR Design Philosophy</p>
                    <p className="text-amber-600 text-xs leading-relaxed">
                        This simulator follows real urban planning codes: zoning separation, green buffer requirements,
                        and minimum spacing rules — the same principles used in real smart city master plans.
                    </p>
                </div>
            </div>
        ),
    },
    {
        title: 'Zoning Rules',
        icon: '📐',
        content: (
            <div className="space-y-3">
                <p className="text-gray-500 text-xs mb-2">Real urban planning separates incompatible land uses. These rules are enforced:</p>
                <div className="space-y-2">
                    {[
                        { icon: '🏠', color: 'blue', label: 'Residential (RES)', rule: 'Cannot be placed directly adjacent to Industrial zones. Requires a 1-tile buffer (road or park).' },
                        { icon: '🏢', color: 'amber', label: 'Commercial (COM)', rule: 'Cannot be placed directly adjacent to Industrial zones. Best placed near roads for access.' },
                        { icon: '🏭', color: 'red', label: 'Industrial (IND)', rule: 'Must be separated from Residential and Commercial zones by at least 1 tile.' },
                        { icon: '🌳', color: 'green', label: 'Park (PARK)', rule: 'No restrictions — parks act as green buffers and can be placed anywhere to separate zones.' },
                        { icon: '☀️', color: 'yellow', label: 'Solar (SOLAR)', rule: 'Cannot be placed directly adjacent to other Solar panels (spacing for maintenance access).' },
                        { icon: '🚌', color: 'purple', label: 'Bus Stop (TRANSIT)', rule: 'Must be placed adjacent to at least one road tile to be accessible.' },
                    ].map(({ icon, color, label, rule }) => (
                        <div key={label} className={`flex gap-2.5 p-2.5 rounded-xl bg-${color}-50 border border-${color}-100`}>
                            <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                            <div>
                                <p className={`text-[11px] font-bold text-${color}-700 mb-0.5`}>{label}</p>
                                <p className={`text-[10px] text-${color}-600 leading-relaxed`}>{rule}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        title: 'How to Build',
        icon: '🛠️',
        content: (
            <div className="space-y-3">
                <div className="space-y-2">
                    {[
                        { step: '1', title: 'Select a Tool', desc: 'Click any tool in the left toolbar. Each tool represents a zone type or road.' },
                        { step: '2', title: 'Click or Drag on the Grid', desc: 'Click a tile to place your selected zone. Hold and drag to paint multiple tiles at once.' },
                        { step: '3', title: 'Respect Zoning Rules', desc: 'If a placement violates urban planning rules, the tile will flash red and the placement will be rejected.' },
                        { step: '4', title: 'Build Roads First', desc: 'Roads connect your city. Bus stops need adjacent roads. Industrial zones should be road-accessible.' },
                        { step: '5', title: 'Run the Simulation', desc: 'Press Run in the bottom bar. Cars will appear on roads and metrics will update in real time.' },
                        { step: '6', title: 'Activate IoT Systems', desc: 'Use the right panel to toggle smart systems like Eco Mode and Smart Traffic for metric bonuses.' },
                    ].map(({ step, title, desc }) => (
                        <div key={step} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                            <div>
                                <p className="text-[12px] font-semibold text-gray-800">{title}</p>
                                <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        title: 'Scenarios & Metrics',
        icon: '📊',
        content: (
            <div className="space-y-3">
                <div className="space-y-2">
                    {[
                        { id: 'S1', emoji: '🌿', title: 'The Green Mandate', desc: 'Reduce CO₂ ≤60%, Traffic ≤40%, Energy ≤100MW. Add Solar and activate Eco Mode.' },
                        { id: 'S2', emoji: '🚌', title: 'The Commuter Crisis', desc: 'Traffic ≤30%, Happiness ≥70%, Population ≥500. Place Bus Stops near residential zones.' },
                        { id: 'S3', emoji: '🌊', title: 'The Resilient City', desc: 'Flood Risk ≤40%, Happiness ≥75%, Damage ≤$20M. Parks absorb water runoff.' },
                        { id: 'S4', emoji: '🌐', title: 'Predictive Metropolis', desc: 'All metrics at elite levels. Enable Predictive Optimization and balance everything.' },
                    ].map(({ id, emoji, title, desc }) => (
                        <div key={id} className="flex gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                            <span className="text-xl shrink-0">{emoji}</span>
                            <div>
                                <p className="text-[11px] font-bold text-gray-800">{id}: {title}</p>
                                <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-2">
                    <p className="text-emerald-700 text-xs font-semibold mb-1">💡 Pro Tip</p>
                    <p className="text-emerald-600 text-xs leading-relaxed">
                        Use Parks as buffers between Industrial and Residential zones — they reduce CO₂, boost Happiness,
                        and lower Flood Risk simultaneously!
                    </p>
                </div>
            </div>
        ),
    },
];

export default function UserManual({ onClose }) {
    const [page, setPage] = useState(0);
    const current = PAGES[page];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl w-[480px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{current.icon}</span>
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">User Manual · {page + 1}/{PAGES.length}</p>
                            <h2 className="text-base font-bold text-gray-900">{current.title}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Page dots */}
                <div className="flex items-center justify-center gap-1.5 pt-3">
                    {PAGES.map((_, i) => (
                        <button key={i} onClick={() => setPage(i)}
                            className={`h-1.5 rounded-full transition-all ${i === page ? 'w-6 bg-gray-900' : 'w-1.5 bg-gray-200 hover:bg-gray-400'}`} />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {current.content}
                </div>

                {/* Footer nav */}
                <div className="flex items-center justify-between px-6 pb-5 pt-3 border-t border-gray-100">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    {page < PAGES.length - 1 ? (
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-all"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all"
                        >
                            Start Building ✓
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}