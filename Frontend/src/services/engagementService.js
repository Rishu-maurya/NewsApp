import api from "./axiosInstance"
import { normalizeArticle } from "./articleService"

export async function toggleLike(articleId) {
    try {
        const response = await api.post(`/articles/${articleId}/like`)
        return response.data.data
    } catch (error) {
        throw new Error(error.response?.data?.message || "Could not update like.")
    }
}

export async function getLikeInfo(articleId) {
    try {
        const response = await api.get(`/articles/${articleId}/likes`)
        return response.data.data
    } catch (error) {
        throw new Error(error.response?.data?.message || "Could not load likes")
    }
}


export async function getBookmarkStatus(article) {
    try {
        const response = await api.get(`/bookmarks/${article}/status`)
        return response.data.data
    } catch (err) {
        throw new Error(err.response?.data?.message || "Could not load saved state.")
    }
}

export async function addBookmark(articleId) {
    try {
        await api.post(`/bookmarks/${articleId}`)
    } catch (err) {
        throw new Error(err.response?.data?.message || "Could not save this story.");        
    }
}

export async function removeBookmark(articleId) {
    try {
        await api.delete(`/bookmarks/${articleId}`)
    } catch (err) {
        throw new Error(err.response?.data?.message || "Could not remove this story.")
    }
}

export async function getBookmark() {
    try {
        const response = await api.get("/bookmarks")
        return response.data.data.map ((item) => normalizeArticle(item.articleId))
    } catch (err) {
        throw new Error(err.response?.data?.message || "Could not load saved stories.")
    }
}