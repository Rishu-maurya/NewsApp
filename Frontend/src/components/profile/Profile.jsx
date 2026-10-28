import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import LoginPrompt from '../../components/news/LoginPrompt';
import Avatar from '../../components/profile/Avtar';
import EditProfileForm from '../../components/profile/EditProfileForm';
import { useProfiles } from '../../context/ProfileContext';
import { useActivity } from '../../context/ActivityContext';

const profilePath = (email) => `/profile/${encodeURIComponent(email)}`;

export default function Profile({ session, onLogout }) {
    const { email: param } = useParams();
    const { profiles, friends, updateProfile, toggleFriend } = useProfiles();
    const { comments } = useActivity();
    const [editing, setEditing] = useState(false);
    const [done, setDone] = useState(false);

    if (!session) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Profile</h1>
                <p className="s-sub">Manage your photo, bio and friends.</p>
                <LoginPrompt message="Sign in to see and edit your profile." />
            </SiteLayout>
        );
    }

    const myEmail = session.user.email;
    const email = param || myEmail;
    const isMe = email === myEmail;

    const profile =
        profiles[email] ||
        (isMe ? { name: session.user.name, username: '', bio: '', photo: '' } : null);

    if (!profile) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <div className="s-empty">
                    <p>This profile could not be found.</p>
                    <Link to="/profile" className="s-btn">Go to my profile</Link>
                </div>
            </SiteLayout>
        );
    }

    const friendEmails = (friends[email] || []).filter((e) => profiles[e]);
    const myFriends = friends[myEmail] || [];
    const isFriend = myFriends.includes(email);
    const commentCount = comments.filter((c) => c.email === email).length;

    const suggestions = isMe
        ? Object.keys(profiles).filter((e) => e !== myEmail && !myFriends.includes(e))
        : [];

    const handleSave = (form) => {
        const problem = updateProfile(email, form);
        if (!problem) {
            setEditing(false);
            setDone(true);
        }
        return problem;
    };

    const PersonRow = ({ personEmail }) => {
        const p = profiles[personEmail];
        const mine = personEmail === myEmail;
        const already = myFriends.includes(personEmail);
        return (
            <li className="s-person">
                <Link to={profilePath(personEmail)} className="s-person__link">
                    <Avatar profile={p} size={44} />
                    <span>
                        <strong>{p.name}</strong>
                        <span className="s-muted"> @{p.username}</span>
                    </span>
                </Link>
                {!mine && (
                    <button type="button" className="s-btn" onClick={() => toggleFriend(myEmail, personEmail)}>
                        {already ? 'Remove' : 'Add friend'}
                    </button>
                )}
            </li>
        );
    };

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-article">
                {done && !editing && (
                    <p className="s-note" role="status">Your profile has been updated.</p>
                )}

                {editing ? (
                    <EditProfileForm
                        profile={profile}
                        onSave={handleSave}
                        onCancel={() => setEditing(false)}
                    />
                ) : (
                    <section className="s-profile">
                        <Avatar profile={profile} size={96} />
                        <div className="s-profile__info">
                            <h1 className="s-h1">{profile.name}</h1>
                            <p className="s-muted">@{profile.username || 'set-a-username'}</p>
                            {profile.bio ? (
                                <p className="s-profile__bio">{profile.bio}</p>
                            ) : (
                                isMe && <p className="s-muted">You have not written a bio yet.</p>
                            )}

                            <p className="s-meta">
                                <span><strong>{friendEmails.length}</strong> friends</span>
                                <span><strong>{commentCount}</strong> comments</span>
                            </p>

                            <div className="s-row">
                                {isMe ? (
                                    <button
                                        type="button"
                                        className="s-btn s-btn--solid"
                                        onClick={() => {
                                            setDone(false);
                                            setEditing(true);
                                        }}
                                    >
                                        Edit profile
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={`s-btn${isFriend ? '' : ' s-btn--solid'}`}
                                        onClick={() => toggleFriend(myEmail, email)}
                                    >
                                        {isFriend ? 'Friends (tap to remove)' : 'Add friend'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <section className="s-block">
                    <h2 className="s-h2">Friends ({friendEmails.length})</h2>
                    {friendEmails.length === 0 ? (
                        <p className="s-muted">
                            {isMe ? 'You have no friends yet. Add some from the list below.' : 'No friends to show.'}
                        </p>
                    ) : (
                        <ul className="s-people">
                            {friendEmails.map((e) => (
                                <PersonRow key={e} personEmail={e} />
                            ))}
                        </ul>
                    )}
                </section>

                {isMe && (
                    <section className="s-block">
                        <h2 className="s-h2">People you may know</h2>
                        {suggestions.length === 0 ? (
                            <p className="s-muted">No more people to suggest right now.</p>
                        ) : (
                            <ul className="s-people">
                                {suggestions.map((e) => (
                                    <PersonRow key={e} personEmail={e} />
                                ))}
                            </ul>
                        )}
                    </section>
                )}
            </div>
        </SiteLayout>
    );
}