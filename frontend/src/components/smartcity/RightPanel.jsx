import React from 'react';
import { Wind, Car, Zap, Users, Leaf, Radio, Megaphone, BrainCircuit, Lock, Sun, Bus, Siren, Smile, Droplets, CheckCircle2, XCircle } from 'lucide-react';
import { IOT_SYSTEMS, getMandateProgress, checkMandateAchieved, countTiles } from './SimulationEngine';

function MetricRow({ icon: Icon, label, value, unit, color, pct }) {
    return (
        <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3" style={{ color }} />
                    <span className="text-[11px] text-slate-400">{label}</span>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}{unit}</span>
            </div>
            <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
            </div>
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

export default function RightPanel({ metrics, iotSystems, onToggle, currentLevel, grid }) {
    const mandateItems = getMandateProgress(metrics, currentLevel);
    const achieved = checkMandateAchieved(metrics, currentLevel);
    const counts = countTiles(grid);
    const district = counts.residential + counts.commercial + counts.industrial + counts.park;

    const scenarioId = currentLevel.scenario;

    return (
        <div className="w-52 xl:w-60 bg-[#0d1424]/95 border-l border-[#1e293b] flex flex-col overflow-y-auto">

            {/* Scenario / Mandate section */}
            <div className={`p-3 border-b ${achieved ? 'border-teal-500/30 bg-teal-500/5' : 'border-[#1e293b]'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">{currentLevel.title}</span>
                </div>
                <p className="text-[9px] text-slate-500 mb-1.5 leading-relaxed">{currentLevel.description}</p>
                <p className="text-[9px] text-amber-400/80 mb-2 leading-relaxed italic">💡 {currentLevel.tip}</p>

                {/* Progress bar */}
                {(() => {
                    const done = mandateItems.filter(i => i.ok).length;
                    const pct = Math.round((done / mandateItems.length) * 100);
                    return (
                        <div className="mb-2">
                            <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                                <span>Progress</span>
                                <span className={achieved ? 'text-teal-400 font-bold' : ''}>{pct}%</span>
                            </div>
                            <div className="h-1 bg-[#1e293b] rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    );
                })()}

                <div className="space-y-1">
                    {mandateItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            {item.ok
                                ? <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0" />
                                : <XCircle className="w-3 h-3 text-slate-600 shrink-0" />
                            }
                            <span className={`text-[10px] ${item.ok ? 'text-teal-300' : 'text-slate-400'}`}>
                                {item.label}: {item.value}{item.unit} {item.reverse ? `≥ ${item.target}` : `/ ${item.target}${item.unit}`}
                            </span>
                        </div>
                    ))}
                </div>

                {achieved && (
                    <div className="mt-2 text-center text-[10px] font-bold text-teal-400 animate-pulse">
                        ✓ Mandate Achieved!
                    </div>
                )}
            </div>

            {/* Live metrics — show relevant ones per scenario */}
            <div className="p-3 border-b border-[#1e293b]">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-2">Live Metrics</span>

                {/* Always show */}
                <MetricRow icon={Wind} label="CO₂ Emissions" value={metrics.co2} unit="%" color="#ef4444" pct={metrics.co2} />
                <MetricRow icon={Car} label="Traffic Load" value={metrics.traffic} unit="%" color="#f59e0b" pct={metrics.traffic} />
                <MetricRow icon={Zap} label="Energy" value={metrics.energy} unit="MW" color="#3b82f6" pct={Math.min(100, metrics.energy / 2)} />
                <MetricRow icon={Users} label="Population" value={metrics.population} unit="" color="#22c55e" pct={Math.min(100, metrics.population / 25)} />

                {/* Scenario 1 extra */}
                {scenarioId >= 1 && (
                    <MetricRow icon={Sun} label="Renewable Share" value={metrics.renewableShare} unit="%" color="#fbbf24" pct={metrics.renewableShare} />
                )}

                {/* Scenario 2+ */}
                {scenarioId >= 2 && (
                    <MetricRow icon={Smile} label="Happiness" value={metrics.happiness} unit="%" color="#a78bfa" pct={metrics.happiness} />
                )}

                {/* Scenario 3+ */}
                {scenarioId >= 3 && (
                    <>
                        <MetricRow icon={Droplets} label="Flood Risk" value={metrics.floodRisk} unit="%" color="#60a5fa" pct={metrics.floodRisk} />
                        <MetricRow icon={Zap} label="Est. Damage" value={`$${metrics.estimatedDamage}M`} unit="" color="#f87171" pct={(metrics.estimatedDamage / 50) * 100} />
                    </>
                )}
            </div>

            {/* SmartThings IoT */}
            <div className="p-3 border-b border-[#1e293b]">
                <div className="flex items-center gap-1.5 mb-2">
                    <Radio className="w-3 h-3 text-teal-400" />
                    <span className="text-[10px] text-teal-400 uppercase tracking-widest font-semibold">SmartThings IoT</span>
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
                  relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-center
                  transition-all duration-200 min-h-[52px]
                  ${isOn
                                        ? 'bg-teal-500/15 border-teal-500/40 shadow-[0_0_10px_rgba(20,184,166,0.15)]'
                                        : available
                                            ? 'bg-[#111827] border-[#1e293b] hover:border-slate-600'
                                            : 'bg-[#0a0e17] border-[#111] opacity-40 cursor-not-allowed'
                                    }
                `}
                            >
                                {available
                                    ? <Icon className={`w-4 h-4 ${isOn ? 'text-teal-400' : 'text-slate-500'}`} />
                                    : <Lock className="w-3.5 h-3.5 text-slate-700" />
                                }
                                <span className={`text-[9px] leading-tight font-medium ${isOn ? 'text-teal-300' : 'text-slate-500'}`}>
                                    {sys.label}
                                </span>
                                {isOn && (
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* District counts */}
            <div className="p-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-2">District Count</span>
                <div className="grid grid-cols-3 gap-1 mb-1">
                    {[
                        { label: 'Res', count: counts.residential, color: '#3b82f6' },
                        { label: 'Com', count: counts.commercial, color: '#f59e0b' },
                        { label: 'Ind', count: counts.industrial, color: '#ef4444' },
                        { label: 'Park', count: counts.park, color: '#22c55e' },
                        { label: 'Solar', count: counts.solar || 0, color: '#fbbf24' },
                        { label: 'Bus', count: counts.transit || 0, color: '#a78bfa' },
                    ].map(({ label, count, color }) => (
                        <div key={label} className="bg-[#111827] border border-[#1e293b] rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold tabular-nums" style={{ color }}>{count}</div>
                            <div className="text-[9px] text-slate-500">{label}</div>
                        </div>
                    ))}
                </div>
                <div className="text-[9px] text-slate-500 text-center mt-1">
                    {district} districts · {counts.road} roads
                </div>
            </div>
        </div>
    );
}