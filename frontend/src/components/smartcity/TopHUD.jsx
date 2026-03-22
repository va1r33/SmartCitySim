import React from 'react';
import { Wind, Car, Zap, Users, CheckCircle2, Sun, Smile, Droplets } from 'lucide-react';
import { checkMandateAchieved } from './SimulationEngine';

const Chip = ({ icon: Icon, label, value, unit, color, bg }) => (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: bg }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] text-slate-400 hidden lg:block">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}{unit}</span>
    </div>
);

export default function TopHUD({ metrics, currentLevel, isRunning, tickCount }) {
    const achieved = checkMandateAchieved(metrics, currentLevel);
    const scenarioId = currentLevel.scenario;

    return (
        <div className="bg-[#0d1424]/95 border-b border-[#1e293b] px-3 py-2 flex items-center gap-2 shrink-0 backdrop-blur-sm">
            {/* Brand */}
            <div className="flex items-center gap-2 mr-2 shrink-0">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-teal-400 font-bold text-xs tracking-[0.2em] uppercase hidden sm:block">SmartCitySim</span>
                <span className="text-[10px] text-slate-600 hidden md:block">v1.0</span>
            </div>

            <div className="w-px h-5 bg-[#1e293b] shrink-0" />

            {/* Metrics chips */}
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                <Chip icon={Wind} label="CO₂" value={metrics.co2} unit="%" color="#ef4444" bg="rgba(239,68,68,0.08)" />
                <Chip icon={Car} label="Traffic" value={metrics.traffic} unit="%" color="#f59e0b" bg="rgba(245,158,11,0.08)" />
                <Chip icon={Zap} label="Energy" value={metrics.energy} unit="MW" color="#3b82f6" bg="rgba(59,130,246,0.08)" />
                <Chip icon={Users} label="Pop" value={metrics.population} unit="" color="#22c55e" bg="rgba(34,197,94,0.08)" />
                {scenarioId >= 1 && <Chip icon={Sun} label="Renew" value={metrics.renewableShare} unit="%" color="#fbbf24" bg="rgba(251,191,36,0.08)" />}
                {scenarioId >= 2 && <Chip icon={Smile} label="Happy" value={metrics.happiness} unit="%" color="#a78bfa" bg="rgba(167,139,250,0.08)" />}
                {scenarioId >= 3 && <Chip icon={Droplets} label="Flood" value={metrics.floodRisk} unit="%" color="#60a5fa" bg="rgba(96,165,250,0.08)" />}
            </div>

            {/* Level + mandate badge */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] text-slate-500 hidden md:block">
                    S{scenarioId} · {currentLevel.label}
                </span>
                {achieved && (
                    <div className="flex items-center gap-1 bg-teal-500/15 border border-teal-500/30 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        <span className="text-[10px] font-bold text-teal-400 hidden sm:block">Mandate Achieved!</span>
                    </div>
                )}
                <span className="text-[9px] text-slate-600 tabular-nums hidden md:block">Tick {tickCount}</span>
            </div>
        </div>
    );
}