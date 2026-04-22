import React, { useRef, useEffect, useState } from 'react';
import { Wind, Car, Zap, Users, CheckCircle2, Sun, Smile, Droplets, Activity, BookOpen } from 'lucide-react';
import { checkMandateAchieved } from './SimulationEngine';

function AnimatedChip({ icon: Icon, label, value, unit, forecast }) {
    const prevRef = useRef(value);
    const [flash, setFlash] = useState(null);

    useEffect(() => {
        if (prevRef.current === value) return;
        setFlash(value < prevRef.current ? 'down' : 'up');
        prevRef.current = value;
        const t = setTimeout(() => setFlash(null), 900);
        return () => clearTimeout(t);
    }, [value]);

    const borderColor = flash === 'down' ? '#22c55e' : flash === 'up' ? '#ef4444' : undefined;
    const bgColor = flash === 'down' ? 'rgba(34,197,94,0.1)' : flash === 'up' ? 'rgba(239,68,68,0.07)' : undefined;
    const valueColor = flash === 'down' ? '#16a34a' : flash === 'up' ? '#dc2626' : '#1f2937';

    return (
        <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 shrink-0"
            style={{ borderColor, backgroundColor: bgColor, transition: 'background 0.3s, border-color 0.3s' }}
        >
            <Icon className="w-3 h-3 shrink-0 text-gray-400" />
            <div className="flex flex-col leading-none min-w-0">
                <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-medium whitespace-nowrap">
                    {label}
                </span>
                <span
                    className="text-[11px] font-semibold tabular-nums whitespace-nowrap transition-colors duration-300"
                    style={{ color: valueColor }}
                >
                    {value}
                    <span className="text-[9px] font-normal ml-0.5 text-gray-400">{unit}</span>
                </span>
                {forecast != null && (
                    <span className="text-[7.5px] tabular-nums text-gray-400 whitespace-nowrap">
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
    lstmPrediction,
    user,
    saveStatus,
    onSave,
    onBackToSaves,
    onLogout,
}) {
    const achieved = checkMandateAchieved(metrics, currentLevel);
    const scenarioId = currentLevel.scenario;

    return (
        /*
         * KEY FIX: h-14 pins the HUD to exactly 56px tall — it never grows.
         * overflow-hidden ensures nothing bleeds out.
         * The inner div uses overflow-x-auto so chips scroll horizontally
         * instead of wrapping vertically.
         */
        <div className="h-14 shrink-0 bg-white border-b border-gray-100 shadow-sm flex items-center overflow-hidden w-full">

            {/* ── Brand ── */}
            <div className="flex items-center gap-2 pl-4 pr-3 shrink-0">
                <div className="w-7 h-7 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm shrink-0">
                    <Activity className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="hidden sm:flex flex-col leading-none">
                    <span className="text-gray-900 font-bold text-[12px] tracking-tight whitespace-nowrap">
                        SmartCitySim
                    </span>
                    <span className="text-[8px] text-gray-400 uppercase tracking-widest font-medium whitespace-nowrap">
                        Urban Simulator
                    </span>
                </div>
            </div>

            {/* ── Running status ── */}
            <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-semibold uppercase tracking-widest shrink-0 mr-3 ${isRunning
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
            >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
                {isRunning ? 'Live' : 'Paused'}
            </div>

            <div className="w-px h-6 bg-gray-100 shrink-0 mr-3" />

            {/* ── Metric chips — scrollable, never wraps ── */}
            <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
                <AnimatedChip icon={Wind} label="CO₂" value={metrics.co2} unit="%" forecast={forecast?.co2} />
                <AnimatedChip icon={Car} label="Traffic" value={metrics.traffic} unit="%" forecast={forecast?.traffic} />
                <AnimatedChip icon={Zap} label="Energy" value={metrics.energy} unit="MW" forecast={forecast?.energy} />
                <AnimatedChip icon={Users} label="Population" value={metrics.population} unit="" />
                {scenarioId >= 1 && (
                    <AnimatedChip icon={Sun} label="Renewable" value={metrics.renewableShare} unit="%" />
                )}
                {scenarioId >= 2 && (
                    <AnimatedChip icon={Smile} label="Happiness" value={metrics.happiness} unit="%" forecast={forecast?.happiness} />
                )}
                {scenarioId >= 3 && (
                    <AnimatedChip icon={Droplets} label="Flood" value={metrics.floodRisk} unit="%" forecast={forecast?.floodRisk} />
                )}
            </div>

            {/* ── ML badges ── */}
            <div className="flex items-center gap-2 px-3 shrink-0">
                {forecast && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl border border-blue-100 bg-blue-50 text-[8px] font-semibold text-blue-500 uppercase tracking-widest whitespace-nowrap">
                        🤖 ML +5
                    </div>
                )}
                {mlPredictions && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl border border-purple-100 bg-purple-50 text-[8px] font-semibold text-purple-600 uppercase tracking-widest whitespace-nowrap">
                        🤖 CO₂ {mlPredictions.co2}% / T {mlPredictions.traffic}%
                    </div>
                )}
                {lstmPrediction !== null && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl border border-amber-100 bg-amber-50 text-[8px] font-semibold text-amber-700 uppercase tracking-widest whitespace-nowrap">
                        🧠 LSTM {lstmPrediction}%
                    </div>
                )}
            </div>

            {/* ── Manual button ── */}
            <button
                onClick={onOpenManual}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all shrink-0 mr-2"
            >
                <BookOpen className="w-3 h-3" />
                <span className="text-[9px] font-semibold hidden sm:block whitespace-nowrap">Manual</span>
            </button>

            {/* ── User controls ── */}
            {user && (
                <div className="flex items-center gap-1.5 shrink-0 bg-gray-50/80 rounded-xl px-2.5 py-1 border border-gray-100 mr-3">
                    <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                        👤 {user.username}
                    </span>
                    {onSave && (
                        <button
                            onClick={onSave}
                            className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                            {saveStatus === 'saving' ? '💾 Saving…' : saveStatus === 'saved' ? '✓ Saved' : '💾 Save'}
                        </button>
                    )}
                    {onBackToSaves && (
                        <button
                            onClick={onBackToSaves}
                            className="text-[10px] text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded-lg whitespace-nowrap"
                        >
                            🗂 Saves
                        </button>
                    )}
                    <button
                        onClick={onLogout}
                        className="text-[10px] text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded-lg whitespace-nowrap"
                    >
                        🚪 Logout
                    </button>
                </div>
            )}

            {/* ── Scenario / tick ── */}
            <div className="flex items-center gap-2 shrink-0 pr-4">
                <div className="hidden md:flex flex-col items-end leading-none">
                    <span className="text-[10px] font-semibold text-gray-800 whitespace-nowrap">
                        {currentLevel.label}
                    </span>
                    <span className="text-[8px] text-gray-400 font-medium whitespace-nowrap">
                        Scenario {scenarioId} · Tick {tickCount}
                    </span>
                </div>
                {achieved && (
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-2xl shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-semibold text-emerald-600 hidden sm:block whitespace-nowrap">
                            Mandate Achieved
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}