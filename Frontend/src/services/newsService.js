import api from "./axiosInstance";
import { normalizeServerArticle } from "./bookmarkService";

function getErrorMessage(err, fallback) {
  if (err?.response) return err.response.data?.message || fallback;
  if (err?.isAxiosError) return "Cannot reach the server. Check your connection and try again.";
  return err?.message || fallback;
}

// GET /api/articles  - every published story, newest first (all pages)
export async function getPublishedArticles() {
  try {
    const items = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await api.get("/articles", { params: { page, limit: 50 } });
      items.push(...response.data.data.map(normalizeServerArticle));
      totalPages = response.data.pagination?.totalPages || 1;
      page += 1;
    } while (page <= totalPages);
    return items;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load the news."));
  }
}

// GET /api/categories  - returns the category names
export async function getNewsCategories() {
  try {
    const response = await api.get("/categories");
    return response.data.data.map((category) => category.name);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load the categories."));
  }
}

// ---------- editor review ----------

function normalizeReviewItem(article) {
  const when = article.publishedAt || article.updatedAt || article.createdAt;
  return {
    id: String(article._id),
    title: article.title,
    body: article.body || article.summary || "",
    category: article.category?.name || "",
    author: article.author?.fullName || "",
    status: article.status === "under_review" ? "submitted" : article.status,
    date: when ? new Date(when).toISOString().slice(0, 10) : "",
  };
}

// GET /api/articles/review  (editor, admin)
export async function getReviewQueue() {
  try {
    const response = await api.get("/articles/review");
    const { pending, decided } = response.data.data;
    return {
      pending: pending.map(normalizeReviewItem),
      decided: decided.map(normalizeReviewItem),
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load the review queue."));
  }
}

// PATCH /api/articles/:id/review  (editor, admin)
// decision: "published" | "changes_requested" | "rejected"
export async function decideArticle(id, decision, note = "") {
  try {
    await api.patch(`/articles/${id}/review`, { decision, note });
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not save your decision."));
  }
}
