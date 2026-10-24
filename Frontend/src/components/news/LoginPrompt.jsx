import { Link } from 'react-router-dom';

export default function LoginPrompt({ message }) {
    return (
        <div className="s-prompt">
            <p>{message}</p>
            <div className="s-row">
                <Link to="/login" className="s-btn s-btn--solid">Log in</Link>
                <Link to="/register" className="s-btn">Create account</Link>
            </div>
        </div>
    );
}