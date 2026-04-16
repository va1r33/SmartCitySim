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
    countTiles,
    calcCityScore,
} from '../components/smartcity/SimulationEngine';
import { initCars, stepCars } from '../components/smartcity/CarAgents';
import { logData, saveGame } from '../api/smartCityClient';

const INITIAL_CAR_COUNT = 14;
const HISTORY_MAX = 40;
const AUTOSAVE_EVERY = 30;

export default function SmartCitySim({ user, token, loadedSave, onLogout, onBackToSaves }) {
    // Restore from save slot if provided
    const [grid, setGrid] = useState(() => loadedSave?.grid_state ?? createDefaultGrid());
    const [selectedTool, setSelectedTool] = useState('residential');
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [currentLevelId, setCurrentLevelId] = useState(loadedSave?.current_level ?? 1);
    const [tickCount, setTickCount] = useState(loadedSave?.tick_count ?? 0);
    const [cars, setCars] = useState([]);
    const [iotSystems, setIotSystems] = useState(loadedSave?.iot_systems ?? {
        ecoMode: false,
        publicAwareness: false,
        smartTraffic: false,
        emergencyBroadcast: false,
        smartGrid: false,
        predictiveOptimization: false,
    });
    const [metrics, setMetrics] = useState({ traffic: 0, energy: 0, co2: 0, population: 0 });
    const [showManual, setShowManual] = useState(!loadedSave); // skip manual if resuming

    // Cascade events
    const [activeCascade, setActiveCascade] = useState(null);
    const [cascadeModifiers, setCascadeModifiers] = useState({});
    const cascadeExpiryRef = useRef(null);

    // ML history and forecasts
    const [metricHistory, setMetricHistory] = useState([]);
    const [forecast, setForecast] = useState(null);
    const [mlPredictions, setMlPredictions] = useState(null);

    // Save state
    const [saveId, setSaveId] = useState(loadedSave?.id ?? null);
    const [saveStatus, setSaveStatus] = useState('');

    const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

    const gridRef = useRef(grid);
    const iotRef = useRef(iotSystems);
    const cascadeModRef = useRef(cascadeModifiers);
    gridRef.current = grid;
    iotRef.current = iotSystems;
    cascadeModRef.current = cascadeModifiers;

    // Init cars
    useEffect(() => {
        const g = loadedSave?.grid_state ?? createDefaultGrid();
        setCars(initCars(g, INITIAL_CAR_COUNT));
    }, []);

    // Recalc metrics
    useEffect(() => {
        const m = calculateMetrics(grid, iotSystems, cascadeModifiers);
        setMetrics(m);
    }, [grid, iotSystems, cascadeModifiers]);

    // Simulation tick loop
    useEffect(() => {
        if (!isRunning) return;
        const ms = 800 / speed;
        const interval = setInterval(() => {
            setTickCount(prev => {
                const nextTick = prev + 1;
                if (activeCascade && cascadeExpiryRef.current !== null && nextTick >= cascadeExpiryRef.current) {
                    setActiveCascade(null);
                    setCascadeModifiers({});
                    cascadeExpiryRef.current = null;
                }
                const newEvent = pickCascadeEvent(nextTick);
                if (newEvent && !activeCascade) {
                    setActiveCascade(newEvent);
                    setCascadeModifiers(newEvent.modifiers);
                    cascadeExpiryRef.current = nextTick + newEvent.duration;
                }
                return nextTick;
            });

            const m = calculateMetrics(gridRef.current, iotRef.current, cascadeModRef.current);
            setMetrics(m);

            setMetricHistory(hist => {
                const updated = [...hist, m].slice(-HISTORY_MAX);
                if (updated.length >= 3 && updated.length % 5 === 0) {
                    setForecast(forecastMetrics(updated, 5));
                }
                return updated;
            });

            setCars(prev => stepCars(prev, gridRef.current));
        }, ms);
        return () => clearInterval(interval);
    }, [isRunning, speed, activeCascade]);

    useEffect(() => {
        if (metricHistory.length >= 3) setForecast(forecastMetrics(metricHistory, 5));
    }, [metricHistory.length]);

    // Log data for training
    useEffect(() => {
        if (!isRunning) return;
        const counts = countTiles(grid);
        logData(tickCount, metrics, {
            residential: counts.residential,
            commercial: counts.commercial,
            industrial: counts.industrial,
            park: counts.park,
            solar: counts.solar,
            road: counts.road,
            transit: counts.transit,
        });
    }, [tickCount, metrics, grid, isRunning]);

    // Fetch ML predictions from backend (Random Forest)
    useEffect(() => {
        const fetchPredictions = async () => {
            const counts = countTiles(grid);
            try {
                const res = await fetch('http://localhost:5001/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ grid_counts: counts })
                });
                const data = await res.json();
                if (data.status === 'ok') {
                    setMlPredictions({ co2: data.co2, traffic: data.traffic });
                } else {
                    setMlPredictions(null);
                }
            } catch (err) {
                console.error('Prediction fetch failed', err);
                setMlPredictions(null);
            }
        };
        fetchPredictions();
    }, [grid]);

    // Autosave (every 30 ticks)
    useEffect(() => {
        if (!user || !token) return;
        if (tickCount === 0 || tickCount % AUTOSAVE_EVERY !== 0) return;
        handleSave();
    }, [tickCount]);

    // Handlers
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

    const handleSave = useCallback(async () => {
        if (!user || !token) return;
        setSaveStatus('saving');
        const score = calcCityScore(metrics, currentLevel);
        try {
            const res = await saveGame({
                saveId,
                name: `${user.username}'s city`,
                grid,
                currentLevelId,
                tickCount,
                cityScore: score,
                iotSystems,
            });
            if (res.save_id) setSaveId(res.save_id);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (err) {
            console.error('Save failed', err);
            setSaveStatus('');
        }
    }, [user, token, saveId, grid, currentLevelId, tickCount, iotSystems, metrics, currentLevel]);

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
                mlPredictions={mlPredictions}
                user={user}
                saveStatus={saveStatus}
                onSave={user ? handleSave : null}
                onBackToSaves={onBackToSaves}
                onLogout={onLogout}
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

            {achieved && nextLevel && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999]">
                    <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-5">
                        <div>
                            <div className="text-gray-900 font-bold text-base">🎉 {currentLevel.label} Mandate Achieved!</div>
                            <div className="text-gray-400 text-xs mt-1">{currentLevel.unlocks}</div>
                        </div>
                        <button
                            onClick={() => setCurrentLevelId(nextLevel.id)}
                            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-all"
                        >
                            → Advance to Level {nextLevel.id}
                        </button>
                    </div>
                </div>
            )}
            {achieved && !nextLevel && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999]">
                    <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-xl text-center">
                        <div className="text-gray-900 font-bold text-base">🏆 You've mastered the Predictive Metropolis!</div>
                        <div className="text-gray-400 text-xs mt-1">All mandates complete. SmartCity fully optimized.</div>
                    </div>
                </div>
            )}
        </div>
    );
}