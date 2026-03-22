import React, { useRef, useCallback, useState, useEffect } from 'react';
import { GRID_SIZE } from './SimulationEngine';

const TILE_COLORS = {
    empty: '#0f1624',
    residential: '#1d4ed8',
    commercial: '#b45309',
    industrial: '#b91c1c',
    park: '#15803d',
    road: '#374151',
    solar: '#92400e',
    transit: '#4c1d95',
};

const TILE_HIGHLIGHTS = {
    residential: '#3b82f6',
    commercial: '#f59e0b',
    industrial: '#ef4444',
    park: '#22c55e',
    road: '#6b7280',
};

function drawBuilding(ctx, x, y, ts, type) {
    // Base
    ctx.fillStyle = TILE_COLORS[type];
    ctx.fillRect(x + 0.5, y + 0.5, ts - 1, ts - 1);

    if (type === 'road') {
        // Road surface
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
        // Center dot (crossroads feel)
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(x + ts * 0.35, y + ts * 0.35, ts * 0.3, ts * 0.3);
        return;
    }

    if (type === 'park') {
        ctx.fillStyle = '#166534';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
        ctx.fillStyle = '#16a34a';
        ctx.beginPath(); ctx.arc(x + ts * 0.35, y + ts * 0.35, ts * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + ts * 0.65, y + ts * 0.55, ts * 0.15, 0, Math.PI * 2); ctx.fill();
        return;
    }

    if (type === 'solar') {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
        // Solar panel grid
        ctx.fillStyle = '#fbbf24';
        const pw = (ts - 4) / 3;
        const ph = (ts - 4) / 3;
        for (let pr = 0; pr < 3; pr++) {
            for (let pc = 0; pc < 3; pc++) {
                ctx.fillStyle = (pr + pc) % 2 === 0 ? '#fbbf2450' : '#f59e0b70';
                ctx.fillRect(x + 2 + pc * pw, y + 2 + pr * ph, pw - 1, ph - 1);
            }
        }
        return;
    }

    if (type === 'transit') {
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
        // Bus stop shelter
        ctx.fillStyle = '#a78bfa';
        ctx.fillRect(x + ts * 0.2, y + ts * 0.2, ts * 0.6, ts * 0.12);
        ctx.fillRect(x + ts * 0.2, y + ts * 0.2, ts * 0.08, ts * 0.5);
        ctx.fillRect(x + ts * 0.72, y + ts * 0.2, ts * 0.08, ts * 0.5);
        return;
    }

    if (type === 'empty') return;

    // Building highlight (top edge = light)
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x + 1, y + 1, ts - 2, 2);
    // Shadow (bottom)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 1, y + ts - 3, ts - 2, 2);

    // Windows
    const highlight = TILE_HIGHLIGHTS[type];
    ctx.fillStyle = highlight + '30';
    const winRows = Math.floor(ts / 4);
    const winCols = Math.floor(ts / 4);
    for (let wr = 1; wr < winRows; wr++) {
        for (let wc = 1; wc < winCols; wc++) {
            if (Math.random() < 0.6) {
                ctx.fillStyle = highlight + (Math.random() > 0.3 ? '60' : '18');
                ctx.fillRect(
                    x + wc * (ts / winCols) - 0.5,
                    y + wr * (ts / winRows) - 0.5,
                    ts / winCols - 1.5,
                    ts / winRows - 1.5
                );
            }
        }
    }
}

function drawCar(ctx, car, tileSize) {
    const x = car.px * tileSize;
    const y = car.py * tileSize;
    const s = Math.max(2, tileSize * 0.28);

    ctx.fillStyle = car.color;
    ctx.shadowColor = car.color;
    ctx.shadowBlur = 4;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    ctx.shadowBlur = 0;
}

export default function CityGrid({ grid, onPlaceTile, selectedTool, co2Level, floodRisk, cars, isRunning }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [canvasSize, setCanvasSize] = useState(600);
    // Cache random window state per tile so windows don't flicker
    const windowCacheRef = useRef({});

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const s = Math.min(rect.width, rect.height) - 4;
                setCanvasSize(Math.max(200, s));
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const ts = canvasSize / GRID_SIZE;

        ctx.fillStyle = '#08111e';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw tiles
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const type = grid[r][c];
                const x = c * ts;
                const y = r * ts;

                // Use cached window randomness
                const key = `${r},${c}`;
                if (!windowCacheRef.current[key] || windowCacheRef.current[key].type !== type) {
                    windowCacheRef.current[key] = { type, seed: Math.random() };
                }

                // Save context to isolate window randomness
                ctx.save();
                drawBuilding(ctx, x, y, ts, type);
                ctx.restore();
            }
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, canvasSize); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(canvasSize, i * ts); ctx.stroke();
        }

        // Cars
        if (cars && cars.length > 0) {
            for (const car of cars) drawCar(ctx, car, ts);
        }

        // Pollution fog
        if (co2Level > 35) {
            const opacity = Math.min(0.38, (co2Level - 35) / 200);
            ctx.fillStyle = `rgba(220, 50, 50, ${opacity})`;
            ctx.fillRect(0, 0, canvasSize, canvasSize);
        }

        // Flood risk overlay
        if (floodRisk > 40) {
            const opacity = Math.min(0.30, (floodRisk - 40) / 200);
            ctx.fillStyle = `rgba(96, 165, 250, ${opacity})`;
            ctx.fillRect(0, 0, canvasSize, canvasSize);
        }

    }, [grid, canvasSize, co2Level, floodRisk, cars]);

    const getTile = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasSize / rect.width;
        const scaleY = canvasSize / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const ts = canvasSize / GRID_SIZE;
        const col = Math.floor(x / ts);
        const row = Math.floor(y / ts);
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) return { row, col };
        return null;
    }, [canvasSize]);

    const handlePlace = useCallback((e) => {
        const t = getTile(e);
        if (t) onPlaceTile(t.row, t.col, selectedTool);
    }, [getTile, onPlaceTile, selectedTool]);

    const onMouseDown = (e) => { setIsDrawing(true); handlePlace(e); };
    const onMouseMove = (e) => { if (isDrawing) handlePlace(e); };
    const onMouseUp = () => setIsDrawing(false);

    const onTouchStart = (e) => { e.preventDefault(); setIsDrawing(true); const t = e.touches[0]; const tile = getTile(t); if (tile) onPlaceTile(tile.row, tile.col, selectedTool); };
    const onTouchMove = (e) => { e.preventDefault(); if (!isDrawing) return; const t = e.touches[0]; const tile = getTile(t); if (tile) onPlaceTile(tile.row, tile.col, selectedTool); };

    return (
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-1 overflow-hidden bg-[#080d18]">
            <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="rounded-lg border border-[#1e293b] cursor-crosshair"
                style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated', boxShadow: '0 0 40px rgba(0,229,204,0.04)' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onMouseUp}
            />
        </div>
    );
}