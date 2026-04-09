// Urban planning zoning rules — enforced on tile placement
// Based on real-world urban planning separation requirements

import { GRID_SIZE } from './SimulationEngine';

const ADJACENT_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function getNeighbors(grid, r, c) {
    return ADJACENT_DIRS
        .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
        .filter(({ r, c }) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE)
        .map(({ r, c }) => grid[r][c]);
}

/**
 * Returns null if placement is valid, or a string error message if invalid.
 */
export function checkZoningRule(grid, row, col, type) {

    // ── Road-overwrite guard ──────────────────────────────────────────────────
    // No zone tile may be placed on top of an existing road tile.
    // Roads are infrastructure — they must be erased explicitly before rezoning.
    const ZONE_TYPES = ['residential', 'commercial', 'industrial', 'park', 'solar', 'transit'];
    if (ZONE_TYPES.includes(type) && grid[row][col] === 'road') {
        return 'Roads are infrastructure and cannot be built over. Erase the road tile first.';
    }
    // ─────────────────────────────────────────────────────────────────────────

    const neighbors = getNeighbors(grid, row, col);

    switch (type) {
        case 'residential':
            if (neighbors.includes('industrial')) {
                return 'Residential zones must be separated from Industrial by a road or park buffer.';
            }
            break;

        case 'commercial':
            if (neighbors.includes('industrial')) {
                return 'Commercial zones must be separated from Industrial by a road or park buffer.';
            }
            break;

        case 'industrial':
            if (neighbors.includes('residential')) {
                return 'Industrial zones must be separated from Residential by a road or park buffer.';
            }
            if (neighbors.includes('commercial')) {
                return 'Industrial zones must be separated from Commercial by a road or park buffer.';
            }
            break;

        case 'solar':
            const adjacentSolar = neighbors.filter(n => n === 'solar').length;
            if (adjacentSolar >= 3) {
                return 'Solar panels need spacing for maintenance access. Avoid clustering more than 2 adjacent panels.';
            }
            break;

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

    return null; // valid
}