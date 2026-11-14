import { useEffect, useState } from 'react';
import {
    deleteMyArticle,
    getMyArticles,
    getPublisherCategories,
    saveMyArticle,
    submitMyArticle,
} from '../../services/publisherService';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { todayStr } from '../../utils/dateUtils';
import '../../style/JournalistView.css';

const EMPTY = { id: null, title: '', category: '', body: '', publishDate: '', publishTime: '', important: false };
export default function JournalistView() {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState('');
    const [loadError, setLoadError] = useState('');
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;
        Promise.all([getMyArticles(), getPublisherCategories()])
            .then(([stories, items]) => {
                if (cancelled) return;
                const activeCategories = Array.isArray(items)
                    ? items.filter((category) => category?._id && category.name)
                    : [];
                setArticles(stories);
                setCategories(activeCategories);
                setForm((current) => current.category
                    ? current
                    : { ...current, category: activeCategories[0]?._id || '' });
            })
            .catch((err) => {
                if (!cancelled) setLoadError(err.message);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                    setCategoriesLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const count = (status) => articles.filter((article) => article.status === status).length;

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [e.target.name]: value }));
        setError('');
        setMessage('');
    };

    const save = async (status) => {
        if (!form.title.trim()) return setError('Enter a title for the story.');
        if (!form.body.trim()) return setError('Write some story content before saving.');
        if (!categories.some((category) => category._id === form.category)) {
            return setError('Choose an active category for the story.');
        }
        if (form.publishTime && !form.publishDate) {
            return setError('Choose a publish date along with the time.');
        }
        if (form.publishDate && form.publishDate < todayStr()) {
            return setError('Publish date cannot be in the past.');
        }
        if (status === 'submitted' && form.body.trim().length < 30) {
            return setError('Write at least 30 characters before sending for review.');
        }
        setSaving(true);
        setError('');
        try {
            await saveMyArticle({ ...form, title: form.title.trim() }, status);
            setArticles(await getMyArticles());
            setForm({ ...EMPTY, category: categories[0]?._id || '' });
            setMessage(status === 'submitted' ? 'Story sent to the editor for review.' : 'Draft saved.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateStoryStatus = async (articleId, action) => {
        setBusyId(articleId);
        setError('');
        try {
            if (action === 'submit') await submitMyArticle(articleId);
            else await deleteMyArticle(articleId);
            setArticles(await getMyArticles());
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    const startEdit = (a) => {
        setForm({
            id: a.id,
            title: a.title,
            category: a.categoryId,
            body: a.body,
            publishDate: a.publishDate,
            publishTime: a.publishTime,
            important: !!a.important,
        });
        setError('');
        setMessage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setForm({ ...EMPTY, category: categories[0]?._id || '' });
        setError('');
        setMessage('');
    };

    return (
        <div className="journalist-desk">
            <div className="stats journalist-desk__stats">
                <StatCard label="Drafts" value={count('draft')} />
                <StatCard label="In review" value={count('submitted')} />
                <StatCard label="Changes requested" value={count('changes_requested')} />
                <StatCard label="Published" value={count('published')} />
            </div>

            <header className="journalist-desk__section-head">
                <div>
                    <p className="journalist-desk__eyebrow">Reporter desk</p>
                    <h2 className="dash__h2">{form.id ? 'Edit story' : 'Write a story'}</h2>
                </div>
                <span className="journalist-desk__mode">{form.id ? 'Editing' : 'New draft'}</span>
            </header>

            <section className="panel journalist-desk__compose">
                <div className="journalist-desk__compose-head">
                    <span>Story details</span>
                    <span>{form.body.trim().length} characters</span>
                </div>
                {message && <p className="dnote" role="status">{message}</p>}
                {error && <p className="derr" role="alert">{error}</p>}
                {loadError && <p className="derr" role="alert">{loadError}</p>}

                <div className="journalist-desk__grid">
                    <div className="dfield journalist-desk__headline">
                        <label htmlFor="title">Headline</label>
                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Write a clear headline"
                        />
                    </div>

                    <div className="dfield journalist-desk__category">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            disabled={categoriesLoading || !categories.length || saving}
                        >
                            <option value="" disabled>
                                {categoriesLoading ? 'Loading categories...' : 'Choose a category'}
                            </option>
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>{category.name}</option>
                            ))}
                        </select>
                        {!categoriesLoading && !loadError && !categories.length && (
                            <p className="empty-note">No active categories are available.</p>
                        )}
                    </div>
                </div>

                <div className="dfield journalist-desk__story">
                    <label htmlFor="body">Story copy</label>
                    <textarea
                        id="body"
                        name="body"
                        value={form.body}
                        onChange={handleChange}
                        placeholder="Write the full story here"
                    />
                </div>

                <div className="journalist-desk__grid journalist-desk__schedule">
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
                </div>

                <div className="dfield dfield--check journalist-desk__important">
                    <label htmlFor="important">
                        <input
                            id="important"
                            name="important"
                            type="checkbox"
                            checked={form.important}
                            onChange={handleChange}
                        />
                        Mark as an important story (shown in yellow on the home page)
                    </label>
                </div>

                <div className="btn-row">
                    <button type="button" className="dbtn dbtn--primary" onClick={() => save('submitted')} disabled={saving || categoriesLoading || !categories.length}>
                        {saving ? 'Saving...' : 'Send for review'}
                    </button>
                    <button type="button" className="dbtn" onClick={() => save('draft')} disabled={saving || categoriesLoading || !categories.length}>
                        {saving ? 'Saving...' : 'Save draft'}
                    </button>
                    {form.id && (
                        <button
                            type="button"
                            className="dbtn"
                            onClick={cancelEditing}
                            disabled={saving}
                        >
                            Cancel editing
                        </button>
                    )}
                </div>
            </section>

            <header className="journalist-desk__section-head journalist-desk__stories-head">
                <div>
                    <p className="journalist-desk__eyebrow">Your work</p>
                    <h2 className="dash__h2">My stories</h2>
                </div>
                <span className="journalist-desk__mode">{articles.length} total</span>
            </header>
            {loading ? (
                <p className="empty-note">Loading your stories...</p>
            ) : articles.length === 0 ? (
                <p className="empty-note">You have not written any stories yet. Use the form above to start.</p>
            ) : (
                <div className="list">
                    {articles.map((a) => {
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
                                        <button type="button" className="dbtn dbtn--primary" onClick={() => updateStoryStatus(a.id, 'submit')} disabled={Boolean(busyId)}>
                                            {busyId === a.id ? 'Sending...' : 'Send for review'}
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button type="button" className="dbtn dbtn--danger" onClick={() => updateStoryStatus(a.id, 'delete')} disabled={Boolean(busyId)}>
                                            {busyId === a.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}