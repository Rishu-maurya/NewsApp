import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home/Home';
import ArticleDetail from '../pages/Article/ArticleDetail';
import Live from '../pages/Live/Live';
import Feedback from '../pages/Feedback/Feedback';
import Dashboard from '../pages/Dashboard/Dashboard';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';

const STAFF = ['journalist', 'editor', 'admin'];

export default function AppRoutes({ session, onLogin, onLogout }) {
    const home = <Navigate to="/" replace />;
    const shared = { session, onLogout };
    const isStaff = session && STAFF.includes(session.user.role);

    return (
        <Routes>
            <Route path="/" element={<Home {...shared} />} />
            <Route path="/article/:id" element={<ArticleDetail {...shared} />} />
            <Route path="/live" element={<Live {...shared} />} />
            <Route path="/feedback" element={<Feedback {...shared} />} />
            <Route
                path="/dashboard"
                element={
                    isStaff ? (
                        <Dashboard {...shared} />
                    ) : (
                        <Navigate to={session ? '/' : '/login'} replace />
                    )
                }
            />
            <Route path="/login" element={session ? home : <Login onLoginSuccess={onLogin} />} />
            <Route path="/register" element={session ? home : <Register />} />
            <Route path="/forgot-password" element={session ? home : <ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={home} />
        </Routes>
    );
}