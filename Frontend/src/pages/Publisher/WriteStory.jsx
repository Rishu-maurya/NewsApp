import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PublisherLayout from '../../components/publisher/PublisherLayout';
import { getMyArticle, getPublisherCategories, saveMyArticle } from '../../services/publisherService';

const EMPTY = { id: null, title: '', category: '', body: '' };
const MIN_LENGTH = 30;

export default function WriteStory({ session, onLogout }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        Promise.all([
            getPublisherCategories(),
            id ? getMyArticle(id) : Promise.resolve(null),
        ]).then(([nextCategories, article]) => {
            if (cancelled) return;
            setCategories(nextCategories);
            setEditing(article);
            setForm(article ? {
                id: article.id,
                title: article.title,
                category: article.categoryId,
                body: article.body || '',
            } : {
                ...EMPTY,
                category: nextCategories[0]?._id || '',
            });
        }).catch((err) => {
            if (!cancelled) setError(err.message);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const save = async (status) => {
        if (!form.title.trim()) return setError('Enter a title for the story.');
        if (!form.body.trim()) return setError('Write some story content before saving.');
        if (!form.category) return setError('Choose a category for the story.');
        if (status === 'submitted' && form.body.trim().length < MIN_LENGTH) {
            return setError(`Write at least ${MIN_LENGTH} characters before sending for review.`);
        }
        setSaving(true);
        setError('');
        try {
            await saveMyArticle(form, status);
            navigate('/publisher/stories', {
                state: {
                    message: status === 'submitted'
                        ? 'Story sent to the editor for review.'
                        : 'Draft saved.',
                },
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PublisherLayout
                session={session}
                onLogout={onLogout}
                title={id ? 'Loading story' : 'New story'}
                subtitle="Connecting to the publishing service."
            >
                <p className="empty-note">Loading story and categories...</p>
            </PublisherLayout>
        );
    }

    if (error && id && !editing) {
        return (
            <PublisherLayout
                session={session}
                onLogout={onLogout}
                title="Story unavailable"
                subtitle="The story could not be loaded from the server."
            >
                <p className="derr" role="alert">{error}</p>
                <p style={{ marginTop: 16 }}>
                    <Link to="/publisher/stories" className="dbtn">Back to my stories</Link>
                </p>
            </PublisherLayout>
        );
    }

    const canEdit = !editing || ['draft', 'changes_requested'].includes(editing.status);

    if (!canEdit) {
        return (
            <PublisherLayout
                session={session}
                onLogout={onLogout}
                title="Story not editable"
                subtitle="Only drafts and stories with requested changes can be edited."
            >
                <p className="empty-note">
                    This story is {editing.status.replaceAll('_', ' ')}. It is locked while it is in review or after a final decision.
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
                    <select id="category" name="category" value={form.category} onChange={handleChange} disabled={!categories.length}>
                        <option value="" disabled>Choose a category</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>{category.name}</option>
                        ))}
                    </select>
                    {!categories.length && <p className="derr">No active categories are available. Ask an admin to add one.</p>}
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
                    <button type="button" className="dbtn dbtn--primary" onClick={() => save('submitted')} disabled={saving}>
                        {saving ? 'Saving...' : 'Send for review'}
                    </button>
                    <button type="button" className="dbtn" onClick={() => save('draft')} disabled={saving}>
                        {saving ? 'Saving...' : 'Save draft'}
                    </button>
                    <Link to="/publisher/stories" className="dbtn">Cancel</Link>
                </div>
            </section>
        </PublisherLayout>
    );
}