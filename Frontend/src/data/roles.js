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
        label: 'Journalist',
        isDefault: false,
        description: 'Report and write stories and send them to an editor for review.',
    },
    {
        value: 'editor',
        label: 'Editor',
        isDefault: false,
        description: 'Review stories and approve, reject or ask for changes.',
    },
    {
        value: 'publisher',
        isDefault: false,
        label: 'Publisher',
        description: 'Publish editor-approved stories and verify role requests.',
    },
];

export const SELECTABLE_ROLES = ROLE_OPTIONS.map((r) => r.value);

export const ROLE_LABELS = {
    reader: 'Reader',
    journalist: 'Journalist',
    editor: 'Editor',
    publisher: 'Publisher',
    admin: 'Admin',
};

export const HOME_BY_ROLE = {
    reader: '/',
    publisher: '/publisher',
    journalist: '/dashboard',

    editor: '/dashboard',
    admin: '/dashboard',
};