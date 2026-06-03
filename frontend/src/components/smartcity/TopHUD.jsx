import React, { useRef, useEffect, useState } from 'react';
import {
    Wind, Car, Zap, Users, CheckCircle2, Sun, Smile, Droplets,
    Activity, BookOpen, TrendingUp, Cpu,
} from 'lucide-react';
import { checkMandateAchieved } from './SimulationEngine';

// ── ANIMATED METRIC CHIP (neutral colours, no green/red flashes) ─────────────
function AnimatedChip({ icon: Icon, label, value, unit, forecast }) {
    const prevRef = useRef(value);
    const [changed, setChanged] = useState(false);

    useEffect(() => {
        if (prevRef.current !== value) {
            setChanged(true);
            prevRef.current = value;
            const t = setTimeout(() => setChanged(false), 300);
            return () => clearTimeout(t);
        }
    }, [value]);

    // Only a subtle weight change – no coloured borders or backgrounds
    const valueWeight = changed ? 'font-black' : 'font-semibold';

    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-gray-200/80 bg-white shadow-sm shrink-0 transition-all duration-300">
            <Icon className="w-3 h-3 shrink-0 text-gray-400" />
            <div className="flex flex-col leading-none min-w-0">
                <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-medium whitespace-nowrap">
                    {label}
                </span>
                <span className={`text-[11px] ${valueWeight} tabular-nums text-gray-800 whitespace-nowrap transition-colors duration-300`}>
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

// ── TOP HUD ───────────────────────────────────────────────────────────────────
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
        <div className="h-14 shrink-0 bg-white border-b border-gray-100 shadow-sm flex items-center overflow-hidden w-full">

            {/* Brand */}
            <div className="flex items-center gap-2 pl-4 pr-2 shrink-0">
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

            {/* Running status – neutral gray */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-semibold uppercase tracking-widest shrink-0 mr-2
                ${isRunning
                    ? 'border-gray-300 bg-gray-50 text-gray-600'
                    : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRunning ? 'bg-gray-500 animate-pulse' : 'bg-gray-300'}`} />
                {isRunning ? 'Live' : 'Paused'}
            </div>

            <div className="w-px h-6 bg-gray-100 shrink-0 mr-2" />

            {/* Metric chips (scrollable) */}
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.chips-scroll::-webkit-scrollbar { display: none; }`}</style>
                <AnimatedChip icon={Wind} label="CO₂" value={metrics.co2} unit="%" forecast={forecast?.co2} />
                <AnimatedChip icon={Car} label="Traffic" value={metrics.traffic} unit="%" forecast={forecast?.traffic} />
                <AnimatedChip icon={Zap} label="Energy" value={metrics.energy} unit="MW" forecast={forecast?.energy} />
                <AnimatedChip icon={Users} label="Population" value={metrics.population} unit="" />
                {scenarioId >= 1 && <AnimatedChip icon={Sun} label="Renewable" value={metrics.renewableShare} unit="%" />}
                {scenarioId >= 2 && <AnimatedChip icon={Smile} label="Happiness" value={metrics.happiness} unit="%" forecast={forecast?.happiness} />}
                {scenarioId >= 3 && <AnimatedChip icon={Droplets} label="Flood" value={metrics.floodRisk} unit="%" forecast={forecast?.floodRisk} />}
                <div className="shrink-0 w-2" />
            </div>

            {/* ML badges – all neutral gray */}
            <div className="flex items-center gap-1.5 px-2 shrink-0">
                {forecast && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 shadow-sm shrink-0">
                        <TrendingUp className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="text-[8px] font-mono font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                            Trend +5
                        </span>
                    </div>
                )}

                {mlPredictions && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 shadow-sm shrink-0">
                        <Cpu className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="text-[8px] font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                            RF
                        </span>
                        <span className="text-[8px] font-medium text-gray-500 whitespace-nowrap">
                            CO₂ {mlPredictions.co2}% / T {mlPredictions.traffic}%
                        </span>
                    </div>
                )}

                {lstmPrediction !== null && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200 shadow-sm shrink-0">
                        <span className="text-[8px] font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                            LSTM
                        </span>
                        <span className="text-gray-400 font-mono text-[10px] shrink-0">→</span>
                        <span className="text-[11px] font-bold text-gray-800 tabular-nums whitespace-nowrap">
                            {lstmPrediction}%
                        </span>
                    </div>
                )}
            </div>

            {/* Manual button */}
            <button
                onClick={onOpenManual}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all shrink-0 mr-2"
                title="User Manual"
            >
                <BookOpen className="w-3 h-3 shrink-0" />
                <span className="text-[9px] font-semibold hidden sm:block whitespace-nowrap">Manual</span>
            </button>

            {/* User controls – neutral gray, no red logout */}
            {user && (
                <div className="flex items-center gap-1.5 shrink-0 bg-gray-50/80 rounded-xl px-2.5 py-1 border border-gray-100 mr-2">
                    <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                        👤 {user.username}
                    </span>
                    {onSave && (
                        <button
                            onClick={onSave}
                            className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                            {saveStatus === 'saving'
                                ? '💾 Saving…'
                                : saveStatus === 'saved'
                                    ? '✓ Saved'
                                    : '💾 Save'}
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
                        className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded-lg whitespace-nowrap"
                    >
                        🚪 Logout
                    </button>
                </div>
            )}

            {/* Scenario / tick */}
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
                    <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 px-2 py-1 rounded-2xl shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="text-[9px] font-semibold text-gray-700 hidden sm:block whitespace-nowrap">
                            Mandate Achieved
                        </span>
                    </div>
                )}
            </div>

        </div>
    );
}