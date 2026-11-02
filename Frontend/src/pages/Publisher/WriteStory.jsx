import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PublisherLayout from '../../components/publisher/PublisherLayout';
import { useArticles } from '../../context/ArticlesContext';
import { CATEGORIES } from '../../data/dummyData';

const EMPTY = { id: null, title: '', category: CATEGORIES[0], body: '' };
const EDITABLE = ['draft', 'changes_requested'];
const MIN_LENGTH = 30;

export default function WriteStory({ session, onLogout }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { articles, saveArticle } = useArticles();
    const { name, email } = session.user;

    const editing = id
        ? articles.find((a) => String(a.id) === id && a.authorEmail === email)
        : null;
    const blocked = id && (!editing || !EDITABLE.includes(editing.status));

    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editing && EDITABLE.includes(editing.status)) {
            setForm({
                id: editing.id,
                title: editing.title,
                category: editing.category,
                body: editing.body,
            });
        } else {
            setForm(EMPTY);
        }
        setError('');
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const save = (status) => {
        if (!form.title.trim()) return setError('Enter a title for the story.');
        if (status === 'submitted' && form.body.trim().length < MIN_LENGTH) {
            return setError(`Write at least ${MIN_LENGTH} characters before sending for review.`);
        }
        saveArticle({
            ...form,
            title: form.title.trim(),
            status,
            author: name,
            authorEmail: email,
        });
        navigate('/publisher/stories', {
            state: {
                message:
                    status === 'submitted'
                        ? 'Story sent to the editor for review.'
                        : 'Draft saved.',
            },
        });
    };

    if (blocked) {
        return (
            <PublisherLayout
                session={session}
                onLogout={onLogout}
                title="Story not available"
                subtitle="This story cannot be edited right now."
            >
                <p className="empty-note">
                    Only drafts and stories with requested changes can be edited. Stories in review,
                    published or rejected stories are locked.
                </p>
                <p style={{ marginTop: 16 }}>
                    <Link to="/publisher/stories" className="dbtn">Back to my stories</Link>
                </p>
            </PublisherLayout>
        );
    }

    return (
        <PublisherLayout
            session={session}
            onLogout={onLogout}
            title={form.id ? 'Edit story' : 'Write a story'}
            subtitle="Save a draft any time. An editor reviews the story before readers can see it."
        >
            <section className="panel">
                {editing?.status === 'changes_requested' && editing.feedback && (
                    <p className="feedback">Editor feedback: {editing.feedback}</p>
                )}
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

                <p className="pub-hint">
                    {form.body.trim().length} characters. At least {MIN_LENGTH} are needed to send for review.
                </p>

                <div className="btn-row">
                    <button type="button" className="dbtn dbtn--primary" onClick={() => save('submitted')}>
                        Send for review
                    </button>
                    <button type="button" className="dbtn" onClick={() => save('draft')}>
                        Save draft
                    </button>
                    <Link to="/publisher/stories" className="dbtn">Cancel</Link>
                </div>
            </section>
        </PublisherLayout>
    );
}