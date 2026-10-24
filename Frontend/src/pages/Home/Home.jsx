import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ArticleCard from '../../components/news/ArticleCard';
import LoginPrompt from '../../components/news/LoginPrompt';
import { useArticles } from '../../context/ArticlesContext';
import { useActivity } from '../../context/ActivityContext';
import { CATEGORIES } from '../../data/dummyData';
import { LIVE_STREAMS } from '../../data/liveData';

export default function Home({ session, onLogout }) {
    const { articles } = useArticles();
    const { likes, comments } = useActivity();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');

    const published = useMemo(() => articles.filter((a) => a.status === 'published'), [articles]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        return published.filter((a) => {
            if (category !== 'All' && a.category !== category) return false;
            if (!q) return true;
            return `${a.title} ${a.body} ${a.author}`.toLowerCase().includes(q);
        });
    }, [published, query, category]);

    const likeCount = (id) => (likes[String(id)] || []).length;
    const commentCount = (id) => comments.filter((c) => c.targetId === String(id)).length;

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <h1 className="s-h1">
                {session ? `Welcome back, ${session.user.name}` : 'Latest news'}
            </h1>
            <p className="s-sub">Every story here has been reviewed by an editor.</p>

            {session ? (
                <section className="s-block">
                    <h2 className="s-h2">Live now</h2>
                    <div className="s-live-grid">
                        {LIVE_STREAMS.map((s) => (
                            <Link key={s.id} to="/live" className="s-live-card">
                                <span className="s-live-badge">LIVE</span>
                                <h3>{s.title}</h3>
                                <p className="s-muted">{s.channel} · {s.viewers} watching</p>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : (
                <LoginPrompt message="Log in to watch live videos, like and save stories, comment and share feedback." />
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
                    <p>No stories match your search. Try another word or category.</p>
                    <button
                        type="button"
                        className="s-btn"
                        onClick={() => {
                            setQuery('');
                            setCategory('All');
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
                            lead={i === 0 && results.length > 2}
                            likeCount={likeCount(a.id)}
                            commentCount={commentCount(a.id)}
                        />
                    ))}
                </div>
            )}
        </SiteLayout>
    );
}