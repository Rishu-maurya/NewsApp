import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PublisherLayout from '../../components/publisher/PublisherLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { STATUS_LABELS } from '../../data/dummyData';
import { deleteMyArticle, getMyArticles, submitMyArticle } from '../../services/publisherService';

const FILTERS = ['all', 'draft', 'submitted', 'changes_requested', 'published', 'rejected'];

export default function MyStories({ session, onLogout }) {
    const location = useLocation();
    const notice = location.state?.message;
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        let cancelled = false;
        getMyArticles()
            .then((result) => {
                if (!cancelled) setArticles(result);
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

    const mine = articles;
    const shown = filter === 'all' ? mine : mine.filter((a) => a.status === filter);
    const countFor = (f) => (f === 'all' ? mine.length : mine.filter((a) => a.status === f).length);

    const updateStory = async (article, action) => {
        setBusyId(article.id);
        setError('');
        try {
            if (action === 'submit') {
                const updated = await submitMyArticle(article.id);
                setArticles((current) => current.map((item) => item.id === article.id ? updated : item));
            } else {
                await deleteMyArticle(article.id);
                setArticles((current) => current.filter((item) => item.id !== article.id));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    return (
        <PublisherLayout
            session={session}
            onLogout={onLogout}
            title="My stories"
            subtitle="Everything you have written, with its review status."
        >
            {notice && <p className="dnote" role="status">{notice}</p>}
            {error && <p className="derr" role="alert">{error}</p>}

            {!loading && !error && (
            <div className="pub-chips" role="group" aria-label="Filter by status">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        type="button"
                        className="pub-chip"
                        aria-pressed={filter === f}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : STATUS_LABELS[f]} ({countFor(f)})
                    </button>
                ))}
            </div>
            )}

            {loading ? (
                <p className="empty-note">Loading your stories...</p>
            ) : shown.length === 0 ? (
                <div className="panel">
                    <p className="muted" style={{ marginTop: 0 }}>
                        {mine.length === 0
                            ? 'You have not written any stories yet.'
                            : 'No stories with this status.'}
                    </p>
                    <Link to="/publisher/write" className="dbtn dbtn--primary">Write a story</Link>
                </div>
            ) : (
                <div className="list">
                    {shown.map((a) => {
                        const canEdit = a.status === 'draft' || a.status === 'changes_requested';
                        const canDelete = a.status === 'draft' || a.status === 'rejected';

                        return (
                            <article key={a.id} className="item">
                                <div className="item__top">
                                    <div>
                                        <p className="item__cat">{a.category}</p>
                                        <h3 className="item__title">{a.title}</h3>
                                    </div>
                                    <StatusBadge status={a.status} />
                                </div>

                                <p className="item__meta">
                                    <span>Updated {a.date}</span>
                                </p>

                                {a.feedback && <p className="feedback">Editor feedback: {a.feedback}</p>}

                                <div className="btn-row">
                                    {canEdit && (
                                        <Link to={`/publisher/write/${a.id}`} className="dbtn">Edit</Link>
                                    )}
                                    {canEdit && (
                                        <button
                                            type="button"
                                            className="dbtn dbtn--primary"
                                            onClick={() => updateStory(a, 'submit')}
                                            disabled={Boolean(busyId)}
                                        >
                                            {busyId === a.id ? 'Sending...' : 'Send for review'}
                                        </button>
                                    )}
                                    {a.status === 'published' && (
                                        <Link to={`/article/${a.id}`} className="dbtn">View on site</Link>
                                    )}
                                    {canDelete && (
                                        <button
                                            type="button"
                                            className="dbtn dbtn--danger"
                                            onClick={() => updateStory(a, 'delete')}
                                            disabled={Boolean(busyId)}
                                        >
                                            {busyId === a.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </PublisherLayout>
    );
}