import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'news_dummy_profiles';
const Ctx = createContext(null);

const SEED = {
    profiles: {
        'reader@news.com': { name: 'Riya', username: 'riya', bio: 'I read city and sports news every morning.', photo: '' },
        'neha@news.com': { name: 'Neha Kulkarni', username: 'neha', bio: 'Office goer. Metro news is my thing.', photo: '' },
        'sameer@news.com': { name: 'Sameer Deshmukh', username: 'sameer', bio: 'Sports fan.', photo: '' },
    },
    friends: {
        'reader@news.com': ['neha@news.com'],
        'neha@news.com': ['reader@news.com'],
    },
};

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        return saved && saved.profiles && saved.friends ? saved : SEED;
    } catch {
        return SEED;
    }
}

function makeUsername(email, profiles) {
    let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (base.length < 3) base = `${base}user`;
    base = base.slice(0, 16);
    const taken = new Set(Object.values(profiles).map((p) => p.username));
    let name = base;
    let n = 1;
    while (taken.has(name)) name = `${base}${n++}`;
    return name;
}

export function ProfileProvider({ user, children }) {
    const [data, setData] = useState(load);
    const email = user?.email;
    const name = user?.name;

    useEffect(() => {
        localStorage.setItem(KEY, JSON.stringify(data));
    }, [data]);

    // Pehli baar login par user ki profile apne aap ban jaati hai
    useEffect(() => {
        if (!email) return;
        setData((prev) => {
            if (prev.profiles[email]) return prev;
            return {
                ...prev,
                profiles: {
                    ...prev.profiles,
                    [email]: { name, username: makeUsername(email, prev.profiles), bio: '', photo: '' },
                },
            };
        });
    }, [email, name]);

    // Error text return karta hai, sab theek ho to khaali string
    const updateProfile = (targetEmail, { name: nextName, username, bio, photo }) => {
        const n = nextName.trim();
        const u = username.trim().toLowerCase();
        if (n.length < 2) return 'Name must have at least 2 characters.';
        if (!/^[a-z0-9_.]{3,20}$/.test(u)) {
            return 'Username must be 3 to 20 characters: letters, numbers, dot or underscore.';
        }
        const taken = Object.entries(data.profiles).some(
            ([e, p]) => e !== targetEmail && p.username === u
        );
        if (taken) return 'This username is already taken. Try another one.';
        if (bio.length > 150) return 'Bio can be at most 150 characters.';

        setData((prev) => ({
            ...prev,
            profiles: {
                ...prev.profiles,
                [targetEmail]: { ...prev.profiles[targetEmail], name: n, username: u, bio: bio.trim(), photo },
            },
        }));
        return '';
    };

    // Dono taraf se friend ban/hat jaate hain
    const toggleFriend = (me, other) =>
        setData((prev) => {
            const mine = prev.friends[me] || [];
            const theirs = prev.friends[other] || [];
            const already = mine.includes(other);
            return {
                ...prev,
                friends: {
                    ...prev.friends,
                    [me]: already ? mine.filter((e) => e !== other) : [...mine, other],
                    [other]: already ? theirs.filter((e) => e !== me) : [...theirs.filter((e) => e !== me), me],
                },
            };
        });

    const value = {
        profiles: data.profiles,
        friends: data.friends,
        updateProfile,
        toggleFriend,
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfiles() {
    return useContext(Ctx);
}