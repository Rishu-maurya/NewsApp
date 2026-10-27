import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ArticleCard from '../../components/news/ArticleCard';
import LoginPrompt from '../../components/news/LoginPrompt';
import { useArticles } from '../../context/ArticlesContext';
import { CATEGORIES } from '../../data/dummyData';
import { LIVE_STREAMS, startLabel } from '../../data/liveData';
import { isLive, matchesDate } from '../../utils/dateUtils';
import '../../style/Home.css';

export default function Home({ session, onLogout }) {
    const { articles } = useArticles();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [params, setParams] = useSearchParams();

    const date = params.get('date') || '';
    const day = params.get('day') || 'any';

    const published = useMemo(() => articles.filter((a) => isLive(a)), [articles]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        const when = { range: date ? 'date' : 'all', date, weekday: day };
        return published.filter((a) => {
            if (category !== 'All' && a.category !== category) return false;
            if (!matchesDate(a.date, when)) return false;
            if (!q) return true;
            return `${a.title} ${a.body} ${a.author}`.toLowerCase().includes(q);
        });
    }, [published, query, category, date, day]);

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <section className="s-home-hero">
                <p className="s-eyebrow">Independent voices. Informed communities.</p>
                <h1 className="s-h1">
                    {session ? `Welcome back, ${session.user.name}.` : 'The stories shaping your day.'}
                </h1>
                <p className="s-sub">Thoughtful local reporting, reviewed by editors and made for curious readers.</p>
            </section>

            {session ? (
                <section className="s-block">
                    <h2 className="s-h2">Live now</h2>
                    <div className="s-live-grid">
                        {LIVE_STREAMS.map((s) => (
                            <Link key={s.id} to="/live" className="s-live-card">
                                <span className="s-live-badge">LIVE</span>
                                <h3>{s.title}</h3>
                                <p className="s-muted">{s.channel} · {startLabel(s)}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : (
                <LoginPrompt message="Log in to watch live videos, save stories, like, comment and share feedback." />
            )}

            <input
                className="s-search"
                type="search"
                placeholder="Search by title, topic or author"
                aria-label="Search news"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div className="s-chips" role="group" aria-label="Categories">
                {['All', ...CATEGORIES].map((c) => (
                    <button
                        key={c}
                        type="button"
                        className="s-chip"
                        aria-pressed={category === c}
                        onClick={() => setCategory(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {results.length === 0 ? (
                <div className="s-empty">
                    <p>No stories match your search. Try another word, category or date.</p>
                    <button
                        type="button"
                        className="s-btn"
                        onClick={() => {
                            setQuery('');
                            setCategory('All');
                            setParams(new URLSearchParams());
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="s-grid">
                    {results.map((a, i) => (
                        <ArticleCard
                            key={a.id}
                            article={a}
                            session={session}
                            lead={i === 0 && results.length > 2}
                        />
                    ))}
                </div>
            )}
        </SiteLayout>
    );
}