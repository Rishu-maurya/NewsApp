import { Link, useNavigate } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import { dayName } from '../../utils/dateUtils';
import '../../style/ArticleCard.css';

export default function ArticleCard({ article, session, lead, removable }) {
    const navigate = useNavigate();
    const { likes, saved, comments, toggleSave } = useActivity();

    const key = String(article.id);
    const email = session?.user.email;
    const isSaved = email ? (saved[key] || []).includes(email) : false;
    const likeCount = (likes[key] || []).length;
    const commentCount = comments.filter((c) => c.targetId === key).length;
    const summary = article.body.length > 120 ? `${article.body.slice(0, 120)}...` : article.body;

    const handleSave = () => {
        if (!email) {
            navigate('/login', {
                state: { message: 'Log in to save stories to your bookmarks.' },
            });
            return;
        }
        toggleSave(article.id, email);
    };

    const label = removable ? 'Remove' : isSaved ? 'Saved' : 'Save';

    return (
        <article className={`s-card${lead ? ' s-card--lead' : ''}`}>
            <p className="s-cat">{article.category}</p>
            <h2 className="s-card__title">
                <Link to={`/article/${article.id}`}>{article.title}</Link>
            </h2>
            <p className="s-card__text">{summary}</p>
            <p className="s-meta">
                <span>{article.author}</span>
                <span>{dayName(article.date)}, {article.date}</span>            </p>
            <p className="s-meta">
                <span>{likeCount} likes</span>
                <span>{commentCount} comments</span>
            </p>

            <div className="s-card__foot">
                <Link to={`/article/${article.id}`} className="s-btn">Read</Link>
                <button type="button" className="s-btn" aria-pressed={isSaved} onClick={handleSave}>
                    {label}
                </button>
            </div>
        </article>
    );
}