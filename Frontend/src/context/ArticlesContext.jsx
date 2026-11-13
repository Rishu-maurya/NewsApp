import { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_ARTICLES } from '../data/dummyData';

const STORAGE_KEY = 'news_dummy_articles';
const ArticlesContext = createContext(null);

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!Array.isArray(saved)) return INITIAL_ARTICLES;
        // older saved data has no `important` flag: take it from the starter stories
        return saved.map((a) => (a.important === undefined
            ? { ...a, important: !!INITIAL_ARTICLES.find((i) => i.id === a.id)?.important }
            : a));
    } catch {
        return INITIAL_ARTICLES;
    }
}

const today = () => new Date().toISOString().slice(0, 10);

export function ArticlesProvider({ children }) {
    const [articles, setArticles] = useState(load);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    }, [articles]);

    const saveArticle = ({
        id, title, category, body, status, author, authorEmail,
        publishDate = '', publishTime = '', important = false,
    }) => {
        setArticles((prev) => {
            if (id) {
                return prev.map((a) =>
                    a.id === id
                        ? {
                            ...a,
                            title, category, body, status,
                            publishDate, publishTime, important,
                            feedback: status === 'submitted' ? '' : a.feedback,
                            date: today(),
                        }
                        : a
                );
            }
            const nextId = Math.max(0, ...prev.map((a) => a.id)) + 1;
            return [
                {
                    id: nextId, title, category, body, status, author, authorEmail,
                    publishDate, publishTime, important, feedback: '', date: today(),
                },
                ...prev,
            ];
        });
    };

    const submitArticle = (id) =>
        setArticles((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'submitted', feedback: '', date: today() } : a))
        );

    const deleteArticle = (id) => setArticles((prev) => prev.filter((a) => a.id !== id));

    const reviewArticle = (id, decision, feedback = '', important) =>
        setArticles((prev) =>
            prev.map((a) =>
                a.id === id
                    ? {
                        ...a,
                        status: decision,
                        feedback,
                        important: important === undefined ? !!a.important : important,
                        date: decision === 'published' && a.publishDate ? a.publishDate : today(),
                    }
                    : a
            )
        );

    const resetDemoData = () => setArticles(INITIAL_ARTICLES);

    return (
        <ArticlesContext.Provider
            value={{ articles, saveArticle, submitArticle, deleteArticle, reviewArticle, resetDemoData }}
        >
            {children}
        </ArticlesContext.Provider>
    );
}

export function useArticles() {
    return useContext(ArticlesContext);
}