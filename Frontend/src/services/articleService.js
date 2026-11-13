import api from "./axiosInstance";
import { toDateStr } from "../utils/dateUtils";

function getErrorMessage(err, fallback) {
  if (err?.response) return err.response.data?.message || fallback;
  if (err?.isAxiosError) return "Cannot reach the server. Check your connection and try again.";
  return err?.message || fallback;
}

export function normalizeArticle(article) {
  const when = article.publishedAt || article.createdAt;
  return {
    ...article,
    id: article._id,
    category: article.category?.name || "",
    author: article.author?.fullName || "",
    date: when ? toDateStr(new Date(when)) : "",
    body: article.body || "", // list API body nahi bhejta
  };
}

export async function getPublishedArticles() {
  try {
    const response = await api.get("/articles", { params: { limit: 50 } });
    return response.data.data.map(normalizeArticle);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load stories."));
  }
}

export async function getPublishedArticle(id) {
  try {
    const response = await api.get(`/articles/${id}`);
    return normalizeArticle(response.data.data);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 || status === 400) {
      throw new Error("This story could not be found. It may have been removed.");
    }
    throw new Error(getErrorMessage(err, "Could not load this story."));
  }
}

export async function getCategories() {
  try {
    const response = await api.get("/categories");
    return response.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load categories."));
  }
}