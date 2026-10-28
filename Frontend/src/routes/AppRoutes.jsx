import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home/Home';
import ArticleDetail from '../pages/Article/ArticleDetail';
import Bookmarks from '../pages/Bookmarks/Bookmarks';
import Live from '../pages/Live/Live';
import Feedback from '../pages/Feedback/Feedback';
import Dashboard from '../pages/Dashboard/Dashboard';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import About from '../pages/About/About';
import Contact from '../pages/Contact/Contact';
import Categories from '../pages/Categories/Categories';
import CategoryDetail from '../pages/Categories/CategoryDetail';
import Profile from '../pages/Profile/Profile';
import Report from '../pages/Report/Report';
import NotFound from '../pages/NotFound/NotFound';

export default function AppRoutes({ session, onLogin, onLogout }) {
    const dashboard = <Navigate to="/dashboard" replace />;
    const shared = { session, onLogout };

    return (
        <Routes>
            <Route path="/" element={<Home {...shared} />} />
            <Route path="/article/:id" element={<ArticleDetail {...shared} />} />
            <Route path="/bookmarks" element={<Bookmarks {...shared} />} />
            <Route path="/live" element={<Live {...shared} />} />
            <Route path="/feedback" element={<Feedback {...shared} />} />
            <Route path="/about" element={<About {...shared} />} />
            <Route path="/contact" element={<Contact {...shared} />} />
            <Route path="/categories" element={<Categories {...shared} />} />
            <Route path="/category/:category" element={<CategoryDetail {...shared} />} />
            <Route path="/profile" element={<Profile {...shared} />} />
            <Route path="/report" element={<Report {...shared} />} />
            <Route
                path="/dashboard"
                element={session ? <Dashboard {...shared} /> : <Navigate to="/login" replace />}
            />
            <Route path="/login" element={session ? dashboard : <Login onLoginSuccess={onLogin} />} />
            <Route path="/register" element={session ? dashboard : <Register onRegistrationSuccess={onLogin} />} />
            <Route path="/forgot-password" element={session ? dashboard : <ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<NotFound {...shared} />} />
        </Routes>
    );
}