import React from 'react';
import { Wind, Car, Zap, Users, CheckCircle2, Sun, Smile, Droplets, Activity } from 'lucide-react';
import { checkMandateAchieved } from './SimulationEngine';

const Chip = ({ icon: Icon, label, value, unit }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <Icon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
        <div className="flex flex-col leading-none">
            <span className="text-[8.5px] text-gray-400 uppercase tracking-widest hidden lg:block font-medium">{label}</span>
            <span className="text-[13px] font-semibold tabular-nums text-gray-800">{value}<span className="text-[10px] font-normal ml-0.5 text-gray-400">{unit}</span></span>
        </div>
    </div>
);

export default function TopHUD({ metrics, currentLevel, isRunning, tickCount }) {
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
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-semibold uppercase tracking-widest ${isRunning ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
                    {isRunning ? 'Live' : 'Paused'}
                </div>
            </div>

            <div className="w-px h-8 bg-gray-100 shrink-0" />

            {/* Metrics chips */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
                <Chip icon={Wind} label="CO₂" value={metrics.co2} unit="%" />
                <Chip icon={Car} label="Traffic" value={metrics.traffic} unit="%" />
                <Chip icon={Zap} label="Energy" value={metrics.energy} unit="MW" />
                <Chip icon={Users} label="Population" value={metrics.population} unit="" />
                {scenarioId >= 1 && <Chip icon={Sun} label="Renewable" value={metrics.renewableShare} unit="%" />}
                {scenarioId >= 2 && <Chip icon={Smile} label="Happiness" value={metrics.happiness} unit="%" />}
                {scenarioId >= 3 && <Chip icon={Droplets} label="Flood Risk" value={metrics.floodRisk} unit="%" />}
            </div>

            {/* Level + mandate badge */}
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