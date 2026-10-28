import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import InputField from '../../components/common/InputField';
import PasswordField from '../../components/common/PasswordField';
import { validateEmail, validatePassword } from '../../utils/validators';
import { login, saveSession, isDemoMode } from '../../services/authService';
import '../../style/Login.css';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message;

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    try {
      const session = await login(form);
      saveSession(session, form.remember);
      onLoginSuccess(session);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="login"
      title="Log in"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <>
          New here? <Link className="link" to="/register">Create an account</Link>
        </>
      }
    >
      {notice && <div className="notice" role="status">{notice}</div>}
      {formError && <div className="alert" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="row">
          <label className="check">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
            />
            Keep me logged in
          </label>
          <Link className="link" to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {isDemoMode && (
        <p className="demo">
          Demo mode: use editor@news.com (or reader, journalist, admin) with password123.
        </p>
      )}
    </AuthLayout>
  );
}