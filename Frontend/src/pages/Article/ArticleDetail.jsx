import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ReactionBar from '../../components/news/ReactionBar';
import CommentSection from '../../components/news/CommentSection';
import { useArticles } from '../../context/ArticlesContext';

export default function ArticleDetail({ session, onLogout }) {
    const { id } = useParams();
    const { articles } = useArticles();
    const article = articles.find((a) => String(a.id) === id && a.status === 'published');

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-article">
                <Link to="/" className="s-back">All stories</Link>

                {article ? (
                    <>
                        <p className="s-cat">{article.category}</p>
                        <h1 className="s-h1">{article.title}</h1>
                        <p className="s-meta">
                            <span>{article.author}</span>
                            <span>{article.date}</span>
                        </p>

                        <p className="s-article__body">{article.body}</p>

                        <ReactionBar articleId={article.id} session={session} />
                        <CommentSection targetId={article.id} session={session} />
                    </>
                ) : (
                    <div className="s-empty">
                        <p>This story could not be found. It may have been removed.</p>
                    </div>
                )}
            </div>
        </SiteLayout>
    );
}