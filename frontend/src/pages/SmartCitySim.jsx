import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopHUD from '../components/smartcity/TopHUD';
import BuildToolbar from '../components/smartcity/BuildToolbar';
import CityGrid from '../components/smartcity/CityGrid';
import RightPanel from '../components/smartcity/RightPanel';
import BottomBar from '../components/smartcity/BottomBar';
import UserManual from '../components/smartcity/UserManual';
import {
    createDefaultGrid,
    createEmptyGrid,
    calculateMetrics,
    LEVELS,
    checkMandateAchieved,
    pickCascadeEvent,
    forecastMetrics,
} from '../components/smartcity/SimulationEngine';
import { initCars, stepCars } from '../components/smartcity/CarAgents';

const INITIAL_CAR_COUNT = 14;
// How many metric snapshots to keep for ML regression
const HISTORY_MAX = 40;

export default function SmartCitySim() {
    const [grid, setGrid] = useState(() => createDefaultGrid());
    const [selectedTool, setSelectedTool] = useState('residential');
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [currentLevelId, setCurrentLevelId] = useState(1);
    const [tickCount, setTickCount] = useState(0);
    const [cars, setCars] = useState([]);
    const [iotSystems, setIotSystems] = useState({
        ecoMode: false,
        publicAwareness: false,
        smartTraffic: false,
        emergencyBroadcast: false,
        smartGrid: false,
        predictiveOptimization: false,
    });
    const [metrics, setMetrics] = useState({ traffic: 0, energy: 0, co2: 0, population: 0 });
    const [showManual, setShowManual] = useState(true);

    // ── Cascade event state ──────────────────────────────────────────────────
    // activeCascade: the current event object (or null)
    // cascadeModifiers: the metric deltas applied while the event is active
    const [activeCascade, setActiveCascade] = useState(null);
    const [cascadeModifiers, setCascadeModifiers] = useState({});
    const cascadeExpiryRef = useRef(null); // tick at which the event ends

    // ── Metric history for ML forecast ──────────────────────────────────────
    const [metricHistory, setMetricHistory] = useState([]);
    const [forecast, setForecast] = useState(null);

    const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

    const gridRef = useRef(grid);
    const iotRef = useRef(iotSystems);
    const cascadeModRef = useRef(cascadeModifiers);
    gridRef.current = grid;
    iotRef.current = iotSystems;
    cascadeModRef.current = cascadeModifiers;

    // Init cars on mount
    useEffect(() => {
        const g = createDefaultGrid();
        setCars(initCars(g, INITIAL_CAR_COUNT));
    }, []);

    // Recalculate metrics whenever grid, IoT, or cascade modifiers change
    useEffect(() => {
        const m = calculateMetrics(grid, iotSystems, cascadeModifiers);
        setMetrics(m);
    }, [grid, iotSystems, cascadeModifiers]);

    // ── Simulation tick loop ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isRunning) return;
        const ms = 800 / speed;

        const interval = setInterval(() => {
            setTickCount(prev => {
                const nextTick = prev + 1;

                // ── 1. Cascade event lifecycle ───────────────────────────────
                // Check if current cascade has expired
                if (activeCascade && cascadeExpiryRef.current !== null && nextTick >= cascadeExpiryRef.current) {
                    setActiveCascade(null);
                    setCascadeModifiers({});
                    cascadeExpiryRef.current = null;
                }

                // Check if a new cascade event fires at this tick
                const newEvent = pickCascadeEvent(nextTick);
                if (newEvent && !activeCascade) {
                    setActiveCascade(newEvent);
                    setCascadeModifiers(newEvent.modifiers);
                    cascadeExpiryRef.current = nextTick + newEvent.duration;
                }

                return nextTick;
            });

            // ── 2. Recalculate metrics ───────────────────────────────────────
            const m = calculateMetrics(gridRef.current, iotRef.current, cascadeModRef.current);
            setMetrics(m);

            // ── 3. Log to history for ML forecast ────────────────────────────
            setMetricHistory(hist => {
                const updated = [...hist, m].slice(-HISTORY_MAX);
                // Re-run forecast every 5 ticks (enough data)
                if (updated.length >= 3 && updated.length % 5 === 0) {
                    setForecast(forecastMetrics(updated, 5));
                }
                return updated;
            });

            // ── 4. Step cars ─────────────────────────────────────────────────
            setCars(prev => stepCars(prev, gridRef.current));

        }, ms);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, speed, activeCascade]);

    // ── Recalculate forecast when history grows outside the tick loop ────────
    useEffect(() => {
        if (metricHistory.length >= 3) {
            setForecast(forecastMetrics(metricHistory, 5));
        }
    }, [metricHistory.length]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handlePlaceTile = useCallback((row, col, type) => {
        setGrid(prev => {
            if (prev[row][col] === type) return prev;
            const g = prev.map(r => [...r]);
            g[row][col] = type;
            return g;
        });
    }, []);

    const handleToggleIoT = useCallback(key => {
        setIotSystems(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const handleReset = useCallback(() => {
        const g = createDefaultGrid();
        setGrid(g);
        setIsRunning(false);
        setTickCount(0);
        setMetricHistory([]);
        setForecast(null);
        setActiveCascade(null);
        setCascadeModifiers({});
        cascadeExpiryRef.current = null;
        setIotSystems({
            ecoMode: false,
            publicAwareness: false,
            smartTraffic: false,
            emergencyBroadcast: false,
            smartGrid: false,
            predictiveOptimization: false,
        });
        setCars(initCars(g, INITIAL_CAR_COUNT));
    }, []);

    const handleEraseAll = useCallback(() => {
        setGrid(createEmptyGrid());
        setCars([]);
        setMetricHistory([]);
        setForecast(null);
    }, []);

    const achieved = checkMandateAchieved(metrics, currentLevel);
    const nextLevel = LEVELS.find(l => l.id === currentLevelId + 1);

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden select-none">
            {showManual && <UserManual onClose={() => setShowManual(false)} />}

            <TopHUD
                metrics={metrics}
                currentLevel={currentLevel}
                isRunning={isRunning}
                tickCount={tickCount}
                onOpenManual={() => setShowManual(true)}
                forecast={forecast}
            />

            <div className="flex-1 flex min-h-0 overflow-hidden">
                <BuildToolbar selectedTool={selectedTool} onSelectTool={setSelectedTool} />
                <CityGrid
                    grid={grid}
                    onPlaceTile={handlePlaceTile}
                    selectedTool={selectedTool}
                    co2Level={metrics.co2}
                    floodRisk={metrics.floodRisk}
                    cars={cars}
                    isRunning={isRunning}
                />
                <div className="hidden md:flex">
                    <RightPanel
                        metrics={metrics}
                        iotSystems={iotSystems}
                        onToggle={handleToggleIoT}
                        currentLevel={currentLevel}
                        grid={grid}
                        activeCascade={activeCascade}
                    />
                </div>
            </div>

            <BottomBar
                isRunning={isRunning}
                onToggleRun={() => setIsRunning(r => !r)}
                onReset={handleReset}
                onEraseAll={handleEraseAll}
                speed={speed}
                onSpeedChange={setSpeed}
                currentLevelId={currentLevelId}
                onLevelChange={setCurrentLevelId}
                metrics={metrics}
                selectedTool={selectedTool}
                tickCount={tickCount}
            />

            {/* Level-up / win banners */}
            {achieved && nextLevel && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999]">
                    <div
                        className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-5"
                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                    >
                        <div>
                            <div className="text-gray-900 font-bold text-base">🎉 {currentLevel.label} Mandate Achieved!</div>
                            <div className="text-gray-400 text-xs mt-1">{currentLevel.unlocks}</div>
                        </div>
                        <button
                            onClick={() => setCurrentLevelId(nextLevel.id)}
                            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-all whitespace-nowrap shadow-sm"
                        >
                            → Advance to Level {nextLevel.id}
                        </button>
                    </div>
                </div>
            )}
            {achieved && !nextLevel && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999]">
                    <div
                        className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-xl text-center"
                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                    >
                        <div className="text-gray-900 font-bold text-base">🏆 You've mastered the Predictive Metropolis!</div>
                        <div className="text-gray-400 text-xs mt-1">All mandates complete. SmartCity fully optimized.</div>
                    </div>
                </div>
            )}
        </div>
    );
}
