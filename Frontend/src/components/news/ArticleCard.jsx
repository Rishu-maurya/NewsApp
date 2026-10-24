import { Link } from 'react-router-dom';

export default function ArticleCard({ article, likeCount, commentCount, lead }) {
    const summary = article.body.length > 120 ? `${article.body.slice(0, 120)}...` : article.body;

    return (
        <article className={`s-card${lead ? ' s-card--lead' : ''}`}>
            <p className="s-cat">{article.category}</p>
            <h2 className="s-card__title">
                <Link to={`/article/${article.id}`}>{article.title}</Link>
            </h2>
            <p className="s-card__text">{summary}</p>
            <p className="s-meta">
                <span>{article.author}</span>
                <span>{article.date}</span>
            </p>
            <p className="s-meta">
                <span>{likeCount} likes</span>
                <span>{commentCount} comments</span>
            </p>
        </article>
    );
}