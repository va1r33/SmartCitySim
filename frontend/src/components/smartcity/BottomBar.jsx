import React from 'react';
import { Play, Pause, RotateCcw, Trash2 } from 'lucide-react';
import { LEVELS, checkMandateAchieved } from './SimulationEngine';

export default function BottomBar({
    isRunning, onToggleRun, onReset, onEraseAll,
    speed, onSpeedChange,
    currentLevelId, onLevelChange,
    metrics, selectedTool, tickCount,
}) {
    const currentLevel = LEVELS.find(l => l.id === currentLevelId);
    const achieved = currentLevel ? checkMandateAchieved(metrics, currentLevel) : false;

    return (
        <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex items-center gap-2.5 flex-wrap shrink-0 shadow-sm">

            {/* Run / Pause */}
            <button
                onClick={onToggleRun}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-semibold uppercase tracking-wider border transition-all shadow-sm
          ${isRunning
                        ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700'
                        : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700'
                    }`}
            >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? 'Pause' : 'Run'}
            </button>

            <button onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all">
                <RotateCcw className="w-3.5 h-3.5" />Restart
            </button>

            <button onClick={onEraseAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-medium text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-rose-500 transition-all">
                <Trash2 className="w-3.5 h-3.5" />Erase
            </button>

            <div className="w-px h-5 bg-gray-100 mx-0.5" />

            {/* Speed */}
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-300 uppercase tracking-widest hidden sm:block font-semibold">Speed</span>
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-2xl p-1">
                    {[1, 2, 4].map(s => (
                        <button key={s} onClick={() => onSpeedChange(s)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all
                ${speed === s ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >{s}×</button>
                    ))}
                </div>
            </div>

            <div className="w-px h-5 bg-gray-100 mx-0.5" />

            {/* Level selector */}
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-300 uppercase tracking-widest hidden sm:block font-semibold">Scenario</span>
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-2xl p-1">
                    {LEVELS.map(lvl => (
                        <button
                            key={lvl.id}
                            onClick={() => onLevelChange(lvl.id)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold uppercase tracking-wide transition-all
                ${currentLevelId === lvl.id
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            S{lvl.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected tool label */}
            <div className="ml-auto text-[10px] text-gray-400 hidden md:flex items-center gap-1.5">
                <span className="text-gray-300">Tool:</span>
                <span className="text-gray-700 font-semibold uppercase tracking-wider">{selectedTool}</span>
                <span className="text-gray-300">· click grid to place</span>
            </div>

            {/* Mandate badge */}
            {achieved && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-2xl ml-1">
                    ✓ Mandate Achieved
                </div>
            )}
        </div>
    );
}