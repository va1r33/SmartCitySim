// Urban planning zoning rules — enforced on tile placement
// Based on real-world urban planning separation requirements
//
// Hard blocks (placement prevented):
//   Rule 1 — Industrial–Residential Buffer   [KR-NLPUA-76]
//   Rule 3 — Road Access for Commercial      [KR-BA-44]
//   Rule 4 — Solar Farm Glare Distance       [Seoul Solar Guidelines]
//
// Soft warnings live in SimulationEngine.jsx via getZoningCompliance()
//
// Legal sources:
//   NLPUA Art. 76  — https://elaw.klri.re.kr
//   Building Act Art. 44 — https://www.law.go.kr
//   Seoul Solar Guidelines — 서울특별시 태양광설비의 설치와 관리 등에 관한 기준 고시

import { GRID_SIZE } from './SimulationEngine';

const ADJACENT_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function getNeighbors(grid, r, c) {
    return ADJACENT_DIRS
        .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
        .filter(({ r, c }) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE)
        .map(({ r, c }) => grid[r][c]);
}

// ── NEW helper functions for additive rules ───────────────────────────
function hasRoadAdjacent(grid, r, c) {
    return ADJACENT_DIRS.some(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] === 'road';
    });
}

function hasResidentialAdjacent(grid, r, c) {
    return ADJACENT_DIRS.some(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] === 'residential';
    });
}

/**
 * Returns null if placement is valid, or a string error message if invalid.
 * Called by CityGrid on every tile placement attempt.
 */
export function checkZoningRule(grid, row, col, type) {

    // ── Road-overwrite guard ──────────────────────────────────────────────────
    const ZONE_TYPES = ['residential', 'commercial', 'industrial', 'park', 'solar', 'transit'];
    if (ZONE_TYPES.includes(type) && grid[row][col] === 'road') {
        return 'Roads are infrastructure and cannot be built over. Erase the road tile first.';
    }

    const neighbors = getNeighbors(grid, row, col);

    switch (type) {
        case 'residential':
            if (neighbors.includes('industrial')) {
                return '⛔ [KR-NLPUA-76] Residential zones cannot be placed directly adjacent to Industrial. Insert a road or park buffer tile between them.';
            }
            break;

        case 'commercial':
            if (neighbors.includes('industrial')) {
                return 'Commercial zones must be separated from Industrial tiles by a road or park buffer.';
            }
            break;

        case 'industrial':
            if (neighbors.includes('residential')) {
                return '⛔ [KR-NLPUA-76] Industrial zones cannot be placed directly adjacent to Residential. Insert a road or park buffer tile between them.';
            }
            if (neighbors.includes('commercial')) {
                return 'Industrial zones must be separated from Commercial tiles by a road or park buffer.';
            }
            break;

        case 'solar': {
            const adjacentSolar = neighbors.filter(n => n === 'solar').length;
            if (adjacentSolar >= 3) {
                return '⛔ [Seoul Solar Guidelines] Solar panels require maintenance clearance. Avoid clustering more than 2 adjacent panels.';
            }
            break;
        }

        case 'transit':
            if (!neighbors.includes('road')) {
                return 'Bus stops must be placed adjacent to a road for passenger access.';
            }
            break;

        case 'park':
        case 'road':
        case 'empty':
            break;

        default:
            break;
    }

    // ── Additive Korean law rules ─────────────────────────────────────────────

    // Rule 3 — Commercial road access (Building Act Art. 44) – hard block
    if (type === 'commercial' && !hasRoadAdjacent(grid, row, col)) {
        return '⛔ [KR-BA-44] Commercial buildings must front a road. Place a road tile adjacent first. (Building Act Art. 44)';
    }

    // Rule 4 — Solar glare separation (Seoul Solar Guidelines) – hard block
    if (type === 'solar' && hasResidentialAdjacent(grid, row, col)) {
        return '⛔ [Seoul Solar Guidelines] Solar farms require minimum separation from Residential zones to prevent glare and light pollution.';
    }

    return null;
}

/**
 * getZoningViolations — scans the entire grid for existing tiles that
 * currently violate a hard-block rule (e.g. after a neighbour was placed).
 * Returns an array of { row, col, code } objects used by CityGrid to
 * paint red overlays, and by RightPanel for the violation count.
 */
export function getZoningViolations(grid) {
    const violations = [];

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const type = grid[r][c];
            if (type === 'empty' || type === 'road') continue;

            const neighbors = getNeighbors(grid, r, c);

            // Rule 1 — Industrial ↔ Residential buffer [KR-NLPUA-76]
            if (type === 'residential' && neighbors.includes('industrial')) {
                violations.push({ row: r, col: c, code: 'KR-NLPUA-76' });
                continue;
            }
            if (type === 'industrial' && neighbors.includes('residential')) {
                violations.push({ row: r, col: c, code: 'KR-NLPUA-76' });
                continue;
            }

            // Rule 3 — Commercial must have road access [KR-BA-44]
            if (type === 'commercial' && !hasRoadAdjacent(grid, r, c)) {
                violations.push({ row: r, col: c, code: 'KR-BA-44' });
                continue;
            }

            // Rule 4 — Solar glare from residential [KR-SOLAR-GLARE]
            if (type === 'solar' && hasResidentialAdjacent(grid, r, c)) {
                violations.push({ row: r, col: c, code: 'KR-SOLAR-GLARE' });
            }
        }
    }

    return violations;
}

/**
 * getZoningComplianceSummary — convenience function used by RightPanel.
 * Returns { violationCount, violatedCodes, isFullyCompliant }
 */
export function getZoningComplianceSummary(grid) {
    const violations = getZoningViolations(grid);
    const violatedCodes = [...new Set(violations.map(v => v.code))];
    return {
        violationCount: violations.length,
        violatedCodes,
        isFullyCompliant: violations.length === 0,
    };
}
