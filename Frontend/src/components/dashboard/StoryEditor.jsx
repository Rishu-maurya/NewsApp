import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import StatusBadge from './StatusBadge';
import { bodyToText, sanitizeHtml } from '../../utils/richText';
import '../../style/StoryEditor.css';

// Full-width editing screen for one story. While it is open the rest of the
// dashboard (stats, other stories, decisions) is not shown.
export default function StoryEditor({ article, onSave, onDecide, onClose }) {
    const [title, setTitle] = useState(article.title);
    const [body, setBody] = useState(article.body);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');
    const [savedAt, setSavedAt] = useState('');
    const [confirmLeave, setConfirmLeave] = useState(false);

    const dirty = title !== article.title || body !== article.body;
    const changes = () => ({ title: title.trim() || article.title, body: sanitizeHtml(body) });

    const validBody = () => bodyToText(body).length >= 30;

    const save = () => {
        if (!validBody()) return setError('The story text is too short to save.');
        onSave(article.id, changes());
        setSavedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        setError('');
    };

    const decide = (decision) => {
        if (decision !== 'published' && !feedback.trim()) {
            return setError('Add feedback so the journalist knows what to fix.');
        }
        if (!validBody()) return setError('The story text is too short.');
        onDecide(article.id, decision, decision === 'published' ? '' : feedback.trim(), changes());
    };

    const back = () => (dirty ? setConfirmLeave(true) : onClose());

    return (
        <section className="se" aria-label="Edit story">
            <div className="se__top">
                <button type="button" className="dbtn" onClick={back}>&larr; Back to review queue</button>
                <div className="se__state">
                    <StatusBadge status={article.status} />
                    <span className="se__saved" role="status">
                        {dirty ? 'Unsaved changes' : savedAt ? `Saved at ${savedAt}` : 'No changes yet'}
                    </span>
                </div>
            </div>

            {confirmLeave && (
                <div className="dnote se__leave" role="alert">
                    <span>You have unsaved edits.</span>
                    <button type="button" className="dbtn dbtn--primary" onClick={() => { save(); onClose(); }}>Save and leave</button>
                    <button type="button" className="dbtn dbtn--danger" onClick={onClose}>Discard edits</button>
                    <button type="button" className="dbtn" onClick={() => setConfirmLeave(false)}>Keep editing</button>
                </div>
            )}

            <p className="item__cat">{article.category} &middot; by {article.author} &middot; sent {article.date}</p>
            <label className="se__label" htmlFor="se-title">Headline</label>
            <input id="se-title" className="se__title" value={title} maxLength={140}
                onChange={(e) => setTitle(e.target.value)} />

            <span className="se__label">Story</span>
            <RichTextEditor value={article.body} onChange={setBody} />

            {error && <p className="derr" role="alert">{error}</p>}

            <label className="se__label" htmlFor="se-feedback">
                Feedback for the journalist <span>(needed for changes or rejection)</span>
            </label>
            <textarea id="se-feedback" className="feedback-input" rows={3} value={feedback}
                placeholder="Explain what needs to change"
                onChange={(e) => { setFeedback(e.target.value); setError(''); }} />

            <div className="se__actions">
                <button type="button" className="dbtn" onClick={save} disabled={!dirty}>Save edits</button>
                <span className="se__spacer" />
                <button type="button" className="dbtn dbtn--danger" onClick={() => decide('rejected')}>Reject</button>
                <button type="button" className="dbtn" onClick={() => decide('changes_requested')}>Request changes</button>
                <button type="button" className="dbtn dbtn--good" onClick={() => decide('published')}>Approve and publish</button>
            </div>
        </section>
    );
}
