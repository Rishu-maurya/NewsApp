import { useState } from 'react';
import Avatar from './Avtar';

const MAX_FILE = 5 * 1024 * 1024;

function readPhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const size = 256;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const min = Math.min(img.width, img.height);
                const sx = (img.width - min) / 2;
                const sy = (img.height - min) / 2;
                canvas.getContext('2d').drawImage(img, sx, sy, min, min, 0, 0, size, size);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

export default function EditProfileForm({ profile, onSave, onCancel }) {
    const [form, setForm] = useState({
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        photo: profile.photo,
    });
    const [error, setError] = useState('');

    const change = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const pickPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
        if (file.size > MAX_FILE) return setError('Photo must be smaller than 5 MB.');
        try {
            const photo = await readPhoto(file);
            setForm((prev) => ({ ...prev, photo }));
            setError('');
        } catch {
            setError('Could not read this photo. Try another one.');
        }
    };

    const submit = (e) => {
        e.preventDefault();
        const problem = onSave(form);
        if (problem) setError(problem);
    };

    return (
        <form className="s-edit" onSubmit={submit} noValidate>
            <h2 className="s-h2">Edit profile</h2>
            {error && <p className="s-err" role="alert">{error}</p>}

            <div className="s-edit__photo">
                <Avatar profile={form} size={88} />
                <div className="s-row">
                    <label htmlFor="photo" className="s-btn">Change photo</label>
                    <input
                        id="photo"
                        type="file"
                        accept="image/*"
                        className="s-sr"
                        onChange={pickPhoto}
                    />
                    {form.photo && (
                        <button
                            type="button"
                            className="s-btn"
                            onClick={() => setForm((prev) => ({ ...prev, photo: '' }))}
                        >
                            Remove photo
                        </button>
                    )}
                </div>
            </div>

            <label htmlFor="p-name" className="s-label">Name</label>
            <input
                id="p-name"
                name="name"
                className="s-input s-input--full"
                value={form.name}
                onChange={change}
                maxLength={40}
            />

            <label htmlFor="p-username" className="s-label">Username</label>
            <input
                id="p-username"
                name="username"
                className="s-input s-input--full"
                value={form.username}
                onChange={change}
                maxLength={20}
            />

            <label htmlFor="p-bio" className="s-label">Bio ({form.bio.length}/150)</label>
            <textarea
                id="p-bio"
                name="bio"
                className="s-textarea"
                value={form.bio}
                onChange={change}
                maxLength={150}
                placeholder="Write something about yourself"
            />

            <div className="s-row">
                <button type="submit" className="s-btn s-btn--solid">Save profile</button>
                <button type="button" className="s-btn" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}