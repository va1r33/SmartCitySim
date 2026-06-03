import React, { useState, useEffect } from 'react';
import {
    Wind, Car, Zap, Users, Leaf, Radio, Megaphone,
    BrainCircuit, Lock, Sun, Siren, Smile, Droplets,
    CheckCircle2, XCircle, TrendingUp, Shield,
    AlertTriangle, ChevronDown, ChevronUp, Target,
} from 'lucide-react';
import {
    IOT_SYSTEMS, getMandateProgress, checkMandateAchieved,
    countTiles, calcCityScore, getContextHints, getZoningCompliance,
} from './SimulationEngine';
import { getZoningComplianceSummary } from './ZoningRules';

// ── Per‑scenario colour palette (distinct, muted) ───────────────────────────
const SCENARIO_COLORS = {
    1: { name: 'Darker Teal', hex: '#6C9B9D', textClass: 'text-teal-700' },
    2: { name: 'Muted Ochre', hex: '#D4B87A', textClass: 'text-amber-600' },
    3: { name: 'Dusty Mauve', hex: '#A788A3', textClass: 'text-rose-400' },
    4: { name: 'Dusty Rose', hex: '#D9A7A7', textClass: 'text-rose-500' },
};

// ── Mapping from goal label to muted metric colour (hex) ────────────────────
const GOAL_COLORS = {
    'CO₂': '#fda4af',          // rose-300
    'Traffic': '#fcd34d',      // amber-300
    'Energy': '#c7d2fe',       // indigo-300
    'Flood Risk': '#a5f3fc',   // cyan-300
    'Est. Damage': '#fda4af',  // rose-300
    'Population': '#93c5fd',   // blue-300
    'Happiness': '#f9a8d4',    // pink-300
};

// ── Sticky Mandate Banner (coloured progress & text per scenario) ───────────
function StickyMandateBanner({ currentLevel, mandateItems, achieved, scenarioColor }) {
    const [expanded, setExpanded] = useState(true);
    const done = mandateItems.filter(i => i.ok).length;
    const total = mandateItems.length;
    const pct = Math.round((done / total) * 100);

    return (
        <div className="sticky top-0 z-30 bg-slate-100/80 backdrop-blur-sm border-b border-slate-200 shadow-sm rounded-b-xl">
            <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
                <Target className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-[11px] font-semibold tracking-tight truncate flex-1" style={{ color: scenarioColor.hex }}>
                    {currentLevel.title}
                </span>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors shrink-0"
                >
                    {expanded ? <ChevronUp className="w-2.5 h-2.5 text-slate-600" /> : <ChevronDown className="w-2.5 h-2.5 text-slate-600" />}
                </button>
            </div>

            <div className="px-4 pt-0.5 pb-2.5">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-widest">Progress</span>
                    <span className="text-[10px] font-semibold" style={{ color: scenarioColor.hex }}>
                        {done}/{total} goals{achieved ? ' ✓' : ''}
                    </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: scenarioColor.hex }}
                    />
                </div>
            </div>

            {expanded && (
                <div className="px-3 pb-3 space-y-1">
                    {mandateItems.map(item => <BannerGoalCard key={item.label} item={item} />)}
                    <div className="mt-1.5 px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                        <p className="text-[9px] text-amber-800 leading-relaxed">💡 {currentLevel.tip}</p>
                    </div>
                    {achieved && (
                        <div className="flex items-center justify-center gap-2 py-2 bg-slate-200 border border-slate-300 rounded-xl mt-1">
                            <CheckCircle2 className="w-3 h-3 text-slate-600" />
                            <span className="text-[10px] font-semibold text-slate-700">Mandate Achieved</span>
                        </div>
                    )}
                </div>
            )}

            {!expanded && (
                <div className="flex flex-wrap gap-1 px-3 pb-2.5">
                    {mandateItems.map(item => (
                        <span key={item.label} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-medium ${item.ok ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                            {item.ok ? <CheckCircle2 className="w-2 h-2 text-slate-500" /> : <XCircle className="w-2 h-2 text-slate-400" />}
                            {item.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Banner Goal Card – uses muted metric colours for incomplete goals ───────
function BannerGoalCard({ item }) {
    const pct = Math.min(100, (item.value / Math.max(1, item.target)) * 100);
    // Use the metric's muted colour for incomplete goals; grey for completed
    const barColor = item.ok ? '#d1d5db' : (GOAL_COLORS[item.label] || '#cbd5e1');
    return (
        <div className={`px-2.5 py-2 rounded-xl border transition-all duration-300 ${item.ok ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-150'}`}>
            <div className="flex items-center gap-2 mb-1">
                {item.ok ? <CheckCircle2 className="w-2.5 h-2.5 text-slate-500 shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                <span className={`text-[9.5px] font-semibold flex-1 ${item.ok ? 'text-slate-700' : 'text-slate-600'}`}>{item.label}:</span>
                <span className={`text-[10.5px] font-bold tabular-nums ${item.ok ? 'text-slate-800' : 'text-slate-700'}`}>{item.value}{item.unit}</span>
                <span className="text-[8px] text-slate-400 shrink-0 ml-1">{item.reverse ? `≥${item.target}` : `/${item.target}${item.unit}`}</span>
            </div>
            <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
            </div>
        </div>
    );
}

// ── City Score Strip (coloured progress bar, score, status per scenario) ────
function CityScoreStrip({ score, scenarioColor }) {
    let labelText = '';
    if (score >= 80) labelText = 'Excellent';
    else if (score >= 60) labelText = 'Good';
    else if (score >= 40) labelText = 'Fair';
    else labelText = 'Needs Work';

    return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl shadow-md">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[8.5px] text-gray-400 uppercase tracking-widest font-bold">City Score</span>
                    <span className="text-[9px] font-bold" style={{ color: scenarioColor.hex }}>{labelText}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, background: scenarioColor.hex }}
                    />
                </div>
            </div>
            <span className="text-2xl font-black tabular-nums shrink-0 leading-none" style={{ color: scenarioColor.hex }}>
                {score}
            </span>
        </div>
    );
}

// ── Section Header (unchanged) ─────────────────────────────────────────────
function SectionHeader({ label, right }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-3.5 bg-gray-300 rounded-full shrink-0" />
            <span className="text-[9.5px] uppercase tracking-widest font-bold text-gray-500 flex-1">{label}</span>
            {right && <div className="shrink-0 text-gray-300">{right}</div>}
        </div>
    );
}

// ── Metric Row (muted, desaturated colours – unchanged) ────────────────────
const METRIC_COLORS = {
    co2: { bg: 'bg-rose-100/50', icon: 'text-rose-400', bar: 'bg-rose-300' },
    traffic: { bg: 'bg-amber-100/50', icon: 'text-amber-500', bar: 'bg-amber-300' },
    energy: { bg: 'bg-indigo-100/50', icon: 'text-indigo-400', bar: 'bg-indigo-300' },
    population: { bg: 'bg-blue-100/50', icon: 'text-blue-400', bar: 'bg-blue-300' },
    renewable: { bg: 'bg-emerald-100/50', icon: 'text-emerald-500', bar: 'bg-emerald-300' },
    happiness: { bg: 'bg-pink-100/50', icon: 'text-pink-400', bar: 'bg-pink-300' },
    floodRisk: { bg: 'bg-cyan-100/50', icon: 'text-cyan-500', bar: 'bg-cyan-300' },
    damage: { bg: 'bg-rose-100/50', icon: 'text-rose-400', bar: 'bg-rose-300' },
};

function MetricRow({ metricKey, icon: Icon, label, value, unit, pct }) {
    const colors = METRIC_COLORS[metricKey] || METRIC_COLORS.co2;
    return (
        <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md ${colors.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3 h-3 ${colors.icon}`} />
                    </div>
                    <span className="text-[10.5px] text-gray-600 font-medium">{label}</span>
                </div>
                <span className="text-[12px] font-bold tabular-nums text-gray-700">
                    {value}<span className="text-[9px] font-normal text-gray-400 ml-0.5">{unit}</span>
                </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-7">
                <div className={`h-full rounded-full transition-all duration-500 ${colors.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
        </div>
    );
}

// ── Cascade Badge (unchanged) ──────────────────────────────────────────────
function CascadeBadge({ event }) {
    if (!event) return null;
    return (
        <div className="flex items-start gap-2.5 px-3 py-2.5 mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
            <span className="text-base shrink-0 leading-none mt-0.5 text-amber-600">{event.label.split(' ')[0]}</span>
            <div>
                <div className="text-[10px] font-semibold text-amber-800">{event.label}</div>
                <div className="text-[9px] text-amber-700 leading-relaxed mt-0.5 opacity-90">{event.description}</div>
            </div>
        </div>
    );
}

// ── IoT Grid (unchanged) ───────────────────────────────────────────────────
const IOT_ICONS = {
    ecoMode: Leaf, smartTraffic: Car, publicAwareness: Megaphone,
    emergencyBroadcast: Siren, smartGrid: Zap, predictiveOptimization: BrainCircuit,
};

function IoTGrid({ iotSystems, onToggle, currentLevel }) {
    return (
        <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(IOT_SYSTEMS).map(([key, sys]) => {
                const Icon = IOT_ICONS[key] || Zap;
                const available = currentLevel.systems.includes(key);
                const isOn = iotSystems[key] && available;
                return (
                    <button key={key} onClick={() => available && onToggle(key)} disabled={!available}
                        className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200 min-h-[60px]
                            ${isOn ? 'bg-gray-200 border-gray-300 shadow-sm' : available ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gray-50 border-gray-100 opacity-30 cursor-not-allowed'}`}>
                        {available ? <Icon className={`w-3.5 h-3.5 ${isOn ? 'text-gray-700' : 'text-gray-400'}`} /> : <Lock className="w-3 h-3 text-gray-300" />}
                        <span className={`text-[8px] leading-tight font-medium ${isOn ? 'text-gray-700' : 'text-gray-500'}`}>{sys.label}</span>
                        {available && !isOn && <span className="text-[7px] text-gray-400 font-medium leading-none">{sys.effect}</span>}
                        {isOn && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gray-500" />}
                    </button>
                );
            })}
        </div>
    );
}

// ── Zoning Compliance Panel (unchanged) ────────────────────────────────────
const CODE_LABELS = {
    'KR-NLPUA-76': 'Buffer Zone · NLPUA Art. 76',
    'KR-BA-44': 'Road Access · Building Act Art. 44',
    'KR-SOLAR-GLARE': 'Solar Glare · Seoul Guidelines',
};

function ZoningPanel({ grid }) {
    const hard = getZoningComplianceSummary(grid);
    const soft = getZoningCompliance(grid);
    return (
        <div className="p-4 border-y border-gray-200 bg-gray-100">
            <SectionHeader label="Zoning Compliance" right={<Shield className="w-3 h-3 text-gray-400" />} />
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-2 ${hard.isFullyCompliant ? 'bg-gray-50 border-gray-100' : 'bg-stone-50 border-stone-200'}`}>
                {hard.isFullyCompliant ? <CheckCircle2 className="w-3 h-3 text-gray-400 shrink-0" /> : <XCircle className="w-3 h-3 text-stone-400 shrink-0" />}
                <span className={`text-[10px] font-semibold ${hard.isFullyCompliant ? 'text-gray-500' : 'text-stone-600'}`}>
                    {hard.isFullyCompliant ? 'No hard violations' : `${hard.violationCount} violation${hard.violationCount !== 1 ? 's' : ''} on grid`}
                </span>
            </div>
            {!hard.isFullyCompliant && (
                <div className="space-y-1 mb-2">
                    {hard.violatedCodes.map(code => (
                        <div key={code} className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-50 border border-stone-100 rounded-lg">
                            <span className="w-1 h-1 rounded-full bg-stone-400 shrink-0" />
                            <span className="text-[9px] text-stone-600 font-medium">{CODE_LABELS[code] ?? code}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border mb-1.5 ${soft.greenViolation ? 'bg-stone-50 border-stone-200' : 'bg-gray-50 border-gray-100'}`}>
                {soft.greenViolation ? <AlertTriangle className="w-3 h-3 text-stone-400 shrink-0" /> : <CheckCircle2 className="w-3 h-3 text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                    <span className={`text-[9.5px] font-semibold block ${soft.greenViolation ? 'text-stone-600' : 'text-gray-500'}`}>
                        Green space {soft.greenRatio}%<span className="font-normal text-gray-400 ml-1">/ 5% min.</span>
                    </span>
                    {soft.greenViolation && <span className="text-[8.5px] text-stone-500 leading-tight">+{soft.greenDeficit} park tile{soft.greenDeficit !== 1 ? 's' : ''} needed</span>}
                </div>
            </div>
            {Object.entries(soft.farWarnings).map(([zone, w]) => w && (
                <div key={zone} className="flex items-center gap-2 px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl mb-1.5">
                    <AlertTriangle className="w-3 h-3 text-stone-400 shrink-0" />
                    <div>
                        <span className="text-[9.5px] font-semibold text-stone-600 capitalize block">{zone} {w.currentPct}%<span className="font-normal text-stone-400 ml-1">/ {w.limitPct}% limit</span></span>
                        <span className="text-[8.5px] text-stone-400">NLPUA Art. 78 — diversify land use</span>
                    </div>
                </div>
            ))}
            {!soft.hasAnyWarning && hard.isFullyCompliant && <p className="text-[9px] text-gray-400 text-center py-1">All planning rules satisfied ✓</p>}
            <p className="text-[7.5px] text-gray-400 mt-2 leading-relaxed">NLPUA Arts. 76 & 78 · Building Act Art. 44 · Seoul Ordinances</p>
        </div>
    );
}

// ── District Grid (unchanged) ──────────────────────────────────────────────
function DistrictGrid({ counts }) {
    const TILES = [
        { label: 'Res', key: 'residential' }, { label: 'Com', key: 'commercial' },
        { label: 'Ind', key: 'industrial' }, { label: 'Park', key: 'park' },
        { label: 'Solar', key: 'solar' }, { label: 'Bus', key: 'transit' },
    ];
    return (
        <div className="grid grid-cols-3 gap-1.5">
            {TILES.map(({ label, key }) => {
                const count = counts[key] ?? 0;
                const fillH = Math.min(100, (count / 30) * 100);
                return (
                    <div key={label} className="relative bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 bg-gray-200/60 rounded-b-xl transition-all duration-500" style={{ height: `${fillH}%` }} />
                        <div className="relative">
                            <div className="text-[14px] font-bold tabular-nums text-gray-700">{count}</div>
                            <div className="text-[8px] font-semibold text-gray-500 mt-0.5">{label}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Hint Ticker (unchanged) ────────────────────────────────────────────────
function HintTicker({ hints }) {
    const [idx, setIdx] = useState(0);
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        if (hints.length <= 1) return;
        const t = setInterval(() => {
            setVisible(false);
            setTimeout(() => { setIdx(i => (i + 1) % hints.length); setVisible(true); }, 300);
        }, 5000);
        return () => clearInterval(t);
    }, [hints.length]);
    const hint = hints[idx % hints.length] || hints[0];
    return (
        <div className="px-4 py-3 border-t border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] text-amber-600 uppercase tracking-widest font-bold">City Hint</span>
                {hints.length > 1 && (
                    <div className="ml-auto flex gap-0.5">
                        {hints.map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full transition-colors duration-300 ${i === idx % hints.length ? 'bg-amber-400' : 'bg-amber-200'}`} />
                        ))}
                    </div>
                )}
            </div>
            <p className="text-[10px] text-amber-800 leading-relaxed font-medium transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }}>
                {hint}
            </p>
        </div>
    );
}

// ── Main RightPanel ────────────────────────────────────────────────────────
export default function RightPanel({ metrics, iotSystems, onToggle, currentLevel, grid, activeCascade }) {
    const mandateItems = getMandateProgress(metrics, currentLevel);
    const achieved = checkMandateAchieved(metrics, currentLevel);
    const counts = countTiles(grid);
    const district = counts.residential + counts.commercial + counts.industrial + counts.park;
    const cityScore = calcCityScore(metrics, currentLevel);
    const hints = getContextHints(grid, metrics, currentLevel);
    const scenarioId = currentLevel.scenario;
    const scenarioColor = SCENARIO_COLORS[scenarioId] || SCENARIO_COLORS[1];

    return (
        <div className="w-80 xl:w-96 bg-white border-l border-gray-100 flex flex-col h-full overflow-hidden">
            <StickyMandateBanner
                currentLevel={currentLevel}
                mandateItems={mandateItems}
                achieved={achieved}
                scenarioColor={scenarioColor}
            />
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 pt-3 pb-0">
                    <CityScoreStrip score={cityScore} scenarioColor={scenarioColor} />
                </div>
                {activeCascade && <CascadeBadge event={activeCascade} />}
                <div className="p-4 border-b border-gray-100">
                    <SectionHeader label="Live Metrics" />
                    <MetricRow metricKey="co2" icon={Wind} label="CO₂ Emissions" value={metrics.co2} unit="%" pct={metrics.co2} />
                    <MetricRow metricKey="traffic" icon={Car} label="Traffic Load" value={metrics.traffic} unit="%" pct={metrics.traffic} />
                    <MetricRow metricKey="energy" icon={Zap} label="Energy" value={metrics.energy} unit="MW" pct={Math.min(100, metrics.energy / 2)} />
                    <MetricRow metricKey="population" icon={Users} label="Population" value={metrics.population} unit="" pct={Math.min(100, metrics.population / 25)} />
                    {scenarioId >= 1 && <MetricRow metricKey="renewable" icon={Sun} label="Renewable Share" value={metrics.renewableShare} unit="%" pct={metrics.renewableShare} />}
                    {scenarioId >= 2 && <MetricRow metricKey="happiness" icon={Smile} label="Happiness" value={metrics.happiness} unit="%" pct={metrics.happiness} />}
                    {scenarioId >= 3 && <>
                        <MetricRow metricKey="floodRisk" icon={Droplets} label="Flood Risk" value={metrics.floodRisk} unit="%" pct={metrics.floodRisk} />
                        <MetricRow metricKey="damage" icon={Zap} label="Est. Damage" value={`$${metrics.estimatedDamage}M`} unit="" pct={(metrics.estimatedDamage / 50) * 100} />
                    </>}
                </div>

                <div className="p-4 border-b border-gray-100 bg-white">
                    <SectionHeader label="SmartThings IoT" right={<Radio className="w-3 h-3 text-gray-400" />} />
                    <IoTGrid iotSystems={iotSystems} onToggle={onToggle} currentLevel={currentLevel} />
                </div>

                <ZoningPanel grid={grid} />

                <div className="p-4 border-t border-gray-300 bg-gray-200">
                    <SectionHeader label="Districts" />
                    <DistrictGrid counts={counts} />
                    <p className="text-[8.5px] text-gray-600 text-center font-medium mt-2">{district} districts · {counts.road} roads</p>
                </div>

                <HintTicker hints={hints} />
            </div>
        </div>
    );
}