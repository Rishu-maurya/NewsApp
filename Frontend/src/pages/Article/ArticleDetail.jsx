import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ReactionBar from '../../components/news/ReactionBar';
import CommentSection from '../../components/news/CommentSection';
import KeepReading from '../../components/news/KeepReading';
import { bodyToHtml, hasMarkup, readMinutes } from '../../utils/richText';
import { useArticles } from '../../context/ArticlesContext';
import { isLive } from '../../utils/dateUtils';
import '../../style/ArticleDetail.css';

export default function ArticleDetail({ session, onLogout }) {
    const { id } = useParams();
    const { articles } = useArticles();
    const article = articles.find((a) => String(a.id) === id && isLive(a));
    const rich = article ? hasMarkup(article.body) : false;
    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-article">
                <Link to="/" className="s-back">All stories</Link>

                {article ? (
                    <>
                        <p className="s-cat" data-cat={article.category}>{article.category}</p>
                        <h1 className="s-h1">{article.title}</h1>
                        <p className="s-meta">
                            <span>{article.author}</span>
                            <span>{article.date}</span>
                            <span>{readMinutes(article.body)} min read</span>
                        </p>

                        {rich ? (
                            // body is sanitized when an editor saves it and again here
                            <div
                                className="s-article__body s-article__body--rich"
                                dangerouslySetInnerHTML={{ __html: bodyToHtml(article.body) }}
                            />
                        ) : (
                            <p className="s-article__body">{article.body}</p>
                        )}

                        <Link
                            to="/report"
                            state={{ articleId: article.id }}
                            className="s-link-btn"
                        >
                            Report this story
                        </Link>
                        <ReactionBar articleId={article.id} session={session} />
                        <CommentSection targetId={article.id} session={session} />
                    </>
                ) : (
                    <div className="s-empty">
                        <p>This story could not be found. It may have been removed.</p>
                    </div>
                )}
            </div>

            {article && (
                <KeepReading current={article} stories={articles.filter((a) => isLive(a))} />
            )}
        </SiteLayout>
    );
}