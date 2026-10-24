import { useState } from 'react';
import InputField from './InputField';

export default function PasswordField({ id = 'password', label = 'Password', ...props }) {
    const [show, setShow] = useState(false);

    return (
        <InputField
            id={id}
            label={label}
            type={show ? 'text' : 'password'}
            rightSlot={
                <button
                    type="button"
                    className="toggle"
                    onClick={() => setShow((s) => !s)}
                    aria-pressed={show}
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? 'Hide' : 'Show'}
                </button>
            }
            {...props}
        />
    );
}