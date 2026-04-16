import React, { useRef, useEffect, useState } from 'react';
import { Wind, Car, Zap, Users, CheckCircle2, Sun, Smile, Droplets, Activity, BookOpen } from 'lucide-react';
import { checkMandateAchieved } from './SimulationEngine';

// ── ANIMATED METRIC CHIP ─────────────────────────────────────────────────────
function AnimatedChip({ icon: Icon, label, value, unit, forecast }) {
    const prevRef = useRef(value);
    const [flash, setFlash] = useState(null); // 'up' | 'down' | null

    useEffect(() => {
        if (prevRef.current === value) return;
        setFlash(value < prevRef.current ? 'down' : 'up');
        prevRef.current = value;
        const t = setTimeout(() => setFlash(null), 900);
        return () => clearTimeout(t);
    }, [value]);

    const flashStyle = flash === 'down'
        ? { background: 'rgba(34,197,94,0.12)', borderColor: '#22c55e' }
        : flash === 'up'
            ? { background: 'rgba(239,68,68,0.08)', borderColor: '#ef4444' }
            : {};

    const valueColor = flash === 'down'
        ? '#16a34a'
        : flash === 'up'
            ? '#dc2626'
            : '#1f2937';

    return (
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300"
            style={{ ...flashStyle, transition: 'background 0.3s, border-color 0.3s' }}
        >
            <Icon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <div className="flex flex-col leading-none">
                <span className="text-[8.5px] text-gray-400 uppercase tracking-widest hidden lg:block font-medium">{label}</span>
                <span
                    className="text-[13px] font-semibold tabular-nums transition-colors duration-300"
                    style={{ color: valueColor }}
                >
                    {value}<span className="text-[10px] font-normal ml-0.5 text-gray-400">{unit}</span>
                </span>
                {forecast !== undefined && forecast !== null && (
                    <span className="text-[8.5px] tabular-nums mt-0.5" style={{ color: '#6b7280' }}>
                        ↗ {forecast}{unit}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function TopHUD({
    metrics,
    currentLevel,
    isRunning,
    tickCount,
    onOpenManual,
    forecast,
    mlPredictions,
    user,
    saveStatus,
    onSave,
    onBackToSaves,
    onLogout,
}) {
    const achieved = checkMandateAchieved(metrics, currentLevel);
    const scenarioId = currentLevel.scenario;

    return (
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 shrink-0 shadow-sm">
            {/* Brand */}
            <div className="flex items-center gap-3 mr-1 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-gray-900 flex items-center justify-center shadow-sm">
                        <Activity className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:flex flex-col leading-none">
                        <span className="text-gray-900 font-bold text-[13px] tracking-tight">SmartCitySim</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">Urban Simulator</span>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-semibold uppercase tracking-widest ${isRunning
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
                    {isRunning ? 'Live' : 'Paused'}
                </div>
            </div>

            <div className="w-px h-8 bg-gray-100 shrink-0" />

            {/* Metric chips — animated on change */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
                <AnimatedChip icon={Wind} label="CO₂" value={metrics.co2} unit="%" forecast={forecast?.co2} />
                <AnimatedChip icon={Car} label="Traffic" value={metrics.traffic} unit="%" forecast={forecast?.traffic} />
                <AnimatedChip icon={Zap} label="Energy" value={metrics.energy} unit="MW" forecast={forecast?.energy} />
                <AnimatedChip icon={Users} label="Population" value={metrics.population} unit="" />
                {scenarioId >= 1 && <AnimatedChip icon={Sun} label="Renewable" value={metrics.renewableShare} unit="%" />}
                {scenarioId >= 2 && <AnimatedChip icon={Smile} label="Happiness" value={metrics.happiness} unit="%" forecast={forecast?.happiness} />}
                {scenarioId >= 3 && <AnimatedChip icon={Droplets} label="Flood Risk" value={metrics.floodRisk} unit="%" forecast={forecast?.floodRisk} />}
            </div>

            {/* ML badge — shown when forecast is available (client-side) */}
            {forecast && (
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-100 bg-blue-50 text-[9px] font-semibold text-blue-500 uppercase tracking-widest shrink-0">
                    🤖 ML +5 turns
                </div>
            )}

            {/* NEW: ML predictions from backend (Random Forest) */}
            {mlPredictions && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-purple-100 bg-purple-50 text-[9px] font-semibold text-purple-600 uppercase tracking-widest shrink-0">
                    🤖 ML Next: CO₂ {mlPredictions.co2}% / Traffic {mlPredictions.traffic}%
                </div>
            )}

            {/* Manual button */}
            <button
                onClick={onOpenManual}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all shrink-0"
                title="User Manual"
            >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold hidden sm:block">Manual</span>
            </button>

            {/* User & Save Controls (only shown when logged in) */}
            {user && (
                <div className="flex items-center gap-2 shrink-0 bg-gray-50/80 rounded-xl px-3 py-1.5 border border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">👤 {user.username}</span>
                    {onSave && (
                        <button
                            onClick={onSave}
                            className="text-xs bg-gray-200 hover:bg-gray-300 px-2.5 py-1 rounded-lg transition-colors"
                        >
                            {saveStatus === 'saving' ? '💾 Saving...' : saveStatus === 'saved' ? '✓ Saved' : '💾 Save'}
                        </button>
                    )}
                    <button
                        onClick={onBackToSaves}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg"
                    >
                        📂 Saves
                    </button>
                    <button
                        onClick={onLogout}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg"
                    >
                        🚪 Logout
                    </button>
                </div>
            )}

            {/* Level & Tick Info */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="hidden md:flex flex-col items-end leading-none">
                    <span className="text-[11px] font-semibold text-gray-800">{currentLevel.label}</span>
                    <span className="text-[9px] text-gray-400 font-medium">Scenario {scenarioId} · Tick {tickCount}</span>
                </div>
                {achieved && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-semibold text-emerald-600 hidden sm:block">Mandate Achieved</span>
                    </div>
                )}
            </div>
        </div>
    );
}