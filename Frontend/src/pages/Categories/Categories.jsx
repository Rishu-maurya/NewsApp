import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import { useNews } from '../../context/NewsContext';
import '../../style/Categories.css';
import '../../style/InfoCard.css';

export default function Categories({ session, onLogout }) {
    const { articles, categories } = useNews();

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <section className="s-page-intro s-categories">
                <p className="s-eyebrow">Explore the newsroom</p>
                <h1 className="s-h1">Browse by category</h1>
                <p className="s-sub">Find the latest coverage from the topics you follow.</p>
            </section>

            <div className="s-info-grid">
                {categories.map((category) => {
                    const count = articles.filter(
                        (article) => article.category === category
                    ).length;

                    return (
                        <Link
                            key={category}
                            to={`/category/${encodeURIComponent(category.toLowerCase())}`}
                            className="s-info-card s-category-card"
                        >
                            <span className="s-eyebrow">{count} {count === 1 ? 'story' : 'stories'}</span>
                            <h2 className="s-h2">{category}</h2>
                            <span className="s-category-card__link">Explore category <span aria-hidden="true">→</span></span>
                        </Link>
                    );
                })}
            </div>
        </SiteLayout>
    );
}
