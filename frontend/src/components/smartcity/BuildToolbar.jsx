import React from 'react';
import {
    Home,
    Building2,
    Factory,
    TreePine,
    Sun,
    Bus,
    Route,
    Eraser,
} from 'lucide-react';

const TOOLS = [
    { id: 'residential', icon: Home, label: 'RES' },
    { id: 'commercial', icon: Building2, label: 'COM' },
    { id: 'industrial', icon: Factory, label: 'IND' },
    { id: 'park', icon: TreePine, label: 'PARK' },
    { id: 'solar', icon: Sun, label: 'SOLAR' },
    { id: 'transit', icon: Bus, label: 'BUS' },
    { id: 'road', icon: Route, label: 'ROAD' },
    { id: 'empty', icon: Eraser, label: 'ERASE' },
];

export default function BuildToolbar({ selectedTool, onSelectTool }) {
    return (
        <div className="w-16 md:w-20 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-1.5 shrink-0 shadow-sm">
            <span className="text-[8px] text-gray-400 uppercase tracking-wider mb-1 hidden md:block font-semibold">
                BUILD
            </span>
            {TOOLS.map(({ id, icon: Icon, label }) => {
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
                        <Icon
                            className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`}
                            strokeWidth={1.8}
                        />
                        <span
                            className={`text-[8px] font-bold tracking-wider mt-0.5 ${active ? 'text-white' : 'text-gray-400'
                                }`}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}