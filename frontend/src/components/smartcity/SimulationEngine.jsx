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

// ── TILE METRIC CONTRIBUTIONS (for hover tooltips) ──────────────────────────
export const TILE_CONTRIBUTIONS = {
    residential: {
        label: 'Residential',
        emoji: '🏠',
        effects: [
            { metric: 'Population', delta: '+5', color: '#16a34a' },
            { metric: 'Energy', delta: '+2 MW', color: '#dc2626' },
            { metric: 'Traffic', delta: '+0.8', color: '#dc2626' },
            { metric: 'CO₂', delta: '+0.5', color: '#dc2626' },
        ],
    },
    commercial: {
        label: 'Commercial',
        emoji: '🏢',
        effects: [
            { metric: 'Energy', delta: '+3 MW', color: '#dc2626' },
            { metric: 'Traffic', delta: '+1.2', color: '#dc2626' },
            { metric: 'CO₂', delta: '+3', color: '#dc2626' },
        ],
    },
    industrial: {
        label: 'Industrial',
        emoji: '🏭',
        effects: [
            { metric: 'CO₂', delta: '+6', color: '#dc2626' },
            { metric: 'Energy', delta: '+5 MW', color: '#dc2626' },
            { metric: 'Traffic', delta: '+2×adj', color: '#dc2626' },
            { metric: 'Happiness', delta: '−2', color: '#dc2626' },
            { metric: 'Flood Risk', delta: '+2', color: '#dc2626' },
        ],
    },
    park: {
        label: 'Park',
        emoji: '🌳',
        effects: [
            { metric: 'CO₂', delta: '−5', color: '#16a34a' },
            { metric: 'Happiness', delta: '+3', color: '#16a34a' },
            { metric: 'Flood Risk', delta: '−4', color: '#16a34a' },
        ],
    },
    solar: {
        label: 'Solar Farm',
        emoji: '☀️',
        effects: [
            { metric: 'CO₂', delta: '−8', color: '#16a34a' },
            { metric: 'Energy (offset)', delta: '−4 MW', color: '#16a34a' },
            { metric: 'Flood Risk', delta: '−0.5', color: '#16a34a' },
        ],
    },
    transit: {
        label: 'Bus Stop',
        emoji: '🚌',
        effects: [
            { metric: 'Happiness', delta: '+4', color: '#16a34a' },
            { metric: 'Traffic', delta: '−2', color: '#16a34a' },
        ],
    },
    road: {
        label: 'Road',
        emoji: '🛣️',
        effects: [
            { metric: 'Traffic', delta: '+1.5', color: '#dc2626' },
            { metric: 'CO₂ (indirect)', delta: '+0.4×traffic', color: '#dc2626' },
            { metric: 'Flood Risk', delta: '+0.3', color: '#dc2626' },
        ],
    },
    empty: {
        label: 'Empty',
        emoji: '',
        effects: [],
    },
};

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

// ── RESIDENTIAL CLUSTER DENSITY PENALTY ────────────────────────────────────
// If a residential tile has 4+ adjacent residential neighbours, traffic
// grows super-linearly — forces players to think about spacing, not just count.
function getResidentialClusterPenalty(grid) {
    let penalty = 0;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] !== 'residential') continue;
            let adjRes = 0;
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] === 'residential') adjRes++;
            }
            // Penalty kicks in at 4+ adjacent residential tiles
            if (adjRes >= 4) penalty += (adjRes - 3) * 1.8;
        }
    }
    return penalty;
}

// ── METRICS ─────────────────────────────────────────────────────────────────
export function calculateMetrics(grid, iotSystems, cascadeModifiers = {}) {
    const counts = countTiles(grid);
    const indDensity = getIndustryDensity(grid);
    const resPenalty = getResidentialClusterPenalty(grid);
    const total = GRID_SIZE * GRID_SIZE;

    // --- Energy / CO₂ (Scenario 1) ---
    let trafficRaw = (
        counts.road * 1.5 +
        indDensity * 2 +
        counts.commercial * 1.2 +
        counts.residential * 0.8 +
        resPenalty                   // density penalty adds to traffic
    );
    let energyMW = counts.residential * 2 + counts.commercial * 3 + counts.industrial * 5 - counts.solar * 4;
    energyMW = Math.max(0, energyMW);
    let co2Raw = counts.industrial * 6 + trafficRaw * 0.4 - counts.park * 5 - counts.solar * 8;

    let traffic = Math.min(100, Math.max(0, (trafficRaw / (total * 1.2)) * 100));
    let co2 = Math.min(100, Math.max(0, (co2Raw / (total * 3)) * 100));
    let energy = Math.max(0, energyMW);
    let population = counts.residential * 5;

    // --- Renewable share (Scenario 1) ---
    const solarCapacity = counts.solar * 4;
    const renewableShare = Math.min(100, Math.round((solarCapacity / Math.max(1, energy)) * 100));

    // --- Happiness (Scenario 2) ---
    let happiness = 50
        + counts.park * 3
        + counts.transit * 4
        - counts.industrial * 2
        - Math.floor(traffic / 10);
    happiness = Math.min(100, Math.max(0, happiness));

    // --- Flood Risk (Scenario 3) ---
    let floodRisk = 50
        + counts.industrial * 2
        + counts.road * 0.3
        - counts.park * 4
        - counts.solar * 0.5;
    floodRisk = Math.min(100, Math.max(0, Math.round(floodRisk)));

    const estimatedDamage = Math.round((floodRisk / 100) * 50);

    // --- IoT modifiers with DIMINISHING RETURNS ---
    // Traffic Ctrl loses effectiveness when there are too many roads to manage.
    if (iotSystems.smartTraffic) {
        const roadOverload = Math.max(0, counts.road - 20);
        const diminish = Math.max(0.5, 1 - roadOverload * 0.015); // weakens up to 50% at 53+ roads
        traffic *= (0.80 * diminish + (1 - diminish));            // blended reduction
    }
    if (iotSystems.ecoMode) energy *= 0.85;
    if (iotSystems.smartGrid) energy *= 0.90;
    if (iotSystems.publicAwareness) co2 *= 0.88;
    if (iotSystems.emergencyBroadcast) floodRisk = Math.max(0, floodRisk - 20);
    if (iotSystems.predictiveOptimization) {
        traffic *= 0.92;
        energy *= 0.95;
        co2 *= 0.93;
    }

    if (iotSystems.smartTraffic) happiness = Math.min(100, happiness + 10);
    if (iotSystems.emergencyBroadcast) happiness = Math.min(100, happiness + 8);

    // --- Cascade event modifiers (temporary) ---
    if (cascadeModifiers.trafficDelta) traffic = Math.min(100, Math.max(0, traffic + cascadeModifiers.trafficDelta));
    if (cascadeModifiers.happinessDelta) happiness = Math.min(100, Math.max(0, happiness + cascadeModifiers.happinessDelta));
    if (cascadeModifiers.floodDelta) floodRisk = Math.min(100, Math.max(0, floodRisk + cascadeModifiers.floodDelta));
    if (cascadeModifiers.co2Delta) co2 = Math.min(100, Math.max(0, co2 + cascadeModifiers.co2Delta));

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

// ── CITY SCORE (0–100 composite weighted formula) ───────────────────────────
// Weighted sum across all key metrics — higher is better.
// Thesis original contribution: documented weighting rationale.
export function calcCityScore(metrics, level) {
    const scenarioId = level?.scenario ?? 1;

    // Base weights (always active)
    const co2Score = Math.max(0, 100 - metrics.co2);          // lower CO₂ = better
    const trafficScore = Math.max(0, 100 - metrics.traffic);      // lower traffic = better
    const energyScore = Math.max(0, 100 - Math.min(100, metrics.energy / 2)); // normalized
    const popScore = Math.min(100, metrics.population / 25);  // up to 2500 pop = 100

    // Scenario-specific bonus weights
    const happinessScore = scenarioId >= 2 ? metrics.happiness : 50;
    const floodScore = scenarioId >= 3 ? Math.max(0, 100 - metrics.floodRisk) : 100;
    const renewableScore = metrics.renewableShare;

    // Weights sum to 1.0
    const score =
        co2Score * 0.20 +
        trafficScore * 0.18 +
        energyScore * 0.12 +
        popScore * 0.12 +
        happinessScore * 0.16 +
        floodScore * 0.12 +
        renewableScore * 0.10;

    return Math.round(Math.max(0, Math.min(100, score)));
}

// ── FORECAST (client-side linear regression proxy) ──────────────────────────
// Uses the last N metric snapshots to extrapolate values 5 ticks ahead.
// Thesis claim: "ML prediction endpoint" — this is the visible AI layer
// until the Flask regression model is wired up.
export function forecastMetrics(history, horizon = 5) {
    if (!history || history.length < 3) return null;

    const n = Math.min(history.length, 10); // use up to last 10 snapshots
    const recent = history.slice(-n);

    const forecast = {};
    const keys = ['co2', 'traffic', 'energy', 'happiness', 'floodRisk'];

    for (const key of keys) {
        const vals = recent.map((m, i) => ({ x: i, y: m[key] ?? 0 }));
        // Least-squares linear regression
        const sumX = vals.reduce((s, p) => s + p.x, 0);
        const sumY = vals.reduce((s, p) => s + p.y, 0);
        const sumXY = vals.reduce((s, p) => s + p.x * p.y, 0);
        const sumX2 = vals.reduce((s, p) => s + p.x * p.x, 0);
        const denom = n * sumX2 - sumX * sumX;
        const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
        const intercept = (sumY - slope * sumX) / n;
        const predicted = intercept + slope * (n - 1 + horizon);
        forecast[key] = Math.round(Math.max(0, Math.min(200, predicted)));
    }

    return forecast;
}

// ── CASCADE EVENTS ──────────────────────────────────────────────────────────
// Fires at every 10th tick. Returns an event object or null.
export const CASCADE_EVENTS = [
    {
        id: 'heatwave',
        label: '🌡️ Heat Wave',
        description: 'Extreme heat spikes flood risk and energy demand for 5 ticks.',
        modifiers: { floodDelta: 10, co2Delta: 5 },
        duration: 5,
        severity: 'warning',
    },
    {
        id: 'green_initiative',
        label: '🌱 Green Initiative',
        description: 'City-wide sustainability drive boosts happiness and cuts CO₂ for 5 ticks.',
        modifiers: { happinessDelta: 8, co2Delta: -6 },
        duration: 5,
        severity: 'success',
    },
    {
        id: 'storm',
        label: '⛈️ Storm Warning',
        description: 'Heavy rain increases flood risk for 5 ticks. Parks help absorb runoff.',
        modifiers: { floodDelta: 15, happinessDelta: -5 },
        duration: 5,
        severity: 'danger',
    },
    {
        id: 'tech_summit',
        label: '🤖 Tech Summit',
        description: 'Innovation event draws visitors — traffic spikes but happiness rises.',
        modifiers: { trafficDelta: 8, happinessDelta: 10 },
        duration: 5,
        severity: 'info',
    },
    {
        id: 'power_shortage',
        label: '⚡ Power Shortage',
        description: 'Grid stress event — happiness drops until energy is stabilised.',
        modifiers: { happinessDelta: -10, co2Delta: 8 },
        duration: 5,
        severity: 'danger',
    },
    {
        id: 'clean_air_day',
        label: '💨 Clean Air Day',
        description: 'Voluntary car-free day reduces traffic and CO₂ briefly.',
        modifiers: { trafficDelta: -10, co2Delta: -8, happinessDelta: 5 },
        duration: 5,
        severity: 'success',
    },
];

export function pickCascadeEvent(tick) {
    if (tick === 0 || tick % 10 !== 0) return null;
    const idx = Math.floor((tick / 10 - 1) % CASCADE_EVENTS.length);
    return { ...CASCADE_EVENTS[idx], startTick: tick };
}

// ── CONTEXT-SENSITIVE HINTS ─────────────────────────────────────────────────
export function getContextHints(grid, metrics, level) {
    const counts = countTiles(grid);
    const hints = [];

    if (counts.residential > 0 && counts.road === 0)
        hints.push('🛣️ Residential areas generate traffic — connect them with roads first.');
    if (counts.residential >= 5 && counts.park === 0)
        hints.push('🌳 Add parks near residential zones to cut CO₂ and boost happiness.');
    if (metrics.co2 > 50 && counts.solar === 0)
        hints.push('☀️ Solar farms slash CO₂ by −8 each. Place them away from each other.');
    if (metrics.traffic > 35 && counts.transit === 0)
        hints.push('🚌 Bus stops near residential zones cut traffic and raise happiness +4 each.');
    if (metrics.floodRisk > 50 && counts.park < 3)
        hints.push('🌊 Flood risk is high — each park absorbs −4 flood risk. Build more.');
    if (counts.industrial > 0 && counts.park === 0)
        hints.push('🏭 Industrial zones raise flood risk +2 each. Buffer with parks.');
    if (counts.solar >= 2 && !level.systems.includes('ecoMode') === false)
        hints.push('🌿 Enable Eco Mode in SmartThings IoT to cut energy use by 15%.');
    if (metrics.happiness < 50)
        hints.push('😟 Happiness is low. Add parks (+3), bus stops (+4), and fewer industrial zones.');
    if (metrics.population < 50)
        hints.push('👥 Build residential zones — you need at least 50 population to pass any scenario.');
    if (counts.residential > 8 && counts.road > 20)
        hints.push('📊 Large grid detected — cluster your commercial zones near road intersections.');

    return hints.length > 0 ? hints : ['🏙️ Keep building — balance zones, roads, and green infrastructure to meet your mandate.'];
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
        description: 'CO₂ ≤ 20% · Traffic ≤ 25% · Energy ≤ 180MW · Population ≥ 800 · Happiness ≥ 85%',
        criteria: { co2: 20, traffic: 25, energy: 180, population_min: 800, happiness_min: 85 },
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
