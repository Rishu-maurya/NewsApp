import { useEffect, useRef, useState } from 'react';
import '../../style/StatCard.css';

// Number 0 se ginti karte hue aata hai
function useCountUp(target, ms = 700) {
    const [shown, setShown] = useState(0);
    const from = useRef(0);
    useEffect(() => {
        if (typeof target !== 'number') return undefined;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { setShown(target); from.current = target; return undefined; }
        const start = performance.now();
        const begin = from.current;
        let raf;
        const step = (now) => {
            const t = Math.min(1, (now - start) / ms);
            const eased = 1 - Math.pow(1 - t, 3);
            setShown(Math.round(begin + (target - begin) * eased));
            if (t < 1) raf = requestAnimationFrame(step);
            else from.current = target;
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, ms]);
    return typeof target === 'number' ? shown : target;
}

export default function StatCard({ label, value }) {
    const shown = useCountUp(value);
    return (
        <div className="stat">
            <p className="stat__value">{shown}</p>
            <p className="stat__label">{label}</p>
        </div>
    );
}
