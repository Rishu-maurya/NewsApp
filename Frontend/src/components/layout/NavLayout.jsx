import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WEEKDAYS, dayName, todayStr } from '../../utils/dateUtils';

export default function NavDateFilter() {
    const { pathname, search } = useLocation();
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    const params = new URLSearchParams(search);
    const onHome = pathname === '/';
    const date = onHome ? params.get('date') || '' : '';
    const day = onHome ? params.get('day') || 'any' : 'any';

    const go = (nextDate, nextDay) => {
        const p = new URLSearchParams();
        if (nextDate) p.set('date', nextDate);
        if (nextDay && nextDay !== 'any') p.set('day', nextDay);
        const q = p.toString();
        navigate(q ? `/?${q}` : '/');
    };

    const clock = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

    return (
        <div className="s-navdate">
            <span className="s-clock">
                {dayName(todayStr())}, {todayStr()} · {clock}
            </span>

            <label htmlFor="nav-date" className="s-sr">Pick a date</label>
            <input
                id="nav-date"
                type="date"
                className="s-input s-input--nav"
                value={date}
                onChange={(e) => go(e.target.value, day)}
            />

            <label htmlFor="nav-day" className="s-sr">Pick a day</label>
            <select
                id="nav-day"
                className="s-select s-select--inline s-input--nav"
                value={day}
                onChange={(e) => go(date, e.target.value)}
            >
                <option value="any">Any day</option>
                {WEEKDAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                ))}
            </select>

            {(date || day !== 'any') && (
                <button type="button" className="s-btn s-btn--small" onClick={() => navigate('/')}>
                    Clear
                </button>
            )}
        </div>
    );
}