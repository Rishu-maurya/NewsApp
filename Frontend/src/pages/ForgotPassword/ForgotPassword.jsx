import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import InputField from '../../components/common/InputField';
import { validateEmail } from '../../utils/validators';
import { forgotPassword, isDemoMode } from '../../services/authService';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleChange = (e) => {
        setEmail(e.target.value);
        setError('');
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(email);
        setError(emailError);
        if (emailError) return;

        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter your email and we will send you a reset link."
            footer={<Link className="link" to="/login">Back to log in</Link>}
        >
            {sent ? (
                <>
                    <div className="notice" role="status">
                        If this email is registered, we have sent a reset link. Check your inbox.
                    </div>
                    {isDemoMode && (
                        <p className="demo">
                            Demo mode: no email is sent. Open{' '}
                            <Link className="link" to="/reset-password/demo-token">the reset page</Link>{' '}
                            to try the next step.
                        </p>
                    )}
                </>
            ) : (
                <>
                    {formError && <div className="alert" role="alert">{formError}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        <InputField
                            id="email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={handleChange}
                            error={error}
                        />

                        <button className="btn" type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                </>
            )}
        </AuthLayout>
    );
}