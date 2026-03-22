import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopHUD from '../components/smartcity/TopHUD';
import BuildToolbar from '../components/smartcity/BuildToolbar';
import CityGrid from '../components/smartcity/CityGrid';
import RightPanel from '../components/smartcity/RightPanel';
import BottomBar from '../components/smartcity/BottomBar';
import {
    createDefaultGrid,
    createEmptyGrid,
    calculateMetrics,
    LEVELS,
    checkMandateAchieved,
    countTiles,
} from '../components/smartcity/SimulationEngine';
import { initCars, stepCars } from '../components/smartcity/CarAgents';
import { simulateCity } from '../api/smartCityClient';   // <-- our API client

const INITIAL_CAR_COUNT = 14;

export default function SmartCitySim() {
    const [grid, setGrid] = useState(() => createDefaultGrid());
    const [selectedTool, setSelectedTool] = useState('residential');
    const [speed] = useState(1);          // speed not used in car loop – we can keep it for future
    const [currentLevelId, setCurrentLevelId] = useState(1);
    const [cars, setCars] = useState([]);
    const [iotSystems, setIotSystems] = useState({
        ecoMode: false,
        publicAwareness: false,
        smartTraffic: false,
        emergencyBroadcast: false,
        smartGrid: false,
        predictiveOptimization: false,
    });

    // Initial metrics with all fields from SimulationEngine
    const [metrics, setMetrics] = useState({
        traffic: 0,
        energy: 0,
        co2: 0,
        population: 0,
        renewableShare: 0,
        happiness: 0,
        floodRisk: 0,
        estimatedDamage: 0,
    });

    const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

    const gridRef = useRef(grid);
    const iotRef = useRef(iotSystems);
    gridRef.current = grid;
    iotRef.current = iotSystems;

    // Init cars on mount
    useEffect(() => {
        const g = createDefaultGrid();
        setCars(initCars(g, INITIAL_CAR_COUNT));
    }, []);

    // Update metrics when grid or IoT changes (local preview)
    useEffect(() => {
        setMetrics(calculateMetrics(grid, iotSystems));
    }, [grid, iotSystems]);

    // Car animation loop (independent of "Run")
    useEffect(() => {
        const interval = setInterval(() => {
            setCars(prev => stepCars(prev, gridRef.current));
        }, 800 / speed);   // adjust speed as needed (default 1 → 800ms)
        return () => clearInterval(interval);
    }, [speed]);

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
    }, []);

    // API call – triggered by the "Run" button
    const runSimulation = useCallback(async () => {
        const counts = countTiles(grid);
        const layout = {
            layout: "player_city",
            buildings: [
                { type: "residential", count: counts.residential },
                { type: "commercial", count: counts.commercial },
                { type: "industrial", count: counts.industrial },
                { type: "park", count: counts.park },
                { type: "road", count: counts.road },
                { type: "solar", count: counts.solar || 0 },
                { type: "transit", count: counts.transit || 0 }
            ],
            smartthings_mode: Object.keys(iotSystems).filter(k => iotSystems[k])[0] || ""
        };
        try {
            const result = await simulateCity(layout);
            setMetrics(prev => ({ ...prev, ...result }));
        } catch (err) {
            console.error("Simulation failed", err);
        }
    }, [grid, iotSystems]);

    const achieved = checkMandateAchieved(metrics, currentLevel);
    const nextLevel = LEVELS.find(l => l.id === currentLevelId + 1);

    return (
        <div className="h-screen w-screen flex flex-col bg-[#080d18] text-white overflow-hidden select-none">
            <TopHUD
                metrics={metrics}
                currentLevel={currentLevel}
                isRunning={false}           // we no longer have a running state – can be removed from TopHUD if desired
                tickCount={0}               // we don't use tick count anymore
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
                    isRunning={false}
                />
                <div className="hidden md:flex">
                    <RightPanel
                        metrics={metrics}
                        iotSystems={iotSystems}
                        onToggle={handleToggleIoT}
                        currentLevel={currentLevel}
                        grid={grid}
                    />
                </div>
            </div>

            <BottomBar
                onRun={runSimulation}                 // new prop – Run button triggers API
                onReset={handleReset}
                onEraseAll={handleEraseAll}
                speed={speed}
                onSpeedChange={() => { }}              // speed is now fixed; you can implement later
                currentLevelId={currentLevelId}
                onLevelChange={setCurrentLevelId}
                metrics={metrics}
                selectedTool={selectedTool}
            />

            {achieved && nextLevel && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999]">
                    <div className="bg-[#0d1424] border-2 border-teal-400/70 rounded-xl px-6 py-4 shadow-2xl flex items-center gap-5 animate-pulse"
                        style={{ boxShadow: '0 0 40px rgba(20,184,166,0.4)' }}>
                        <div>
                            <div className="text-teal-400 font-bold text-base">🎉 {currentLevel.label} Mandate Achieved!</div>
                            <div className="text-slate-300 text-xs mt-1">{currentLevel.unlocks}</div>
                        </div>
                        <button
                            onClick={() => setCurrentLevelId(nextLevel.id)}
                            className="px-5 py-2.5 bg-teal-500/30 border border-teal-400 text-teal-300 text-sm font-bold rounded-lg hover:bg-teal-500/50 transition-all whitespace-nowrap"
                        >
                            → Advance to Level {nextLevel.id}
                        </button>
                    </div>
                </div>
            )}
            {achieved && !nextLevel && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999]">
                    <div className="bg-[#0d1424] border-2 border-yellow-400/70 rounded-xl px-6 py-4 shadow-2xl text-center"
                        style={{ boxShadow: '0 0 40px rgba(234,179,8,0.4)' }}>
                        <div className="text-yellow-400 font-bold text-base">🏆 You've mastered the Predictive Metropolis!</div>
                        <div className="text-slate-300 text-xs mt-1">All mandates complete. SmartCity fully optimized.</div>
                    </div>
                </div>
            )}
        </div>
    );
}