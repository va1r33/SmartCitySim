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
        <div className="w-16 md:w-20 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-1.5 shrink-0 shadow-sm">
            <span className="text-[8px] text-gray-400 uppercase tracking-wider mb-1 hidden md:block font-semibold">BUILD</span>
            {TOOLS.map(({ id, icon: Icon, label, emoji }) => {
                const active = selectedTool === id;
                return (
                    <button
                        key={id}
                        onClick={() => onSelectTool(id)}
                        title={label}
                        className={`
                            w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5
                            transition-all duration-200 border
                            ${active
                                ? 'bg-gray-900 border-gray-900 scale-105 shadow-md'
                                : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                            }
                        `}
                    >
                        <span className="text-lg leading-none">{emoji}</span>
                        <span className={`text-[8px] font-bold tracking-wider mt-0.5 ${active ? 'text-white' : 'text-gray-400'}`}>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}