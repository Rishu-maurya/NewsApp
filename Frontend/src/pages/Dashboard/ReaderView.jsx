import { useState } from 'react';
import { useArticles } from '../../context/ArticlesContext';
import StatCard from '../../components/dashboard/StatCard';
import '../../style/ReaderView.css';

export default function ReaderView() {
    const { articles } = useArticles();
    const [openId, setOpenId] = useState(null);
    const published = articles.filter((a) => a.status === 'published');

    return (
        <>
            <div className="stats">
                <StatCard label="Published stories" value={published.length} />
                <StatCard label="Categories" value={new Set(published.map((a) => a.category)).size} />
            </div>

            <h2 className="dash__h2">Latest news</h2>

            {published.length === 0 ? (
                <p className="empty-note">No stories are published yet. Check back soon.</p>
            ) : (
                <div className="list">
                    {published.map((a) => (
                        <article key={a.id} className="item">
                            <p className="item__cat">{a.category}</p>
                            <h3 className="item__title">{a.title}</h3>
                            <p className="item__meta">
                                <span>{a.author}</span>
                                <span>{a.date}</span>
                            </p>
                            <p className="item__body">
                                {openId === a.id || a.body.length < 110 ? a.body : `${a.body.slice(0, 110)}...`}
                            </p>
                            {a.body.length >= 110 && (
                                <button
                                    type="button"
                                    className="dbtn"
                                    onClick={() => setOpenId(openId === a.id ? null : a.id)}
                                >
                                    {openId === a.id ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}