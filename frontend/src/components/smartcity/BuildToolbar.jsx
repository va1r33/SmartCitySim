import React from 'react';
import { Home, Building2, Factory, TreePine, Route, Eraser, Sun, Bus } from 'lucide-react';

const TOOLS = [
    { id: 'residential', icon: Home, label: 'RES', color: '#3b82f6', emoji: '🏠' },
    { id: 'commercial', icon: Building2, label: 'COM', color: '#f59e0b', emoji: '🏢' },
    { id: 'industrial', icon: Factory, label: 'IND', color: '#ef4444', emoji: '🏭' },
    { id: 'park', icon: TreePine, label: 'PARK', color: '#22c55e', emoji: '🌳' },
    { id: 'solar', icon: Sun, label: 'SOLAR', color: '#fbbf24', emoji: '☀️' },
    { id: 'transit', icon: Bus, label: 'BUS', color: '#a78bfa', emoji: '🚌' },
    { id: 'road', icon: Route, label: 'ROAD', color: '#94a3b8', emoji: '🛣️' },
    { id: 'empty', icon: Eraser, label: 'ERASE', color: '#64748b', emoji: '🗑️' },
];

export default function BuildToolbar({ selectedTool, onSelectTool }) {
    return (
        <div className="w-14 md:w-16 bg-[#0d1424]/95 border-r border-[#1e293b] flex flex-col items-center py-3 gap-1.5 shrink-0">
            <span className="text-[8px] text-slate-600 uppercase tracking-wider mb-1 hidden md:block">Build</span>
            {TOOLS.map(({ id, icon: Icon, label, color, emoji }) => {
                const active = selectedTool === id;
                return (
                    <button
                        key={id}
                        onClick={() => onSelectTool(id)}
                        title={label}
                        className={`
              w-10 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5
              transition-all duration-150 border
              ${active
                                ? 'border-opacity-50 scale-105'
                                : 'border-transparent hover:bg-[#1e293b]'
                            }
            `}
                        style={active ? {
                            backgroundColor: `${color}18`,
                            borderColor: `${color}60`,
                            boxShadow: `0 0 12px ${color}25`,
                        } : {}}
                    >
                        <span className="text-base leading-none">{emoji}</span>
                        <span className="text-[8px] font-bold tracking-wider" style={{ color: active ? color : '#475569' }}>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}