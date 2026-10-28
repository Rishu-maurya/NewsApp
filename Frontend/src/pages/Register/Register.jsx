import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import InputField from '../../components/common/InputField';
import PasswordField from '../../components/common/PasswordField';
import {
    validateName,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
} from '../../utils/validators';
import { register, saveSession } from '../../services/authService';
import '../../style/Register.css';

export default function Register({ onRegistrationSuccess }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = {
            name: validateName(form.name),
            email: validateEmail(form.email),
            password: validatePassword(form.password),
            confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
        };
        setErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        setLoading(true);
        try {
            const session = await register(form);
            saveSession(session, false);
            onRegistrationSuccess(session);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            variant="register"
            title="Create account"
            subtitle="Join to read, save and comment on news."
            footer={
                <>
                    Already have an account? <Link className="link" to="/login">Log in</Link>
                </>
            }
        >
            {formError && <div className="alert" role="alert">{formError}</div>}

            <form onSubmit={handleSubmit} noValidate>
                <InputField
                    id="name"
                    label="Full name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                />

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
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                />

                <PasswordField
                    id="confirmPassword"
                    label="Confirm password"
                    autoComplete="new-password"
                    placeholder="Enter the password again"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                />

                <button className="btn" type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
                </button>
            </form>
        </AuthLayout>
    );
}