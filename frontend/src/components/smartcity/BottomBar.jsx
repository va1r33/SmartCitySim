import React from 'react';
import { Play, RotateCcw, BarChart2, Trash2 } from 'lucide-react';
import { LEVELS, checkMandateAchieved } from './SimulationEngine';

export default function BottomBar({
    onRun,
    onReset,
    onEraseAll,
    speed,
    onSpeedChange,
    currentLevelId,
    onLevelChange,
    metrics,
    selectedTool,
}) {
    const currentLevel = LEVELS.find(l => l.id === currentLevelId);
    const achieved = currentLevel ? checkMandateAchieved(metrics, currentLevel) : false;

    return (
        <div className="bg-[#0d1424]/95 border-t border-[#1e293b] px-3 py-2 flex items-center gap-2 flex-wrap shrink-0 backdrop-blur-sm">
            {/* Run button – now calls onRun */}
            <button
                onClick={onRun}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all bg-teal-500/15 text-teal-400 border-teal-500/30 hover:bg-teal-500/25"
            >
                <Play className="w-3 h-3" />
                ▶ Run
            </button>

            <button onClick={onReset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 border border-[#1e293b] hover:bg-[#1e293b] transition-all">
                <RotateCcw className="w-3 h-3" />Restart
            </button>

            <button onClick={() => { }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 border border-[#1e293b] hover:bg-[#1e293b] transition-all">
                <BarChart2 className="w-3 h-3" />Dashboard
            </button>

            <button onClick={onEraseAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                <Trash2 className="w-3 h-3" />Erase All
            </button>

            <div className="w-px h-5 bg-[#1e293b] mx-1" />

            {/* Speed selector (optional – you can implement later) */}
            <div className="flex items-center gap-1">
                <span className="text-[9px] text-slate-600 uppercase">Speed</span>
                {[1, 2, 4].map(s => (
                    <button key={s} onClick={() => onSpeedChange && onSpeedChange(s)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all
              ${speed === s ? 'bg-teal-500/20 text-teal-400' : 'text-slate-600 hover:text-slate-400'}`}
                    >{s}x</button>
                ))}
            </div>

            <div className="w-px h-5 bg-[#1e293b] mx-1" />

            {/* Level selector */}
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-600 uppercase">Level</span>
                <div className="flex gap-1">
                    {LEVELS.map(lvl => (
                        <button
                            key={lvl.id}
                            onClick={() => onLevelChange(lvl.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all border
                ${currentLevelId === lvl.id
                                    ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                                    : 'text-slate-600 border-transparent hover:border-[#1e293b] hover:text-slate-400'
                                }`}
                        >
                            S{lvl.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected tool label */}
            <div className="ml-auto text-[9px] text-slate-500 hidden md:block">
                Selected: <span className="text-slate-300 font-semibold uppercase">{selectedTool}</span> — Click grid to place
            </div>

            {/* Mandate badge */}
            {achieved && (
                <div className="text-[10px] text-teal-400 font-bold animate-pulse ml-1">
                    ✓ Mandate Achieved!
                </div>
            )}
        </div>
    );
}