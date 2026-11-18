import { Link, useNavigate } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import { useBookmarks } from '../../context/BookmarksContext';
import { isServerId } from '../../services/bookmarkService';
import { dayName } from '../../utils/dateUtils';
import '../../style/ArticleCard.css';

export default function ArticleCard({ article, session, lead, removable }) {
    const navigate = useNavigate();
    const { likes, saved, comments, toggleSave } = useActivity();
    const { ids, toggle } = useBookmarks();

    const key = String(article.id);
    const email = session?.user.email;
    // real stories are saved on the server; old demo stories are still saved in the browser
    const onServer = isServerId(article.id);
    const isSaved = !email ? false : onServer ? ids.has(key) : (saved[key] || []).includes(email);
    const likeCount = (likes[key] || []).length;
    const commentCount = comments.filter((c) => c.targetId === key).length;
    const summary = article.body.length > 120 ? `${article.body.slice(0, 120)}...` : article.body;

    const handleSave = async () => {
        if (!email) {
            navigate('/login', {
                state: { message: 'Log in to save stories to your bookmarks.' },
            });
            return;
        }
        if (!onServer) {
            toggleSave(article.id, email);
            return;
        }
        const problem = await toggle(article.id);
        if (problem) window.alert(problem);
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
                <Link to={`/article/${article.id}#comments`} className="s-btn">
                    Comment{commentCount > 0 ? ` (${commentCount})` : ''}
                </Link>
                <button type="button" className="s-btn" aria-pressed={isSaved} onClick={handleSave}>
                    {label}
                </button>
            </div>
        </article>
    );
}