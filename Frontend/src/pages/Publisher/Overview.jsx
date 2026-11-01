import { Link } from 'react-router-dom';
import PublisherLayout from '../../components/publisher/PublisherLayout';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { useArticles } from '../../context/ArticlesContext';

export default function Overview({ session, onLogout }) {
    const { articles } = useArticles();

    const mine = articles.filter((a) => a.authorEmail === session.user.email);
    const count = (status) => mine.filter((a) => a.status === status).length;
    const attention = mine.filter((a) => a.status === 'changes_requested');
    const recent = [...mine]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        .slice(0, 5);

    return (
        <PublisherLayout
            session={session}
            onLogout={onLogout}
            title={`Welcome, ${session.user.name}`}
            subtitle="Track your stories and see what needs your attention."
        >
            <div className="stats">
                <StatCard label="Drafts" value={count('draft')} />
                <StatCard label="In review" value={count('submitted')} />
                <StatCard label="Changes requested" value={count('changes_requested')} />
                <StatCard label="Published" value={count('published')} />
                <StatCard label="Rejected" value={count('rejected')} />
            </div>

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
                            {attention.map((a) => (
                                <article key={a.id} className="item">
                                    <div className="item__top">
                                        <div>
                                            <p className="item__cat">{a.category}</p>
                                            <h3 className="item__title">{a.title}</h3>
                                        </div>
                                        <StatusBadge status={a.status} />
                                    </div>
                                    <p className="feedback">Editor feedback: {a.feedback}</p>
                                    <Link to={`/publisher/write/${a.id}`} className="dbtn dbtn--primary">
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
                                {recent.map((a) => (
                                    <tr key={a.id}>
                                        <td>{a.title}</td>
                                        <td><StatusBadge status={a.status} /></td>
                                        <td>{a.date}</td>
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
        </PublisherLayout>
    );
}