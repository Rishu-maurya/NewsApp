export const DEFAULT_ROLE = 'reader';

export const ROLE_OPTIONS = [
    {
        value: 'reader',
        label: 'Reader',
        isDefault: true,
        description: 'Read news, watch live videos, like, save and comment.',
    },
    {
        value: 'journalist',
        label: 'Publisher',
        isDefault: false,
        description: 'Write stories and send them to an editor for review.',
    },
    {
        value: 'editor',
        label: 'Editor',
        isDefault: false,
        description: 'Review stories and approve, reject or ask for changes.',
    },
];

export const SELECTABLE_ROLES = ROLE_OPTIONS.map((r) => r.value);

export const ROLE_LABELS = {
    reader: 'Reader',
    journalist: 'Publisher',
    editor: 'Editor',
    admin: 'Admin',
};

export const HOME_BY_ROLE = {
    reader: '/',
    journalist: '/publisher',
    editor: '/dashboard',
    admin: '/dashboard',
};