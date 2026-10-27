import { Link } from 'react-router-dom';
import '../../style/LoginPrompt.css';

export default function LoginPrompt({ message }) {
    return (
        <div className="s-prompt">
            <p>{message}</p>
            <div className="s-row">
                <Link to="/login" className="s-btn s-btn--solid">Sign in</Link>
            </div>
        </div>
    );
}