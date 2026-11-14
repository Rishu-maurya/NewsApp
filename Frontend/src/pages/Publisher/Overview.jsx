import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublisherLayout from '../../components/publisher/PublisherLayout';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import RoleRequestsPanel from '../../components/dashboard/RoleRequestsPanel';
import { getMyArticles, getPublishQueue, publishApprovedArticle } from '../../services/publisherService';

const STATUSES = ['draft', 'submitted', 'changes_requested', 'approved', 'published', 'rejected'];

export default function Overview({ session, onLogout }) {
    const [mine, setMine] = useState([]);
    const [publishQueue, setPublishQueue] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');
    const isPublisher = session.user.role === 'publisher';

    const refresh = async () => {
        const [articles, approvedStories] = await Promise.all([
            getMyArticles(),
            isPublisher ? getPublishQueue() : Promise.resolve([]),
        ]);
        setMine(articles);
        setPublishQueue(approvedStories);
    };

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getMyArticles(),
            isPublisher ? getPublishQueue() : Promise.resolve([]),
        ])
            .then(([articles, approvedStories]) => {
                if (!cancelled) {
                    setMine(articles);
                    setPublishQueue(approvedStories);
                }
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
    }, [isPublisher]);

    const publishStory = async (id) => {
        setBusyId(id);
        setError('');
        try {
            await publishApprovedArticle(id);
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    const count = (status) => mine.filter((article) => article.status === status).length;
    const attention = mine.filter((article) => article.status === 'changes_requested');
    const recent = [...mine].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return (
        <PublisherLayout
            session={session}
            onLogout={onLogout}
            title={`Welcome, ${session.user.name}`}
            subtitle="Track your stories and see what needs your attention."
        >
            {error && <p className="derr" role="alert">{error}</p>}
            {isPublisher && <RoleRequestsPanel />}
            {loading ? (
                <p className="empty-note">Loading your stories...</p>
            ) : (
                <>
                    <div className="stats">
                        {STATUSES.map((status) => (
                            <StatCard
                                key={status}
                                label={{
                                    draft: 'Drafts',
                                    submitted: 'In review',
                                    changes_requested: 'Changes requested',
                                    approved: 'Approved for publishing',
                                    published: 'Published',
                                    rejected: 'Rejected',
                                }[status]}
                                value={count(status)}
                            />
                        ))}
                    </div>

                    {isPublisher && (
                        <>
                            <h2 className="dash__h2">Approved for publishing</h2>
                            {publishQueue.length === 0 ? (
                                <p className="empty-note">No editor-approved stories are waiting to be published.</p>
                            ) : (
                                <div className="list">
                                    {publishQueue.map((article) => (
                                        <article key={article.id} className="item">
                                            <div className="item__top">
                                                <div>
                                                    <p className="item__cat">{article.category}</p>
                                                    <h3 className="item__title">{article.title}</h3>
                                                </div>
                                                <StatusBadge status={article.status} />
                                            </div>
                                            <p className="item__meta"><span>By {article.author}</span></p>
                                            <p className="item__body">{article.body}</p>
                                            <div className="btn-row">
                                                <button
                                                    type="button"
                                                    className="dbtn dbtn--good"
                                                    onClick={() => publishStory(article.id)}
                                                    disabled={Boolean(busyId)}
                                                >
                                                    {busyId === article.id ? 'Publishing...' : 'Publish for readers'}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {mine.length === 0 ? (
                        <section className="panel" style={{ marginTop: 28 }}>
                            <p className="muted" style={{ marginTop: 0 }}>
                                You have not written any stories yet. Your first story goes to an editor for review
                                before readers can see it.
                            </p>
                            <Link to="/publisher/write" className="dbtn dbtn--primary">Write your first story</Link>
                        </section>
                    ) : (
                        <>
                            <h2 className="dash__h2">Needs your attention</h2>
                            {attention.length === 0 ? (
                                <p className="empty-note">No editor feedback is waiting. You are all caught up.</p>
                            ) : (
                                <div className="list">
                                    {attention.map((article) => (
                                        <article key={article.id} className="item">
                                            <div className="item__top">
                                                <div>
                                                    <p className="item__cat">{article.category}</p>
                                                    <h3 className="item__title">{article.title}</h3>
                                                </div>
                                                <StatusBadge status={article.status} />
                                            </div>
                                            {article.feedback && <p className="feedback">Editor feedback: {article.feedback}</p>}
                                            <Link to={`/publisher/write/${article.id}`} className="dbtn dbtn--primary">
                                                Fix and resend
                                            </Link>
                                        </article>
                                    ))}
                                </div>
                            )}

                            <h2 className="dash__h2">Recent stories</h2>
                            <div className="table-wrap">
                                <table className="dtable">
                                    <thead>
                                        <tr>
                                            <th>Story</th>
                                            <th>Status</th>
                                            <th>Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map((article) => (
                                            <tr key={article.id}>
                                                <td>{article.title}</td>
                                                <td><StatusBadge status={article.status} /></td>
                                                <td>{article.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p style={{ marginTop: 16 }}>
                                <Link to="/publisher/stories" className="dbtn">See all my stories</Link>
                            </p>
                        </>
                    )}
                </>
            )}
        </PublisherLayout>
    );
}