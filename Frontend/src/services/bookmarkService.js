import api from "./axiosInstance";

function getErrorMessage(err, fallback) {
  if (err?.response) return err.response.data?.message || fallback;
  if (err?.isAxiosError) return "Cannot reach the server. Check your connection and try again.";
  return err?.message || fallback;
}

// Real stories from the database have a 24-character MongoDB id.
// The old demo stories use ids like 1, 2, 3 and cannot be saved on the server.
export const isServerId = (id) => /^[a-f\d]{24}$/i.test(String(id));

// Turn a server article into the shape the story cards already understand.
export function normalizeServerArticle(article) {
  const when = article.publishedAt || article.createdAt;
  return {
    id: String(article._id),
    title: article.title,
    body: article.summary || article.body || "",
    category: article.category?.name || "",
    author: article.author?.fullName || "",
    date: when ? new Date(when).toISOString().slice(0, 10) : "",
    status: "published",
  };
}

// GET /api/bookmarks  (all pages, newest first)
export async function getMyBookmarks() {
  try {
    const items = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await api.get("/bookmarks", { params: { page, limit: 50 } });
      items.push(...response.data.data.map((b) => normalizeServerArticle(b.article)));
      totalPages = response.data.pagination?.totalPages || 1;
      page += 1;
    } while (page <= totalPages);
    return items;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load your bookmarks."));
  }
}

// POST /api/bookmarks/:articleId
export async function addBookmark(articleId) {
  try {
    await api.post(`/bookmarks/${articleId}`);
  } catch (err) {
    // 409 = already saved, which is what the user wanted anyway
    if (err?.response?.status === 409) return;
    throw new Error(getErrorMessage(err, "Could not save this story."));
  }
}

// DELETE /api/bookmarks/:articleId
export async function removeBookmark(articleId) {
  try {
    await api.delete(`/bookmarks/${articleId}`);
  } catch (err) {
    if (err?.response?.status === 404) return;
    throw new Error(getErrorMessage(err, "Could not remove this bookmark."));
  }
}

// GET /api/articles/:id  (a published story from the database)
export async function getPublishedArticle(id) {
  try {
    const response = await api.get(`/articles/${id}`);
    return normalizeServerArticle(response.data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load this story."));
  }
}
