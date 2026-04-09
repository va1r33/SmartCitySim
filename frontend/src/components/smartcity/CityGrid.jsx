import React, { useRef, useCallback, useState, useEffect } from 'react';
import { GRID_SIZE, TILE_CONTRIBUTIONS } from './SimulationEngine';
import { checkZoningRule } from './ZoningRules';

const TILE_EMOJI = {
    residential: '🏠',
    commercial: '🏢',
    industrial: '🏭',
    park: '🌳',
    solar: '☀️',
    transit: '🚌',
};

const TILE_BG = {
    empty: '#e5e7eb',
    residential: '#bfdbfe',
    commercial: '#fef3c7',
    industrial: '#fee2e2',
    park: '#bbf7d0',
    solar: '#fef9c3',
    transit: '#ede9fe',
    road: '#6b7280',
};

const TILE_BORDER = {
    residential: '#3b82f6',
    commercial: '#f59e0b',
    industrial: '#ef4444',
    park: '#22c55e',
    solar: '#eab308',
    transit: '#a855f7',
};

function drawEmpty(ctx, x, y, ts) {
    ctx.fillStyle = TILE_BG.empty;
    ctx.fillRect(x, y, ts, ts);
}

function drawRoad(ctx, x, y, ts) {
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(x, y, ts, ts);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + ts * 0.44, y + 1, ts * 0.12, ts - 2);
    ctx.fillRect(x + 1, y + ts * 0.44, ts - 2, ts * 0.12);
}

function drawZoneTile(ctx, x, y, ts, type) {
    const pad = 1;
    const r = Math.max(2, ts * 0.13);
    ctx.fillStyle = TILE_BG[type] || '#e5e7eb';
    ctx.beginPath(); ctx.roundRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2, r); ctx.fill();
    if (TILE_BORDER[type]) {
        ctx.strokeStyle = TILE_BORDER[type];
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2, r); ctx.stroke();
    }
    const emoji = TILE_EMOJI[type];
    if (emoji) {
        const fontSize = Math.max(6, ts * 0.58);
        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, x + ts * 0.5, y + ts * 0.52);
    }
}

function drawTile(ctx, x, y, ts, type) {
    if (type === 'empty') return drawEmpty(ctx, x, y, ts);
    if (type === 'road') return drawRoad(ctx, x, y, ts);
    return drawZoneTile(ctx, x, y, ts, type);
}

function drawCar(ctx, car, tileSize) {
    const x = car.px * tileSize;
    const y = car.py * tileSize;
    const s = Math.max(2, tileSize * 0.26);
    ctx.fillStyle = car.color;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.roundRect(x - s / 2, y - s / 2, s, s, s * 0.3);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ── TOOLTIP COMPONENT ────────────────────────────────────────────────────────
function TileTooltip({ tileType, position, canvasSize }) {
    if (!tileType || tileType === 'empty' || tileType === 'road') return null;
    const contrib = TILE_CONTRIBUTIONS[tileType];
    if (!contrib || contrib.effects.length === 0) return null;

    // Keep tooltip within canvas bounds
    const tooltipW = 160;
    const tooltipEstH = 28 + contrib.effects.length * 20;
    let left = position.x + 12;
    let top = position.y - tooltipEstH / 2;
    if (left + tooltipW > canvasSize) left = position.x - tooltipW - 8;
    if (top < 0) top = 4;

    return (
        <div
            className="absolute pointer-events-none z-50"
            style={{ left, top }}
        >
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-3 py-2.5 min-w-[148px]"
                style={{ fontSize: 11, lineHeight: '1.5' }}>
                <div className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
                    <span>{contrib.emoji}</span>
                    <span>{contrib.label}</span>
                </div>
                {contrib.effects.map((eff, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-0.5">
                        <span className="text-gray-400">{eff.metric}</span>
                        <span className="font-semibold tabular-nums" style={{ color: eff.color }}>{eff.delta}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function CityGrid({ grid, onPlaceTile, selectedTool, co2Level, floodRisk, cars }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [canvasSize, setCanvasSize] = useState(600);
    const [animPhase, setAnimPhase] = useState(0);
    const [violation, setViolation] = useState(null);
    const [hoveredTile, setHoveredTile] = useState(null); // { row, col, type, x, y }
    const windowCacheRef = useRef({});
    const violationTimerRef = useRef(null);

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
        let raf;
        const tick = () => {
            setAnimPhase(p => p + 0.04);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const ts = canvasSize / GRID_SIZE;

        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const type = grid[r][c];
                const x = c * ts;
                const y = r * ts;
                const key = `${r},${c}`;
                if (!windowCacheRef.current[key] || windowCacheRef.current[key].type !== type) {
                    windowCacheRef.current[key] = { type, seed: Math.random() };
                }
                ctx.save();
                drawTile(ctx, x, y, ts, type);
                ctx.restore();
            }
        }

        // Hover highlight
        if (hoveredTile) {
            const { row, col } = hoveredTile;
            const hx = col * ts;
            const hy = row * ts;
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(hx, hy, ts, ts);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(hx + 0.75, hy + 0.75, ts - 1.5, ts - 1.5);
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, canvasSize); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(canvasSize, i * ts); ctx.stroke();
        }

        if (cars && cars.length > 0) {
            for (const car of cars) drawCar(ctx, car, ts);
        }

        if (violation) {
            const vx = violation.col * ts;
            const vy = violation.row * ts;
            ctx.fillStyle = 'rgba(239,68,68,0.30)';
            ctx.fillRect(vx, vy, ts, ts);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(vx, vy, ts, ts);
        }

        if (co2Level > 35) {
            const opacity = Math.min(0.18, (co2Level - 35) / 200);
            ctx.fillStyle = `rgba(251,146,60,${opacity})`;
            ctx.fillRect(0, 0, canvasSize, canvasSize);
        }

        if (floodRisk > 40) {
            const opacity = Math.min(0.14, (floodRisk - 40) / 200);
            ctx.fillStyle = `rgba(147,197,253,${opacity})`;
            ctx.fillRect(0, 0, canvasSize, canvasSize);
        }

    }, [grid, canvasSize, co2Level, floodRisk, cars, animPhase, violation, hoveredTile]);

    const getTileFromEvent = useCallback((e) => {
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
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE)
            return { row, col, canvasX: x, canvasY: y };
        return null;
    }, [canvasSize]);

    const handlePlace = useCallback((e) => {
        const t = getTileFromEvent(e);
        if (!t) return;
        const { row, col } = t;
        const error = checkZoningRule(grid, row, col, selectedTool);
        if (error) {
            setViolation({ row, col, msg: error });
            clearTimeout(violationTimerRef.current);
            violationTimerRef.current = setTimeout(() => setViolation(null), 1800);
            return;
        }
        setViolation(null);
        onPlaceTile(row, col, selectedTool);
    }, [getTileFromEvent, onPlaceTile, selectedTool, grid]);

    const handleMouseMove = useCallback((e) => {
        if (isDrawing) handlePlace(e);
        const t = getTileFromEvent(e);
        if (t) {
            const tileType = grid[t.row][t.col];
            setHoveredTile({ row: t.row, col: t.col, type: tileType, x: t.canvasX, y: t.canvasY });
        } else {
            setHoveredTile(null);
        }
    }, [isDrawing, handlePlace, getTileFromEvent, grid]);

    const onMouseDown = (e) => { setIsDrawing(true); handlePlace(e); };
    const onMouseUp = () => setIsDrawing(false);
    const onMouseLeave = () => { setIsDrawing(false); setHoveredTile(null); };

    const onTouchStart = (e) => {
        e.preventDefault();
        setIsDrawing(true);
        const t = e.touches[0];
        const tile = getTileFromEvent(t);
        if (tile) {
            const error = checkZoningRule(grid, tile.row, tile.col, selectedTool);
            if (!error) { setViolation(null); onPlaceTile(tile.row, tile.col, selectedTool); }
            else {
                setViolation({ ...tile, msg: error });
                clearTimeout(violationTimerRef.current);
                violationTimerRef.current = setTimeout(() => setViolation(null), 1800);
            }
        }
    };
    const onTouchMove = (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const t = e.touches[0];
        const tile = getTileFromEvent(t);
        if (tile) {
            const error = checkZoningRule(grid, tile.row, tile.col, selectedTool);
            if (!error) { setViolation(null); onPlaceTile(tile.row, tile.col, selectedTool); }
        }
    };

    // Scale canvas pixel coords to container coords for tooltip positioning
    const scale = canvasRef.current
        ? canvasRef.current.getBoundingClientRect().width / canvasSize
        : 1;
    const tooltipPos = hoveredTile
        ? { x: hoveredTile.x * scale, y: hoveredTile.y * scale }
        : null;

    return (
        <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center p-3 overflow-hidden bg-gray-300 relative">
            <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="rounded-2xl border border-gray-200 cursor-crosshair"
                style={{
                    maxWidth: '100%', maxHeight: '100%',
                    imageRendering: 'pixelated',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
                onMouseDown={onMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onMouseUp}
            />

            {/* Hover tooltip */}
            {hoveredTile && tooltipPos && !isDrawing && (
                <TileTooltip
                    tileType={hoveredTile.type}
                    position={tooltipPos}
                    canvasSize={canvasRef.current?.getBoundingClientRect().width ?? canvasSize}
                />
            )}

            {/* Zoning violation toast */}
            {violation && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 max-w-[90%] text-center pointer-events-none">
                    <span>⛔</span>
                    <span>{violation.msg}</span>
                </div>
            )}
        </div>
    );
}
