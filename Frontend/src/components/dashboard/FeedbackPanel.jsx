import { useActivity } from '../../context/ActivityContext';
import '../../style/FeedbackPanel.css';

export default function FeedbackPanel() {
    const { feedback } = useActivity();
    const average = feedback.length
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
        : '-';

    return (
        <section className="feedback-panel">
            <h2 className="dash__h2">User feedback</h2>
            <p className="muted">
                {feedback.length} responses, average rating {average} out of 5
            </p>

            {feedback.length === 0 ? (
                <p className="empty-note">No feedback yet. Messages from users will appear here.</p>
            ) : (
                <div className="list">
                    {feedback.map((f) => (
                        <article key={f.id} className="item">
                            <p className="item__cat">{f.rating} out of 5</p>
                            <h3 className="item__title">{f.message}</h3>
                            <p className="item__meta">
                                <span>{f.name}</span>
                                <span>{f.date}</span>
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}