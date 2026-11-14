import api from "./axiosInstance";

function getErrorMessage(err, fallback) {
  if (err?.response) return err.response.data?.message || fallback;
  if (err?.isAxiosError) return "Cannot reach the server. Check your connection and try again.";
  return err?.message || fallback;
}

function normalizeArticle(article) {
  const updatedAt = article.updatedAt || article.createdAt;
  return {
    ...article,
    id: article._id,
    category: article.category?.name || "",
    author: article.author?.fullName || "",
    date: updatedAt ? new Date(updatedAt).toISOString().slice(0, 10) : "",
  };
}

export async function getReviewQueue() {
  try {
    const response = await api.get("/articles/review-queue");
    const { pending, decided, counts } = response.data.data;
    return {
      pending: pending.map(normalizeArticle),
      decided: decided.map(normalizeArticle),
      counts,
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load the review queue."));
  }
}

export async function reviewArticle(id, decision, feedback = "", important) {
  try {
    await api.post(`/articles/${id}/reviews`, { decision, feedback: feedback.trim(), important });
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not submit your review."));
  }
}

export async function publishArticle(id) {
  try {
    await api.patch(`/articles/${id}/publish`);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not publish this story."));
  }
}
