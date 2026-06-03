import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

// ── Helper to generate progressive gray backgrounds ──────────────────────────
const bgProgression = (index, total) => {
    // maps index to bg-gray-50, bg-gray-100, bg-gray-200, ... up to bg-gray-500
    const levels = ['bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500'];
    return levels[index % levels.length];
};

const PAGES = [
    {
        title: 'Welcome to SmartCitySim',
        content: (
            <div className="space-y-3">
                <p className="text-gray-600 text-sm leading-relaxed">
                    SmartCitySim is an urban planning simulator inspired by real-world city design principles.
                    Build a thriving smart city by placing zones, roads, and green infrastructure while meeting
                    environmental mandates.
                </p>
                {/* Your Goal – lighter gray */}
                <div className="bg-gray-50 border-l-2 border-gray-300 rounded-xl p-3">
                    <p className="text-gray-800 text-xs font-bold mb-1">Your Goal</p>
                    <p className="text-gray-600 text-xs leading-relaxed">
                        Meet each scenario's mandate targets by balancing residential areas, commercial districts,
                        industry, parks, solar energy, and public transit — all while respecting urban planning rules.
                    </p>
                </div>
                {/* Urban Planning Philosophy – darker gray (progression) */}
                <div className="bg-gray-100 border-l-2 border-gray-300 rounded-xl p-3">
                    <p className="text-gray-800 text-xs font-bold mb-1">Urban Planning Philosophy</p>
                    <p className="text-gray-600 text-xs leading-relaxed">
                        This simulator follows real urban planning codes: zoning separation, green buffer requirements,
                        and minimum spacing rules — the same principles used in real smart city master plans.
                    </p>
                </div>
            </div>
        ),
    },
    {
        title: 'Zoning Rules',
        content: (
            <div className="space-y-3">
                <p className="text-gray-500 text-xs mb-2">Real urban planning separates incompatible land uses. These rules are enforced:</p>
                <div className="space-y-2">
                    {[
                        { icon: '🏠', label: 'Residential (RES)', rule: 'Cannot be placed directly adjacent to Industrial zones. Requires a 1-tile buffer (road or park).' },
                        { icon: '🏢', label: 'Commercial (COM)', rule: 'Cannot be placed directly adjacent to Industrial zones. Best placed near roads for access.' },
                        { icon: '🏭', label: 'Industrial (IND)', rule: 'Must be separated from Residential and Commercial zones by at least 1 tile.' },
                        { icon: '🌳', label: 'Park (PARK)', rule: 'No restrictions — parks act as green buffers and can be placed anywhere to separate zones.' },
                        { icon: '☀️', label: 'Solar (SOLAR)', rule: 'Cannot be placed directly adjacent to other Solar panels (spacing for maintenance access).' },
                        { icon: '🚌', label: 'Bus Stop (TRANSIT)', rule: 'Must be placed adjacent to at least one road tile to be accessible.' },
                    ].map(({ icon, label, rule }, idx) => (
                        <div key={label} className={`flex gap-2.5 p-2.5 rounded-xl border border-gray-100 ${bgProgression(idx, 6)}`}>
                            <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                            <div>
                                <p className="text-[11px] font-bold text-gray-800 mb-0.5">{label}</p>
                                <p className="text-[10px] text-gray-600 leading-relaxed">{rule}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        title: 'How to Build',
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
        content: (
            <div className="space-y-3">
                <div className="space-y-2">
                    {[
                        { id: 'S1', emoji: '🌿', title: 'The Green Mandate', desc: 'Reduce CO₂ ≤60%, Traffic ≤40%, Energy ≤100MW. Add Solar and activate Eco Mode.' },
                        { id: 'S2', emoji: '🚌', title: 'The Commuter Crisis', desc: 'Traffic ≤30%, Happiness ≥70%, Population ≥500. Place Bus Stops near residential zones.' },
                        { id: 'S3', emoji: '🌊', title: 'The Resilient City', desc: 'Flood Risk ≤40%, Happiness ≥75%, Damage ≤$20M. Parks absorb water runoff.' },
                        { id: 'S4', emoji: '🌐', title: 'Predictive Metropolis', desc: 'All metrics at elite levels. Enable Predictive Optimization and balance everything.' },
                    ].map(({ id, emoji, title, desc }, idx) => (
                        <div key={id} className={`flex gap-3 p-2.5 rounded-xl border border-gray-100 ${bgProgression(idx, 4)}`}>
                            <span className="text-xl shrink-0">{emoji}</span>
                            <div>
                                <p className="text-[11px] font-bold text-gray-800">{id}: {title}</p>
                                <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Pro Tip – muted yellow (same as RightPanel's hint ticker) */}
                <div className="bg-amber-50 border-l-2 border-amber-300 rounded-xl p-3 mt-2">
                    <p className="text-amber-800 text-xs font-bold mb-1">💡 Pro Tip</p>
                    <p className="text-amber-700 text-xs leading-relaxed">
                        Use Parks as buffers between Industrial and Residential zones — they reduce CO₂, boost Happiness,
                        and lower Flood Risk simultaneously!
                    </p>
                </div>
            </div>
        ),
    },
    {
        title: 'Korean Zoning Laws (Research Basis)',
        content: (
            <div className="space-y-3">
                <p className="text-gray-800 text-sm font-bold mb-2">Real‑world legal framework</p>
                <p className="text-gray-500 text-xs mb-3">
                    SmartCitySim enforces five zoning rules derived from actual Korean urban planning legislation.
                </p>
                <div className="space-y-2">
                    {[
                        { title: '1. Industrial–Residential Buffer', citation: '(NLPUA Art.76)', desc: 'Hard block: no direct adjacency. Buffer required (road or park).' },
                        { title: '2. Minimum Green Space', citation: '(Seoul Ordinance)', desc: 'Soft warning: parks must be ≥5% of residential tile count.' },
                        { title: '3. Road Access for Commercial', citation: '(Building Act Art.44)', desc: 'Hard block: every commercial tile must be adjacent to a road.' },
                        { title: '4. Solar Glare Separation', citation: '(Seoul Solar Guidelines)', desc: 'Hard block: solar farms cannot be placed next to residential zones.' },
                        { title: '5. Floor Area Ratio (FAR)', citation: '(NLPUA Art.78)', desc: 'Soft warnings: residential &gt;40%, commercial &gt;25%, industrial &gt;20% of total grid.' },
                    ].map((item, idx) => (
                        <div key={item.title} className={`border-l-2 border-gray-300 rounded-xl p-2.5 ${bgProgression(idx, 5)}`}>
                            <p className="text-[11px] font-bold text-gray-800">{item.title} <span className="text-[9px] font-normal">{item.citation}</span></p>
                            <p className="text-[10px] text-gray-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-2 mt-1 text-center">
                    <p className="text-[9px] text-gray-500">Sources: law.go.kr · seoul.go.kr · KLRI</p>
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
                    <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">User Manual · {page + 1}/{PAGES.length}</p>
                        <h2 className="text-base font-bold text-gray-900">{current.title}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
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
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    {page < PAGES.length - 1 ? (
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700"
                        >
                            Start Building ✓
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}