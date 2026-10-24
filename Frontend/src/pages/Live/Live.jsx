import { useState } from 'react';
import SiteLayout from '../../components/layout/SiteLayout';
import LoginPrompt from '../../components/news/LoginPrompt';
import CommentSection from '../../components/news/CommentSection';
import { LIVE_STREAMS } from '../../data/liveData';

export default function Live({ session, onLogout }) {
    const [activeId, setActiveId] = useState(LIVE_STREAMS[0].id);
    const active = LIVE_STREAMS.find((s) => s.id === activeId);

    if (!session) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Live videos</h1>
                <p className="s-sub">Watch live coverage from our newsroom.</p>
                <LoginPrompt message="Log in to watch live videos and join the live chat." />
                <div className="s-live-grid s-locked">
                    {LIVE_STREAMS.map((s) => (
                        <div key={s.id} className="s-live-card">
                            <span className="s-live-badge">LIVE</span>
                            <h3>{s.title}</h3>
                            <p className="s-muted">{s.channel}</p>
                        </div>
                    ))}
                </div>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <h1 className="s-h1">Live videos</h1>
            <p className="s-sub">Pick a stream and join the chat.</p>

            {active.embedUrl ? (
                <iframe className="s-player" src={active.embedUrl} title={active.title} allowFullScreen />
            ) : (
                <div className="s-player s-player--demo">
                    <span className="s-live-badge">LIVE</span>
                    <p className="s-player__title">{active.title}</p>
                    <p className="s-player__note">
                        Demo stream. Add a video link in src/data/liveData.js to play real video.
                    </p>
                </div>
            )}

            <h2 className="s-h2">{active.title}</h2>
            <p className="s-muted">{active.channel} · {active.viewers} watching</p>
            <p>{active.description}</p>

            <div className="s-chips" role="group" aria-label="Choose a stream">
                {LIVE_STREAMS.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className="s-chip"
                        aria-pressed={activeId === s.id}
                        onClick={() => setActiveId(s.id)}
                    >
                        {s.category}
                    </button>
                ))}
            </div>

            <CommentSection targetId={active.id} session={session} heading="Live chat" />
        </SiteLayout>
    );
}