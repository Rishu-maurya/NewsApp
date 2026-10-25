import { useState } from 'react';
import SiteLayout from '../../components/layout/SiteLayout';
import LoginPrompt from '../../components/news/LoginPrompt';
import CommentSection from '../../components/news/CommentSection';
import { LIVE_STREAMS, getStatus, startLabel } from '../../data/liveData';

const BADGE = { live: 'LIVE', upcoming: 'UPCOMING', ended: 'ENDED' };

export default function Live({ session, onLogout }) {
    const [activeId, setActiveId] = useState(LIVE_STREAMS[0].id);
    const [day, setDay] = useState('');

    const list = LIVE_STREAMS.filter((s) => !day || s.startsAt.slice(0, 10) === day);
    const active = LIVE_STREAMS.find((s) => s.id === activeId);
    const status = getStatus(active);

    if (!session) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Live videos</h1>
                <p className="s-sub">Watch live coverage from our newsroom.</p>
                <LoginPrompt message="Log in to watch live videos and join the live chat." />
                <div className="s-live-grid s-locked">
                    {LIVE_STREAMS.map((s) => (
                        <div key={s.id} className="s-live-card">
                            <span className="s-live-badge">{BADGE[getStatus(s)]}</span>
                            <h3>{s.title}</h3>
                            <p className="s-muted">{s.channel} · {startLabel(s)}</p>
                        </div>
                    ))}
                </div>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <h1 className="s-h1">Live videos</h1>
            <p className="s-sub">Pick a date, choose a stream and join the chat.</p>

            <div className="s-row">
                <div>
                    <label htmlFor="live-date" className="s-label">Show streams on</label>
                    <input
                        id="live-date"
                        type="date"
                        className="s-input"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                    />
                </div>
                {day && (
                    <button type="button" className="s-btn" onClick={() => setDay('')}>
                        All dates
                    </button>
                )}
            </div>

            {list.length === 0 ? (
                <p className="s-muted">No streams scheduled on this date.</p>
            ) : (
                <div className="s-live-grid s-block">
                    {list.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            className="s-live-card s-live-pick"
                            aria-pressed={activeId === s.id}
                            onClick={() => setActiveId(s.id)}
                        >
                            <span className="s-live-badge">{BADGE[getStatus(s)]}</span>
                            <h3>{s.title}</h3>
                            <p className="s-muted">{startLabel(s)}</p>
                        </button>
                    ))}
                </div>
            )}

            {status === 'live' && active.embedUrl ? (
                <iframe className="s-player" src={active.embedUrl} title={active.title} allowFullScreen />
            ) : (
                <div className="s-player s-player--demo">
                    <span className="s-live-badge">{BADGE[status]}</span>
                    <p className="s-player__title">{active.title}</p>
                    <p className="s-player__note">
                        {status === 'upcoming' && `Starts ${startLabel(active)}.`}
                        {status === 'ended' && 'This stream has ended.'}
                        {status === 'live' && 'Demo stream. Add a video link in src/data/liveData.js to play real video.'}
                    </p>
                </div>
            )}

            <h2 className="s-h2">{active.title}</h2>
            <p className="s-muted">
                {active.channel} · {startLabel(active)}
                {status === 'live' && ` · ${active.viewers} watching`}
            </p>
            <p>{active.description}</p>

            <CommentSection targetId={active.id} session={session} heading="Live chat" />
        </SiteLayout>
    );
}