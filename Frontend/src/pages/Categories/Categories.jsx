import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteLayout from "../../components/layout/SiteLayout";
import {
  getCategories,
  getPublishedArticles,
} from "../../services/articleService"; // ← Published
import "../../style/Categories.css";
import "../../style/InfoCard.css";

export default function Categories({ session, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories(), getPublishedArticles()]) // ← Published
      .then(([categoryList, articleList]) => {
        if (cancelled) return;
        setCategories(categoryList);
        setArticles(articleList);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteLayout session={session} onLogout={onLogout}>
      <section className="s-page-intro s-categories">
        <p className="s-eyebrow">Explore the newsroom</p>
        <h1 className="s-h1">Browse by category</h1>
        <p className="s-sub">
          Find the latest coverage from the topics you follow.
        </p>
      </section>
      {loading ? (
        <p>Loading categories...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="s-info-grid">
          {categories.map((category) => {
            
            const count = articles.filter(
              (article) => article.category === category.name,
            ).length;

            return (
              <Link
                key={category._id} 
                to={`/category/${category.slug}`}
                className="s-info-card s-category-card"
              >
                <span className="s-eyebrow">
                  {count} {count === 1 ? "story" : "stories"}
                </span>
                <h2 className="s-h2">{category.name}</h2>
                <span className="s-category-card__link">
                  Explore category <span aria-hidden="true">→</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}{" "}
    </SiteLayout>
  );
}
