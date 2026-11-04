import { useState } from 'react';
import { useArticles } from '../../context/ArticlesContext';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import StoryEditor from '../../components/dashboard/StoryEditor';
import { bodyToText } from '../../utils/richText';
import '../../style/EditorView.css';

export default function EditorView() {
    const { articles, reviewArticle, updateArticleContent } = useArticles();
    const [editingId, setEditingId] = useState(null);

    const pending = articles.filter((a) => a.status === 'submitted');
    const decided = articles
        .filter((a) => ['published', 'changes_requested', 'rejected'].includes(a.status))
        .slice(0, 5);
    const count = (status) => articles.filter((a) => a.status === status).length;

    const editing = articles.find((a) => a.id === editingId);

    // While a story is open for editing, nothing else on the dashboard is shown.
    if (editing) {
        return (
            <StoryEditor
                key={editing.id}
                article={editing}
                onSave={updateArticleContent}
                onDecide={(id, decision, feedback, changes) => {
                    reviewArticle(id, decision, feedback, changes);
                    setEditingId(null);
                }}
                onClose={() => setEditingId(null)}
            />
        );
    }

    return (
        <>
            <div className="stats">
                <StatCard label="Waiting for review" value={pending.length} />
                <StatCard label="Published" value={count('published')} />
                <StatCard label="Changes requested" value={count('changes_requested')} />
                <StatCard label="Rejected" value={count('rejected')} />
            </div>

            <h2 className="dash__h2">Review queue</h2>
            {pending.length === 0 ? (
                <p className="empty-note">No stories are waiting. New submissions will appear here.</p>
            ) : (
                <div className="list">
                    {pending.map((a) => (
                        <article key={a.id} className="item">
                            <div className="item__top">
                                <div>
                                    <p className="item__cat">{a.category}</p>
                                    <h3 className="item__title">{a.title}</h3>
                                </div>
                                <StatusBadge status={a.status} />
                            </div>

                            <p className="item__meta">
                                <span>By {a.author}</span>
                                <span>Sent {a.date}</span>
                            </p>

                            <p className="item__body">{bodyToText(a.body).slice(0, 180)}{bodyToText(a.body).length > 180 ? '...' : ''}</p>
                            <button type="button" className="dbtn dbtn--primary" onClick={() => setEditingId(a.id)}>
                                Edit and review
                            </button>
                        </article>
                    ))}
                </div>
            )}

            <h2 className="dash__h2">Recent decisions</h2>
            {decided.length === 0 ? (
                <p className="empty-note">No decisions yet.</p>
            ) : (
                <div className="table-wrap">
                    <table className="dtable">
                        <thead>
                            <tr>
                                <th>Story</th>
                                <th>Author</th>
                                <th>Decision</th>
                            </tr>
                        </thead>
                        <tbody>
                            {decided.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.title}</td>
                                    <td>{a.author}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}