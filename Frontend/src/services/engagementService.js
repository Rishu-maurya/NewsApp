import api from "./axiosInstance"

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


export async function getBookmarkStatus(articleId) {
    try {
        const response = await api.get(`/bookmarks/${articleId}/status`)
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