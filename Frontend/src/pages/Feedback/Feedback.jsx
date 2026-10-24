import { useState } from 'react';
import SiteLayout from '../../components/layout/SiteLayout';
import LoginPrompt from '../../components/news/LoginPrompt';
import { useActivity } from '../../context/ActivityContext';

export default function Feedback({ session, onLogout }) {
    const { feedback, addFeedback } = useActivity();
    const [rating, setRating] = useState('5');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    if (!session) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Feedback</h1>
                <p className="s-sub">Tell us what we can do better.</p>
                <LoginPrompt message="Log in to share your feedback." />
            </SiteLayout>
        );
    }

    const mine = feedback.filter((f) => f.email === session.user.email);

    const submit = (e) => {
        e.preventDefault();
        if (message.trim().length < 10) {
            return setError('Write at least 10 characters so we can understand your feedback.');
        }
        addFeedback({ user: session.user, rating: Number(rating), message: message.trim() });
        setMessage('');
        setError('');
        setDone(true);
    };

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-article">
                <h1 className="s-h1">Feedback</h1>
                <p className="s-sub">Tell us what we can do better.</p>

                {done && <p className="s-note" role="status">Thank you. Your feedback has been sent.</p>}
                {error && <p className="s-err" role="alert">{error}</p>}

                <form onSubmit={submit} noValidate>
                    <label htmlFor="rating" className="s-label">How would you rate the platform?</label>
                    <select
                        id="rating"
                        className="s-select"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                    >
                        <option value="5">5 out of 5, excellent</option>
                        <option value="4">4 out of 5, good</option>
                        <option value="3">3 out of 5, okay</option>
                        <option value="2">2 out of 5, poor</option>
                        <option value="1">1 out of 5, very poor</option>
                    </select>

                    <label htmlFor="message" className="s-label">Your feedback</label>
                    <textarea
                        id="message"
                        className="s-textarea"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            setError('');
                            setDone(false);
                        }}
                        placeholder="What worked well and what should change?"
                    />

                    <button type="submit" className="s-btn s-btn--solid">Send feedback</button>
                </form>

                <h2 className="s-h2">Your earlier feedback</h2>
                {mine.length === 0 ? (
                    <p className="s-muted">You have not sent any feedback yet.</p>
                ) : (
                    <ul className="s-comments">
                        {mine.map((f) => (
                            <li key={f.id} className="s-comment">
                                <p className="s-comment__head">
                                    <strong>{f.rating} out of 5</strong>
                                    <span>{f.date}</span>
                                </p>
                                <p className="s-comment__text">{f.message}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </SiteLayout>
    );
}