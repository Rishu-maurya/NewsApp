import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getNewsCategories, getPublishedArticles } from '../services/newsService';

const NewsContext = createContext({
    articles: [],
    categories: [],
    loading: true,
    error: '',
    refresh: async () => {},
});

// Published stories and categories from the server, shared by every reader page.
export function NewsProvider({ children }) {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [stories, names] = await Promise.all([getPublishedArticles(), getNewsCategories()]);
            setArticles(stories);
            setCategories(names);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <NewsContext.Provider value={{ articles, categories, loading, error, refresh }}>
            {children}
        </NewsContext.Provider>
    );
}

export function useNews() {
    return useContext(NewsContext);
}
