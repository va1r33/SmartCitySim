// Core simulation logic - pure functions, no React

export const TILE_TYPES = {
    empty: { label: 'Empty', color: '#1a1f2e', emoji: '' },
    residential: { label: 'Residential', color: '#3b82f6', emoji: '🏠' },
    commercial: { label: 'Commercial', color: '#f59e0b', emoji: '🏢' },
    industrial: { label: 'Industrial', color: '#ef4444', emoji: '🏭' },
    park: { label: 'Park', color: '#22c55e', emoji: '🌳' },
    road: { label: 'Road', color: '#64748b', emoji: '🛣️' },
    solar: { label: 'Solar Farm', color: '#fbbf24', emoji: '☀️' },
    transit: { label: 'Bus Stop', color: '#a78bfa', emoji: '🚌' },
};

export const GRID_SIZE = 40;

// ── DEFAULT CITY TEMPLATE ───────────────────────────────────────────────────
export function createDefaultGrid() {
    const g = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'));
    const midR = Math.floor(GRID_SIZE / 2);
    const midC = Math.floor(GRID_SIZE / 2);

    for (let c = midC - 8; c <= midC + 8; c++) g[midR][c] = 'road';
    for (let r = midR - 8; r <= midR + 8; r++) g[r][midC] = 'road';

    const res = [
        [midR - 2, midC + 2], [midR - 3, midC + 2], [midR - 2, midC + 3],
        [midR + 2, midC - 2], [midR + 3, midC - 2], [midR + 2, midC - 3],
        [midR - 2, midC - 2], [midR - 3, midC - 3],
    ];
    for (const [r, c] of res) g[r][c] = 'residential';

    g[midR + 2][midC + 2] = 'park';
    g[midR + 3][midC + 2] = 'park';

    return g;
}

export function createEmptyGrid() {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'));
}

// ── TILE COUNTING ───────────────────────────────────────────────────────────
export function countTiles(grid) {
    const counts = { empty: 0, residential: 0, commercial: 0, industrial: 0, park: 0, road: 0, solar: 0, transit: 0 };
    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++) {
            const t = grid[r][c];
            if (counts[t] !== undefined) counts[t]++;
            else counts[t] = 1;
        }
    return counts;
}

function getIndustryDensity(grid) {
    let density = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === 'industrial') {
                let adj = 0;
                if (r > 0 && grid[r - 1][c] === 'industrial') adj++;
                if (r < GRID_SIZE - 1 && grid[r + 1][c] === 'industrial') adj++;
                if (c > 0 && grid[r][c - 1] === 'industrial') adj++;
                if (c < GRID_SIZE - 1 && grid[r][c + 1] === 'industrial') adj++;
                density += adj;
            }
        }
    }
    return density;
}

// ── METRICS ─────────────────────────────────────────────────────────────────
export function calculateMetrics(grid, iotSystems) {
    const counts = countTiles(grid);
    const indDensity = getIndustryDensity(grid);
    const total = GRID_SIZE * GRID_SIZE;

    // --- Energy / CO₂ (Scenario 1) ---
    let trafficRaw = (counts.road * 1.5 + indDensity * 2 + counts.commercial * 1.2 + counts.residential * 0.8);
    let energyMW = counts.residential * 2 + counts.commercial * 3 + counts.industrial * 5;
    let co2Raw = counts.industrial * 6 + trafficRaw * 0.4 - counts.park * 5 - counts.solar * 8;

    let traffic = Math.min(100, Math.max(0, (trafficRaw / (total * 1.2)) * 100));
    let co2 = Math.min(100, Math.max(0, (co2Raw / (total * 3)) * 100));
    let energy = Math.max(0, energyMW);
    let population = counts.residential * 5;

    // --- Renewable share (Scenario 1) ---
    const solarCapacity = counts.solar * 4; // MW per solar tile
    const renewableShare = Math.min(100, Math.round((solarCapacity / Math.max(1, energy)) * 100));

    // --- Happiness (Scenario 2) ---
    // Parks + transit improve happiness; industrial + high traffic hurts it
    let happiness = 50
        + counts.park * 3
        + counts.transit * 4
        - counts.industrial * 2
        - Math.floor(traffic / 10);
    happiness = Math.min(100, Math.max(0, happiness));

    // --- Flood Risk (Scenario 3) ---
    // Parks absorb water; industrial + road increase runoff; low-lying residential hurts
    let floodRisk = 50
        + counts.industrial * 2
        + counts.road * 0.3
        - counts.park * 4
        - counts.solar * 0.5;
    floodRisk = Math.min(100, Math.max(0, Math.round(floodRisk)));

    // Estimated damage (Scenario 3)
    const estimatedDamage = Math.round((floodRisk / 100) * 50); // up to $50M

    // --- IoT modifiers ---
    if (iotSystems.smartTraffic) traffic *= 0.80;
    if (iotSystems.ecoMode) energy *= 0.85;
    if (iotSystems.smartGrid) energy *= 0.90;
    if (iotSystems.publicAwareness) co2 *= 0.88;
    if (iotSystems.emergencyBroadcast) floodRisk = Math.max(0, floodRisk - 20);
    if (iotSystems.predictiveOptimization) {
        traffic *= 0.92;
        energy *= 0.95;
        co2 *= 0.93;
    }

    // Happiness also responds to IoT
    if (iotSystems.smartTraffic) happiness = Math.min(100, happiness + 10);
    if (iotSystems.emergencyBroadcast) happiness = Math.min(100, happiness + 8);

    return {
        traffic: Math.round(traffic),
        energy: Math.round(energy),
        co2: Math.round(co2),
        population: Math.round(population),
        renewableShare,
        happiness: Math.round(happiness),
        floodRisk: Math.round(floodRisk),
        estimatedDamage,
    };
}

// ── ROAD GRAPH for car agents ───────────────────────────────────────────────
export function buildRoadGraph(grid) {
    const adj = {};
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] !== 'road') continue;
            const key = `${r},${c}`;
            adj[key] = [];
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] === 'road') {
                    adj[key].push({ r: nr, c: nc });
                }
            }
        }
    }
    return adj;
}

export function getRoadTiles(grid) {
    const tiles = [];
    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
            if (grid[r][c] === 'road') tiles.push({ r, c });
    return tiles;
}

// ── LEVEL PROGRESSION ───────────────────────────────────────────────────────
export const LEVELS = [
    {
        id: 1,
        label: 'Beginner',
        scenario: 1,
        title: '🌿 Scenario 1: The Green Mandate',
        description: 'Reduce CO₂ ≤ 60% · Traffic ≤ 40% · Energy ≤ 100MW. Build Solar Farms & activate Eco-Mode.',
        criteria: { co2: 60, traffic: 40, energy: 100 },
        systems: ['ecoMode', 'publicAwareness'],
        unlocks: 'Scenario 2 — Commuter Crisis unlocked',
        tip: 'Add Solar Farms (☀️) and enable Eco-Mode to cut coal emissions.',
    },
    {
        id: 2,
        label: 'Intermediate',
        scenario: 2,
        title: '🚌 Scenario 2: The Commuter Crisis',
        description: 'Traffic ≤ 30% · Citizen Happiness ≥ 70% · Population ≥ 500. Add Bus Stops & Smart Traffic.',
        criteria: { traffic: 30, happiness_min: 70, population_min: 500 },
        systems: ['smartTraffic', 'ecoMode', 'publicAwareness'],
        unlocks: 'Scenario 3 — Resilient City unlocked',
        tip: 'Place Bus Stops (🚌) near residential areas and enable Smart Traffic to reduce gridlock.',
    },
    {
        id: 3,
        label: 'Advanced',
        scenario: 3,
        title: '🌊 Scenario 3: The Resilient City',
        description: 'Flood Risk ≤ 40% · Happiness ≥ 75% · Estimated Damage ≤ $20M. Build Parks in flood zones.',
        criteria: { floodRisk: 40, happiness_min: 75, estimatedDamage: 20 },
        systems: ['smartTraffic', 'ecoMode', 'publicAwareness', 'emergencyBroadcast', 'smartGrid'],
        unlocks: 'Expert — Predictive Metropolis',
        tip: 'Parks (🌳) act as water sponges. Send Emergency Broadcast to cut flood damage.',
    },
    {
        id: 4,
        label: 'Expert',
        scenario: 4,
        title: '🌐 Predictive Metropolis',
        description: 'CO₂ ≤ 15% · Traffic ≤ 12% · Energy ≤ 40MW · Population ≥ 2000 · Happiness ≥ 85%',
        criteria: { co2: 15, traffic: 12, energy: 40, population_min: 2000, happiness_min: 85 },
        systems: ['smartTraffic', 'ecoMode', 'publicAwareness', 'emergencyBroadcast', 'smartGrid', 'predictiveOptimization'],
        unlocks: null,
        tip: 'Enable Predictive Optimization and balance all city systems for the ultimate smart city.',
    },
];

export function checkMandateAchieved(metrics, level) {
    const c = level.criteria;
    if (c.co2 !== undefined && metrics.co2 > c.co2) return false;
    if (c.traffic !== undefined && metrics.traffic > c.traffic) return false;
    if (c.energy !== undefined && metrics.energy > c.energy) return false;
    if (c.floodRisk !== undefined && metrics.floodRisk > c.floodRisk) return false;
    if (c.estimatedDamage !== undefined && metrics.estimatedDamage > c.estimatedDamage) return false;
    if (c.population_min !== undefined && metrics.population < c.population_min) return false;
    if (c.happiness_min !== undefined && metrics.happiness < c.happiness_min) return false;
    if (metrics.population < 50) return false;
    return true;
}

export function getMandateProgress(metrics, level) {
    const c = level.criteria;
    const items = [];
    if (c.co2 !== undefined) items.push({ label: 'CO₂', value: metrics.co2, target: c.co2, unit: '%', ok: metrics.co2 <= c.co2 });
    if (c.traffic !== undefined) items.push({ label: 'Traffic', value: metrics.traffic, target: c.traffic, unit: '%', ok: metrics.traffic <= c.traffic });
    if (c.energy !== undefined) items.push({ label: 'Energy', value: metrics.energy, target: c.energy, unit: 'MW', ok: metrics.energy <= c.energy });
    if (c.floodRisk !== undefined) items.push({ label: 'Flood Risk', value: metrics.floodRisk, target: c.floodRisk, unit: '%', ok: metrics.floodRisk <= c.floodRisk });
    if (c.estimatedDamage !== undefined) items.push({ label: 'Est. Damage', value: metrics.estimatedDamage, target: c.estimatedDamage, unit: 'M$', ok: metrics.estimatedDamage <= c.estimatedDamage });
    if (c.population_min !== undefined) items.push({ label: 'Population', value: metrics.population, target: c.population_min, unit: '', ok: metrics.population >= c.population_min, reverse: true });
    if (c.happiness_min !== undefined) items.push({ label: 'Happiness', value: metrics.happiness, target: c.happiness_min, unit: '%', ok: metrics.happiness >= c.happiness_min, reverse: true });
    return items;
}

export const IOT_SYSTEMS = {
    ecoMode: { label: 'Eco Mode', effect: 'Energy −15%', requiredLevel: 1 },
    publicAwareness: { label: 'Public Campaign', effect: 'CO₂ −12%', requiredLevel: 1 },
    smartTraffic: { label: 'Traffic Ctrl', effect: 'Traffic −20%', requiredLevel: 2 },
    emergencyBroadcast: { label: 'Emergency Alert', effect: 'Flood Risk −20pts', requiredLevel: 3 },
    smartGrid: { label: 'Smart Energy Grid', effect: 'Energy −10%', requiredLevel: 3 },
    predictiveOptimization: { label: 'Predictive Optim.', effect: 'All metrics −8%', requiredLevel: 4 },
};