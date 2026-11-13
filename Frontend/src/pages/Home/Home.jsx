import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ArticleCard from '../../components/news/ArticleCard';
import LoginPrompt from '../../components/news/LoginPrompt';
import { getCategories, getPublishedArticles } from '../../services/articleService';
import { LIVE_STREAMS, startLabel } from '../../data/liveData';
import { matchesDate } from '../../utils/dateUtils';
import '../../style/Home.css';

export default function Home({ session, onLogout }) {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [params, setParams] = useSearchParams();

    const date = params.get('date') || '';
    const day = params.get('day') || 'any';

    useEffect(() => {
        let cancelled = false;
        Promise.all([getPublishedArticles(), getCategories()])
            .then(([articleList, categoryList]) => {
                if (cancelled) return;
                setArticles(articleList);
                setCategories(categoryList);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const headlines = useMemo(
        () => [...articles].sort((a, b) => Number(!!b.important) - Number(!!a.important)).slice(0, 4),
        [articles]
    );

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        const when = { range: date ? 'date' : 'all', date, weekday: day };
        return articles.filter((a) => {
            if (category !== 'All' && a.category !== category) return false;
            if (!matchesDate(a.date, when)) return false;
            if (!q) return true;
            return `${a.title} ${a.body} ${a.author}`.toLowerCase().includes(q);
        }).sort((a, b) => Number(!!b.important) - Number(!!a.important));
    }, [articles, query, category, date, day]);

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <section className="s-home-hero">
                <p className="s-eyebrow">Independent voices. Informed communities.</p>
                <h1 className="s-h1">
                    {session ? `Welcome back, ${session.user.name}.` : 'The stories shaping your day.'}
                </h1>
                <p className="s-sub">Thoughtful local reporting, reviewed by editors and made for curious readers.</p>
                <div className="s-hero-stats">
                    <div><strong>{loading ? '-' : articles.length}</strong><span>Published stories</span></div>
                    <div><strong>{loading ? '-' : categories.length}</strong><span>Categories</span></div>
                    <div><strong>{LIVE_STREAMS.length}</strong><span>Live streams</span></div>
                </div>

                {headlines.length > 0 && (
                    <aside className="s-hero__side" aria-label="Top headlines">
                        <p className="s-hero__label">Top headlines</p>
                        <ol className="s-hero__list">
                            {headlines.map((a, i) => (
                                <li key={a.id}>
                                    <Link to={`/article/${a.id}`} className={a.important ? 'is-important' : ''}>
                                        <span className="s-hero__no">{String(i + 1).padStart(2, '0')}</span>
                                        <span className="s-hero__txt">
                                            <small>{a.category}{a.important ? ' · Important' : ''}</small>
                                            <strong>{a.title}</strong>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </aside>
                )}
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

            <section className="s-toolbar" aria-label="Find stories">
                <input
                    className="s-search"
                    type="search"
                    placeholder="Search by title, topic or author"
                    aria-label="Search news"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <div className="s-chips" role="group" aria-label="Categories">
                    {['All', ...categories.map((c) => c.name)].map((c) => (
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
            </section>

            <section className="s-block s-stories">
                <h2 className="s-h2">
                    Latest stories <span className="s-pill">{loading ? '-' : results.length}</span>
                </h2>
                {results.some((a) => a.important) && (
                    <p className="s-legend">
                        <span className="s-legend__dot" aria-hidden="true" />
                        Yellow cards are the most important stories.
                    </p>
                )}
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
                        {results.map((a) => (
                            <ArticleCard
                                key={a.id}
                                article={a}
                                session={session}
                            />
                        ))}
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}