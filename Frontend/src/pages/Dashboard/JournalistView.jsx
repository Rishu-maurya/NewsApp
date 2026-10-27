import { useState } from 'react';
import { useArticles } from '../../context/ArticlesContext';
import { CATEGORIES } from '../../data/dummyData';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { todayStr } from '../../utils/dateUtils';
import '../../style/JournalistView.css';

const EMPTY = { id: null, title: '', category: CATEGORIES[0], body: '', publishDate: '', publishTime: '' };
export default function JournalistView({ session }) {
    const { articles, saveArticle, submitArticle, deleteArticle } = useArticles();
    const { name, email } = session.user;

    const mine = articles.filter((a) => a.authorEmail === email);
    const count = (status) => mine.filter((a) => a.status === status).length;

    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
        setMessage('');
    };

    const save = (status) => {
        if (!form.title.trim()) return setError('Enter a title for the story.');
        if (form.publishTime && !form.publishDate) {
            return setError('Choose a publish date along with the time.');
        }
        if (form.publishDate && form.publishDate < todayStr()) {
            return setError('Publish date cannot be in the past.');
        }
        if (status === 'submitted' && form.body.trim().length < 30) {
            return setError('Write at least 30 characters before sending for review.');
        }
        saveArticle({
            ...form,
            title: form.title.trim(),
            status,
            author: name,
            authorEmail: email,
        });
        setForm(EMPTY);
        setMessage(status === 'submitted' ? 'Story sent to the editor for review.' : 'Draft saved.');
    };

    const startEdit = (a) => {
        setForm({
            id: a.id,
            title: a.title,
            category: a.category,
            body: a.body,
            publishDate: a.publishDate,
            publishTime: a.publishTime
        });
        setError('');
        setMessage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <div className="stats">
                <StatCard label="Drafts" value={count('draft')} />
                <StatCard label="In review" value={count('submitted')} />
                <StatCard label="Changes requested" value={count('changes_requested')} />
                <StatCard label="Published" value={count('published')} />
            </div>

            <h2 className="dash__h2">{form.id ? 'Edit story' : 'Write a story'}</h2>
            <section className="panel">
                {message && <p className="dnote" role="status">{message}</p>}
                {error && <p className="derr" role="alert">{error}</p>}

                <div className="dfield">
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Write a clear headline"
                    />
                </div>

                <div className="dfield">
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" value={form.category} onChange={handleChange}>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="dfield">
                    <label htmlFor="body">Story</label>
                    <textarea
                        id="body"
                        name="body"
                        value={form.body}
                        onChange={handleChange}
                        placeholder="Write the full story here"
                    />
                </div>

                <div className="dfield">
                    <label htmlFor="publishDate">Publish date (optional)</label>
                    <input
                        id="publishDate"
                        name="publishDate"
                        type="date"
                        min={todayStr()}
                        value={form.publishDate}
                        onChange={handleChange}
                    />
                </div>

                <div className="dfield">
                    <label htmlFor="publishTime">Publish time (optional)</label>
                    <input
                        id="publishTime"
                        name="publishTime"
                        type="time"
                        value={form.publishTime}
                        onChange={handleChange}
                    />
                </div>

                <div className="btn-row">
                    <button type="button" className="dbtn dbtn--primary" onClick={() => save('submitted')}>
                        Send for review
                    </button>
                    <button type="button" className="dbtn" onClick={() => save('draft')}>
                        Save draft
                    </button>
                    {form.id && (
                        <button type="button" className="dbtn" onClick={() => setForm(EMPTY)}>
                            Cancel editing
                        </button>
                    )}
                </div>
            </section>

            <h2 className="dash__h2">My stories</h2>
            {mine.length === 0 ? (
                <p className="empty-note">You have not written any stories yet. Use the form above to start.</p>
            ) : (
                <div className="list">
                    {mine.map((a) => {
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
                                    {a.publishDate && (
                                        <span>Scheduled for {a.publishDate}{a.publishTime ? ` at ${a.publishTime}` : ''}</span>
                                    )}                                </p>

                                {a.feedback && (
                                    <p className="feedback">Editor feedback: {a.feedback}</p>
                                )}

                                <div className="btn-row">
                                    {canEdit && (
                                        <button type="button" className="dbtn" onClick={() => startEdit(a)}>
                                            Edit
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button type="button" className="dbtn dbtn--primary" onClick={() => submitArticle(a.id)}>
                                            Send for review
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button type="button" className="dbtn dbtn--danger" onClick={() => deleteArticle(a.id)}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </>
    );
}