import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// ── ZoningToast ───────────────────────────────────────────────────────────────
// Soft advisory toast for Korean planning soft-warnings (Rules 2 & 5).
// Matches the clean-gray aesthetic of the rest of the UI — no red alarming.
// Auto-dismisses after 6 s. Re-triggers only when warning state changes.
// ─────────────────────────────────────────────────────────────────────────────
export default function ZoningToast({ greenViolation, greenRatio, greenDeficit, farWarnings }) {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const timerRef = useRef(null);

    const hasWarning =
        greenViolation ||
        farWarnings?.residential ||
        farWarnings?.commercial ||
        farWarnings?.industrial;

    // Build warning lines
    const lines = [];
    if (greenViolation) {
        lines.push({
            key: 'green',
            primary: `Green space ${greenRatio}% — minimum 5% of residential area required`,
            sub: `Add ${greenDeficit ?? '?'} park tile${(greenDeficit ?? 2) !== 1 ? 's' : ''} · Seoul Urban Planning Ordinance`,
        });
    }
    if (farWarnings?.residential) {
        const w = farWarnings.residential;
        lines.push({
            key: 'res',
            primary: `Residential FAR ${w.currentPct ?? '>40'}% exceeds 40% limit`,
            sub: 'Diversify land use · NLPUA Art. 78',
        });
    }
    if (farWarnings?.commercial) {
        const w = farWarnings.commercial;
        lines.push({
            key: 'com',
            primary: `Commercial FAR ${w.currentPct ?? '>25'}% exceeds 25% limit`,
            sub: 'Diversify land use · NLPUA Art. 78',
        });
    }
    if (farWarnings?.industrial) {
        const w = farWarnings.industrial;
        lines.push({
            key: 'ind',
            primary: `Industrial FAR ${w.currentPct ?? '>20'}% exceeds 20% limit`,
            sub: 'Diversify land use · NLPUA Art. 78',
        });
    }

    // Show on new warnings, auto-dismiss after 6 s
    useEffect(() => {
        clearTimeout(timerRef.current);
        if (hasWarning) {
            setLeaving(false);
            setVisible(true);
            timerRef.current = setTimeout(dismiss, 6000);
        } else {
            dismiss();
        }
        return () => clearTimeout(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasWarning, greenViolation, farWarnings?.residential, farWarnings?.commercial, farWarnings?.industrial]);

    function dismiss() {
        setLeaving(true);
        setTimeout(() => { setVisible(false); setLeaving(false); }, 250);
    }

    if (!visible) return null;

    return (
        <div
            className={`absolute top-4 right-4 z-50 w-72 transition-all duration-250
                ${leaving ? 'opacity-0 translate-y-[-6px]' : 'opacity-100 translate-y-0'}`}
            style={{ transitionProperty: 'opacity, transform' }}
        >
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

                {/* Header bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="text-[9.5px] font-black text-gray-600 uppercase tracking-widest">
                            Planning Advisory
                        </span>
                    </div>
                    <button
                        onClick={dismiss}
                        className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center
                                   justify-center transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-2.5 h-2.5 text-gray-400" />
                    </button>
                </div>

                {/* Warning lines */}
                <div className="px-3.5 py-2.5 space-y-2">
                    {lines.map((line, i) => (
                        <div key={line.key}>
                            {i > 0 && <div className="border-t border-gray-100 mb-2" />}
                            <p className="text-[10px] font-semibold text-gray-700 leading-snug">
                                {line.primary}
                            </p>
                            <p className="text-[8.5px] text-gray-400 mt-0.5 leading-relaxed">
                                {line.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-3.5 pb-2.5">
                    <p className="text-[7.5px] text-gray-300 leading-relaxed">
                        Soft advisory only — placement not blocked.
                        Korean NLPUA & Seoul Urban Planning Ordinances.
                    </p>
                </div>

                {/* Auto-dismiss progress bar */}
                <div className="h-0.5 bg-gray-100">
                    <div
                        className="h-full bg-gray-300 rounded-full"
                        style={{
                            animation: 'shrink 6s linear forwards',
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to   { width: 0%;   }
                }
            `}</style>
        </div>
    );
}
