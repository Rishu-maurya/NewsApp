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
    categoryId: article.category?._id || article.category,
    category: article.category?.name || "",
    author: article.author?.fullName || "",
    date: updatedAt ? new Date(updatedAt).toISOString().slice(0, 10) : "",
    feedback: article.reviewNote || "",
  };
}

export async function getPublisherCategories() {
  try {
    const response = await api.get("/categories");
    return response.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load story categories."));
  }
}

export async function getMyArticles() {
  try {
    const response = await api.get("/articles/mine");
    return response.data.data.map(normalizeArticle);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load your stories."));
  }
}

export async function getPublishQueue() {
  try {
    const response = await api.get("/articles/publish-queue");
    return response.data.data.map(normalizeArticle);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load approved stories."));
  }
}

export async function publishApprovedArticle(id) {
  try {
    const response = await api.patch(`/articles/${id}/publish`);
    return normalizeArticle(response.data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not publish this story."));
  }
}

export async function getMyArticle(id) {
  try {
    const response = await api.get(`/articles/${id}`);
    return normalizeArticle(response.data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load this story."));
  }
}

export async function saveMyArticle(article, status) {
  const body = {
    title: article.title.trim(),
    body: article.body.trim(),
    summary: article.body.trim().slice(0, 500),
    category: article.category,
    publishDate: article.publishDate,
    publishTime: article.publishTime,
    important: article.important,
    status,
  };

  try {
    const response = article.id
      ? await api.put(`/articles/${article.id}`, body)
      : await api.post("/articles", body);
    return normalizeArticle(response.data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not save your story."));
  }
}

export async function submitMyArticle(id) {
  try {
    const response = await api.put(`/articles/${id}`, { status: "submitted" });
    return normalizeArticle(response.data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not send this story for review."));
  }
}

export async function deleteMyArticle(id) {
  try {
    await api.delete(`/articles/${id}`);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not delete this story."));
  }
}
