import { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_ARTICLES } from '../data/dummyData';

const STORAGE_KEY = 'news_dummy_articles';
const ArticlesContext = createContext(null);

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : INITIAL_ARTICLES;
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
        publishDate = '', publishTime = '',
    }) => {
        setArticles((prev) => {
            if (id) {
                return prev.map((a) =>
                    a.id === id
                        ? {
                            ...a,
                            title, category, body, status,
                            publishDate, publishTime,
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
                    publishDate, publishTime, feedback: '', date: today(),
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

    // editors can fix wording while reviewing, so title/body edits travel with the decision
    const updateArticleContent = (id, changes) =>
        setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));

    const reviewArticle = (id, decision, feedback = '', changes = {}) =>
        setArticles((prev) =>
            prev.map((a) =>
                a.id === id
                    ? {
                        ...a,
                        ...changes,
                        status: decision,
                        feedback,
                        date: decision === 'published' && a.publishDate ? a.publishDate : today(),
                    }
                    : a
            )
        );

    const resetDemoData = () => setArticles(INITIAL_ARTICLES);

    return (
        <ArticlesContext.Provider
            value={{ articles, saveArticle, submitArticle, deleteArticle, reviewArticle, updateArticleContent, resetDemoData }}
        >
            {children}
        </ArticlesContext.Provider>
    );
}

export function useArticles() {
    return useContext(ArticlesContext);
}