const API_BASE = 'http://localhost:5001';

export async function logData(tick, metrics, grid_counts) {
    try {
        const res = await fetch(`${API_BASE}/log_data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tick, metrics, grid_counts })
        });
        const data = await res.json();
        if (!data.saved) console.warn('Logging failed', data);
    } catch (err) {
        console.error('Logging error:', err);
    }
}

export async function saveGame({ saveId, name, grid, currentLevelId, tickCount, cityScore, iotSystems }) {
    const token = localStorage.getItem('scs_token');
    const res = await fetch(`${API_BASE}/saves`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            save_id: saveId,
            name,
            grid,
            currentLevelId,
            tickCount,
            cityScore,
            iotSystems
        })
    });
    if (!res.ok) throw new Error('Save failed');
    return res.json();
}