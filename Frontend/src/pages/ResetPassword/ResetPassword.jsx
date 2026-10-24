import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import PasswordField from '../../components/common/PasswordField';
import { validatePassword, validateConfirmPassword } from '../../utils/validators';
import { resetPassword } from '../../services/authService';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({ password: '', confirmPassword: '' });
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
            password: validatePassword(form.password),
            confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
        };
        setErrors(nextErrors);
        if (nextErrors.password || nextErrors.confirmPassword) return;

        setLoading(true);
        try {
            await resetPassword(token, form.password);
            navigate('/login', {
                state: { message: 'Password updated. Log in with your new password.' },
            });
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Set a new password"
            subtitle="Choose a password you have not used before."
            footer={
                <>
                    Link not working? <Link className="link" to="/forgot-password">Request a new one</Link>
                </>
            }
        >
            {formError && <div className="alert" role="alert">{formError}</div>}

            <form onSubmit={handleSubmit} noValidate>
                <PasswordField
                    id="password"
                    label="New password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                />

                <PasswordField
                    id="confirmPassword"
                    label="Confirm new password"
                    autoComplete="new-password"
                    placeholder="Enter the password again"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                />

                <button className="btn" type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update password'}
                </button>
            </form>
        </AuthLayout>
    );
}