import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import InputField from '../../components/common/InputField';
import PasswordField from '../../components/common/PasswordField';
import RoleSelect from '../../components/common/RoleSelect';
import { DEFAULT_ROLE, ROLE_OPTIONS } from '../../data/roles';
import {
    validateName,
    validateEmail,
    validatePhone,
    validatePassword,
    validateConfirmPassword,
} from '../../utils/validators';
import { register } from '../../services/authService';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: DEFAULT_ROLE,
        organization: '',
    });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
        setForm((prev) => ({ ...prev, [name]: next }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setFormError('');
    };

    const finishRegistration = (role) => {
        const roleLabel = ROLE_OPTIONS.find((option) => option.value === role)?.label || 'Reader';
        navigate('/login', {
            state: {
                message: role === DEFAULT_ROLE
                    ? 'Account created as Reader. Log in to continue.'
                    : `Account created as Reader. Your ${roleLabel} role request was submitted for review. Log in to continue.`,
            },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = {
            name: validateName(form.name),
            email: validateEmail(form.email),
            phone: validatePhone(form.phone),
            password: validatePassword(form.password),
            confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
            organization: form.role !== DEFAULT_ROLE && !form.organization.trim()
                ? 'Enter your organization for a role request.'
                : '',
        };
        setErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        setLoading(true);
        try {
            await register(form);
            finishRegistration(form.role);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
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

                <InputField
                    id="phone"
                    label={<>Mobile number <span className="label-optional">(optional)</span></>}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10 digit mobile number"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                />

                <RoleSelect value={form.role} onChange={handleChange} />

                {form.role !== DEFAULT_ROLE && (
                    <InputField
                        id="organization"
                        label="Organization"
                        type="text"
                        autoComplete="organization"
                        placeholder="Your news organization"
                        value={form.organization}
                        onChange={handleChange}
                        error={errors.organization}
                    />
                )}

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