import React, { useState, useEffect } from 'react';
import {
    Wind, Car, Zap, Users, Leaf, Radio, Megaphone,
    BrainCircuit, Lock, Sun, Bus, Siren, Smile, Droplets,
    CheckCircle2, XCircle, TrendingUp,
} from 'lucide-react';
import {
    IOT_SYSTEMS, getMandateProgress, checkMandateAchieved,
    countTiles, calcCityScore, getContextHints,
} from './SimulationEngine';

// ── METRIC ROW with progress bar ─────────────────────────────────────────────
function MetricRow({ icon: Icon, label, value, unit, pct }) {
    return (
        <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">{label}</span>
                </div>
                <span className="text-[12px] font-semibold tabular-nums text-gray-800">
                    {value}<span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span>
                </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 bg-gray-700"
                    style={{ width: `${Math.min(100, pct)}%` }}
                />
            </div>
        </div>
    );
}

// ── GOAL ITEM with micro progress bar ────────────────────────────────────────
function GoalItem({ item }) {
    const pct = item.reverse
        ? Math.min(100, (item.value / Math.max(1, item.target)) * 100)
        : Math.min(100, (item.value / Math.max(1, item.target)) * 100);
    const barColor = item.ok ? '#16a34a' : item.reverse
        ? '#f59e0b'
        : pct > 90 ? '#ef4444' : '#f59e0b';
    return (
        <div className={`px-2 py-2 rounded-xl border mb-1.5 ${item.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-1">
                {item.ok
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    : <XCircle className="w-3 h-3 text-gray-300 shrink-0" />
                }
                <span className={`text-[10px] font-medium flex-1 ${item.ok ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {item.label}: <span className="font-semibold">{item.value}{item.unit}</span>
                    {' '}
                    <span className="font-normal opacity-70">
                        {item.reverse ? `≥ ${item.target}` : `/ ${item.target}${item.unit}`}
                    </span>
                </span>
            </div>
            <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                />
            </div>
        </div>
    );
}

// ── CITY SCORE GAUGE ─────────────────────────────────────────────────────────
function CityScoreGauge({ score }) {
    const color = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#ef4444';
    const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl mb-4">
            <TrendingUp className="w-4 h-4 shrink-0" style={{ color }} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">City Score</span>
                    <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, background: color }}
                    />
                </div>
            </div>
            <span className="text-[16px] font-bold tabular-nums shrink-0" style={{ color }}>{score}</span>
        </div>
    );
}

// ── HINT TICKER ──────────────────────────────────────────────────────────────
function HintTicker({ hints }) {
    const [idx, setIdx] = useState(0);
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        if (hints.length <= 1) return;
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIdx(i => (i + 1) % hints.length);
                setVisible(true);
            }, 300);
        }, 5000);
        return () => clearInterval(interval);
    }, [hints.length]);
    const hint = hints[idx % hints.length] || hints[0];
    return (
        <div className="px-3 py-2.5 border-t border-gray-100 bg-amber-50/60">
            <div className="flex items-center gap-1 mb-1">
                <span className="text-[8px] text-amber-500 uppercase tracking-widest font-semibold">City Hint</span>
                {hints.length > 1 && (
                    <span className="text-[8px] text-gray-300 ml-auto">{(idx % hints.length) + 1}/{hints.length}</span>
                )}
            </div>
            <p
                className="text-[10px] text-amber-700 leading-relaxed transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
            >
                {hint}
            </p>
        </div>
    );
}

const IOT_ICONS = {
    ecoMode: Leaf,
    smartTraffic: Car,
    publicAwareness: Megaphone,
    emergencyBroadcast: Siren,
    smartGrid: Zap,
    predictiveOptimization: BrainCircuit,
};

// ── CASCADE EVENT BADGE ──────────────────────────────────────────────────────
function CascadeBadge({ event }) {
    if (!event) return null;
    const colorMap = {
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
        danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    };
    const c = colorMap[event.severity] || colorMap.info;
    return (
        <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border mx-4 mb-3 ${c.bg} ${c.border}`}>
            <span className="text-sm shrink-0">{event.label.split(' ')[0]}</span>
            <div>
                <div className={`text-[10px] font-semibold ${c.text}`}>{event.label}</div>
                <div className={`text-[9px] leading-relaxed mt-0.5 ${c.text} opacity-80`}>{event.description}</div>
            </div>
        </div>
    );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RightPanel({ metrics, iotSystems, onToggle, currentLevel, grid, activeCascade }) {
    const mandateItems = getMandateProgress(metrics, currentLevel);
    const achieved = checkMandateAchieved(metrics, currentLevel);
    const counts = countTiles(grid);
    const district = counts.residential + counts.commercial + counts.industrial + counts.park;
    const cityScore = calcCityScore(metrics, currentLevel);
    const hints = getContextHints(grid, metrics, currentLevel);
    const scenarioId = currentLevel.scenario;

    return (
        <div className="w-80 xl:w-96 bg-white border-l border-gray-100 flex flex-col overflow-y-auto shadow-sm">

            {/* City Score */}
            <div className="px-4 pt-4 pb-0">
                <CityScoreGauge score={cityScore} />
            </div>

            {/* Active cascade event */}
            <CascadeBadge event={activeCascade} />

            {/* Scenario / Mandate section */}
            <div className={`px-4 pb-4 border-b ${achieved ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gray-800">{currentLevel.title}</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">{currentLevel.description}</p>
                <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-2 mb-3">
                    <span className="text-[10px]">💡</span>
                    <p className="text-[10px] text-amber-600 leading-relaxed">{currentLevel.tip}</p>
                </div>

                {/* Overall progress bar */}
                {(() => {
                    const done = mandateItems.filter(i => i.ok).length;
                    const pct = Math.round((done / mandateItems.length) * 100);
                    return (
                        <div className="mb-3">
                            <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-gray-400 font-medium">Progress</span>
                                <span className={`font-semibold ${achieved ? 'text-emerald-600' : 'text-gray-500'}`}>
                                    {done}/{mandateItems.length} goals
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-800 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })()}

                {/* Goal items with micro progress bars */}
                <div>
                    {mandateItems.map(item => <GoalItem key={item.label} item={item} />)}
                </div>

                {achieved && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-semibold text-emerald-600">Mandate Achieved!</span>
                    </div>
                )}
            </div>

            {/* Live metrics */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-gray-800 rounded-full" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Live Metrics</span>
                </div>
                <MetricRow icon={Wind} label="CO₂ Emissions" value={metrics.co2} unit="%" pct={metrics.co2} />
                <MetricRow icon={Car} label="Traffic Load" value={metrics.traffic} unit="%" pct={metrics.traffic} />
                <MetricRow icon={Zap} label="Energy" value={metrics.energy} unit="MW" pct={Math.min(100, metrics.energy / 2)} />
                <MetricRow icon={Users} label="Population" value={metrics.population} unit="" pct={Math.min(100, metrics.population / 25)} />
                {scenarioId >= 1 && <MetricRow icon={Sun} label="Renewable Share" value={metrics.renewableShare} unit="%" pct={metrics.renewableShare} />}
                {scenarioId >= 2 && <MetricRow icon={Smile} label="Happiness" value={metrics.happiness} unit="%" pct={metrics.happiness} />}
                {scenarioId >= 3 && <>
                    <MetricRow icon={Droplets} label="Flood Risk" value={metrics.floodRisk} unit="%" pct={metrics.floodRisk} />
                    <MetricRow icon={Zap} label="Est. Damage" value={`$${metrics.estimatedDamage}M`} unit="" pct={(metrics.estimatedDamage / 50) * 100} />
                </>}
            </div>

            {/* SmartThings IoT */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-gray-800 rounded-full" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">SmartThings IoT</span>
                    <Radio className="w-3 h-3 text-gray-400 ml-auto" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(IOT_SYSTEMS).map(([key, sys]) => {
                        const Icon = IOT_ICONS[key] || Zap;
                        const available = currentLevel.systems.includes(key);
                        const isOn = iotSystems[key] && available;
                        return (
                            <button
                                key={key}
                                onClick={() => available && onToggle(key)}
                                disabled={!available}
                                className={`
                                    relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border text-center
                                    transition-all duration-200 min-h-[54px]
                                    ${isOn
                                        ? 'bg-gray-900 border-gray-900 shadow-sm'
                                        : available
                                            ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            : 'bg-gray-50 border-gray-100 opacity-30 cursor-not-allowed'
                                    }
                                `}
                            >
                                {available
                                    ? <Icon className={`w-3.5 h-3.5 ${isOn ? 'text-white' : 'text-gray-400'}`} />
                                    : <Lock className="w-3 h-3 text-gray-300" />
                                }
                                <span className={`text-[8.5px] leading-tight font-medium ${isOn ? 'text-gray-200' : 'text-gray-400'}`}>
                                    {sys.label}
                                </span>
                                {isOn && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* District counts */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-gray-200 rounded-full" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Districts</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[
                        { label: 'Res', count: counts.residential },
                        { label: 'Com', count: counts.commercial },
                        { label: 'Ind', count: counts.industrial },
                        { label: 'Park', count: counts.park },
                        { label: 'Solar', count: counts.solar || 0 },
                        { label: 'Bus', count: counts.transit || 0 },
                    ].map(({ label, count }) => (
                        <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
                            <div className="text-[13px] font-bold tabular-nums text-gray-800">{count}</div>
                            <div className="text-[8px] text-gray-400 mt-0.5 font-medium">{label}</div>
                        </div>
                    ))}
                </div>
                <div className="text-[9px] text-gray-300 text-center font-medium">
                    {district} districts · {counts.road} roads
                </div>
            </div>

            {/* Hint ticker — pinned at bottom */}
            <div className="sticky bottom-0 bg-white">
                <HintTicker hints={hints} />
            </div>
        </div>
    );
}