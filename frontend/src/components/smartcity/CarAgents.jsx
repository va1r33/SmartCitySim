// Agent-based car system — cars navigate along road tiles

import { getRoadTiles, buildRoadGraph, GRID_SIZE } from './SimulationEngine';

// ── colour palette ─────────────────────────────────────────────────
const CAR_COLORS = [
    '#dc2626', // red-600
    '#ef4444', // red-500
    '#b91c1c', // red-700
    '#f87171', // red-400
    '#991b1b', // red-800
    '#fca5a5', // red-300
];

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function findPath(adj, start, end, maxDepth = 80) {
    // BFS shortest path
    const startKey = `${start.r},${start.c}`;
    const endKey = `${end.r},${end.c}`;
    if (startKey === endKey) return [start];

    const visited = new Set([startKey]);
    const queue = [[start, [start]]];

    let steps = 0;
    while (queue.length && steps < maxDepth * 4) {
        steps++;
        const [node, path] = queue.shift();
        const neighbours = adj[`${node.r},${node.c}`] || [];
        for (const nb of neighbours) {
            const nk = `${nb.r},${nb.c}`;
            if (visited.has(nk)) continue;
            const newPath = [...path, nb];
            if (nk === endKey) return newPath;
            visited.add(nk);
            queue.push([nb, newPath]);
        }
    }
    return null; // unreachable
}

export function initCars(grid, count = 12) {
    const roadTiles = getRoadTiles(grid);
    if (roadTiles.length < 2) return [];

    const cars = [];
    for (let i = 0; i < count; i++) {
        const start = randomFrom(roadTiles);
        cars.push({
            id: i,
            r: start.r,
            c: start.c,
            // sub-tile interpolation for smooth movement (0–1)
            px: start.c,
            py: start.r,
            color: CAR_COLORS[i % CAR_COLORS.length],
            path: [],
            pathIndex: 0,
            waitTicks: 0,
        });
    }
    return cars;
}

export function stepCars(cars, grid) {
    const roadTiles = getRoadTiles(grid);
    if (roadTiles.length < 2) return cars;

    const adj = buildRoadGraph(grid);

    return cars.map(car => {
        let { r, c, px, py, path, pathIndex, waitTicks, color, id } = car;

        // Move along sub-tile (smooth)
        if (path.length > 0 && pathIndex < path.length) {
            const target = path[pathIndex];
            const dx = target.c - px;
            const dy = target.r - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 0.18; // tiles per tick

            if (dist < speed) {
                px = target.c;
                py = target.r;
                r = target.r;
                c = target.c;
                pathIndex++;
            } else {
                px += (dx / dist) * speed;
                py += (dy / dist) * speed;
            }
        }

        // Need new destination?
        if (pathIndex >= path.length || path.length === 0) {
            if (waitTicks > 0) {
                return { ...car, px, py, r, c, path, pathIndex, waitTicks: waitTicks - 1 };
            }

            // Pick a random road destination
            let destination = randomFrom(roadTiles);
            let attempts = 0;
            while (destination.r === r && destination.c === c && attempts < 10) {
                destination = randomFrom(roadTiles);
                attempts++;
            }

            const newPath = findPath(adj, { r, c }, destination);
            if (newPath && newPath.length > 1) {
                return { ...car, px, py, r, c, path: newPath, pathIndex: 1, waitTicks: 0 };
            } else {
                // Can't find path — teleport to random road
                const fallback = randomFrom(roadTiles);
                return { ...car, px: fallback.c, py: fallback.r, r: fallback.r, c: fallback.c, path: [], pathIndex: 0, waitTicks: 3 };
            }
        }

        return { ...car, px, py, r, c, path, pathIndex, waitTicks };
    });
}