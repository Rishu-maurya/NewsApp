import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home/Home';
import ArticleDetail from '../pages/Article/ArticleDetail';
import Bookmarks from '../pages/Bookmarks/Bookmarks';
import Live from '../pages/Live/Live';
import Feedback from '../pages/Feedback/Feedback';
import Dashboard from '../pages/Dashboard/Dashboard';
import Overview from '../pages/Publisher/Overview';
import WriteStory from '../pages/Publisher/WriteStory';
import MyStories from '../pages/Publisher/MyStories';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import { HOME_BY_ROLE } from '../data/roles';

export default function AppRoutes({ session, onLogin, onLogout }) {
    const role = session?.user.role;
    const shared = { session, onLogout };

    const toHome = <Navigate to="/" replace />;
    const toLanding = <Navigate to={HOME_BY_ROLE[role] || '/'} replace />;
    const denied = <Navigate to={session ? '/' : '/login'} replace />;

    const publisherOnly = (page) => (role === 'journalist' ? page : denied);

    let dashboard = denied;
    if (role === 'journalist') dashboard = <Navigate to="/publisher" replace />;
    if (role === 'editor' || role === 'admin') dashboard = <Dashboard {...shared} />;

    return (
        <Routes>
            <Route path="/" element={<Home {...shared} />} />
            <Route path="/article/:id" element={<ArticleDetail {...shared} />} />
            <Route path="/bookmarks" element={<Bookmarks {...shared} />} />
            <Route path="/live" element={<Live {...shared} />} />
            <Route path="/feedback" element={<Feedback {...shared} />} />

            <Route path="/dashboard" element={dashboard} />

            <Route path="/publisher" element={publisherOnly(<Overview {...shared} />)} />
            <Route path="/publisher/write" element={publisherOnly(<WriteStory {...shared} />)} />
            <Route path="/publisher/write/:id" element={publisherOnly(<WriteStory {...shared} />)} />
            <Route path="/publisher/stories" element={publisherOnly(<MyStories {...shared} />)} />

            <Route path="/login" element={session ? toLanding : <Login onLoginSuccess={onLogin} />} />
            <Route path="/register" element={session ? toLanding : <Register />} />
            <Route path="/forgot-password" element={session ? toLanding : <ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={toHome} />
        </Routes>
    );
}