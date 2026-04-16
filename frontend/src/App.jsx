import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import SaveSlotPage from './pages/SaveSlotPage';
import SmartCitySim from './pages/SmartCitySim';

// 3 screens: 'auth' → 'saves' → 'game'
export default function App() {
    const [screen, setScreen] = useState('auth');
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loadedSave, setLoadedSave] = useState(null); // save slot to resume

    // Restore session on mount
    useEffect(() => {
        const t = localStorage.getItem('scs_token');
        const u = localStorage.getItem('scs_user');
        if (t && u) {
            try {
                setToken(t);
                setUser(JSON.parse(u));
                setScreen('saves');
            } catch {
                localStorage.clear();
            }
        }
    }, []);

    const handleAuth = (u, t) => {
        if (!u) {
            // Guest mode — skip saves, go straight to game
            setUser(null);
            setToken(null);
            setLoadedSave(null);
            setScreen('game');
            return;
        }
        setUser(u);
        setToken(t);
        setScreen('saves');
    };

    const handleLoadSave = (save) => {
        setLoadedSave(save);
        setScreen('game');
    };

    const handleNewGame = () => {
        setLoadedSave(null);
        setScreen('game');
    };

    const handleLogout = () => {
        localStorage.removeItem('scs_token');
        localStorage.removeItem('scs_user');
        setUser(null);
        setToken(null);
        setLoadedSave(null);
        setScreen('auth');
    };

    const handleBackToSaves = () => {
        setScreen('saves');
    };

    if (screen === 'auth') return <AuthPage onAuth={handleAuth} />;

    if (screen === 'saves') return (
        <SaveSlotPage
            user={user}
            token={token}
            onLoad={handleLoadSave}
            onNew={handleNewGame}
            onLogout={handleLogout}
        />
    );

    return (
        <SmartCitySim
            user={user}
            token={token}
            loadedSave={loadedSave}
            onLogout={handleLogout}
            onBackToSaves={user ? handleBackToSaves : null}
        />
    );
}