// Helpers for story bodies. A body is either plain text (journalists type into a
// textarea) or a small, sanitized subset of HTML (editors use the rich editor).

const ALLOWED_TAGS = new Set([
    'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'H1', 'H2', 'H3',
    'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'SPAN', 'DIV', 'FONT', 'SUB', 'SUP', 'HR',
]);
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE']);
const ALLOWED_STYLES = new Set([
    'color', 'background-color', 'text-align', 'font-size', 'font-weight',
    'font-style', 'text-decoration', 'text-decoration-line', 'margin-left', 'padding-left',
]);

export const hasMarkup = (value = '') => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cleanStyle(value) {
    return value
        .split(';')
        .map((rule) => rule.trim())
        .filter(Boolean)
        .filter((rule) => {
            const [prop, ...rest] = rule.split(':');
            const val = rest.join(':').toLowerCase();
            return ALLOWED_STYLES.has(prop.trim().toLowerCase()) && !/url\(|expression|javascript|@import/.test(val);
        })
        .join('; ');
}

function cleanNode(node) {
    [...node.childNodes].forEach((child) => {
        if (child.nodeType === 8) {
            child.remove();
            return;
        }
        if (child.nodeType !== 1) return;

        if (DROP_WITH_CONTENT.has(child.tagName)) {
            child.remove();
            return;
        }
        cleanNode(child);

        if (!ALLOWED_TAGS.has(child.tagName)) {
            child.replaceWith(...child.childNodes);
            return;
        }

        const keep = {};
        if (child.tagName === 'A') {
            const href = child.getAttribute('href') || '';
            if (/^(https?:|mailto:)/i.test(href.trim())) keep.href = href.trim();
        }
        if (child.tagName === 'FONT') {
            ['size', 'color'].forEach((attr) => {
                if (child.getAttribute(attr)) keep[attr] = child.getAttribute(attr);
            });
        }
        const style = cleanStyle(child.getAttribute('style') || '');
        if (style) keep.style = style;

        [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
        Object.entries(keep).forEach(([name, val]) => child.setAttribute(name, val));
        if (child.tagName === 'A' && keep.href) {
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

export function sanitizeHtml(html = '') {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    cleanNode(doc.body);
    return doc.body.innerHTML;
}

// Anything stored as plain text becomes paragraphs; markup is sanitized.
export function bodyToHtml(body = '') {
    if (hasMarkup(body)) return sanitizeHtml(body);
    return body
        .split(/\n{2,}|\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('');
}

const BLOCK_END = /<\/(p|div|li|h[1-6]|blockquote)>|<br\s*\/?>/gi;

export function bodyToText(body = '') {
    if (!hasMarkup(body)) return body;
    const spaced = sanitizeHtml(body).replace(BLOCK_END, ' ');
    const doc = new DOMParser().parseFromString(`<body>${spaced}</body>`, 'text/html');
    return doc.body.textContent.replace(/\s+/g, ' ').trim();
}

// Plain text with paragraph breaks, used to show an edited story in a textarea.
export function bodyToPlain(body = '') {
    if (!hasMarkup(body)) return body;
    const spaced = sanitizeHtml(body).replace(BLOCK_END, '\n\n');
    const doc = new DOMParser().parseFromString(`<body>${spaced}</body>`, 'text/html');
    return doc.body.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

export const wordCount = (body = '') => {
    const text = bodyToText(body);
    return text ? text.split(/\s+/).length : 0;
};

export const readMinutes = (body = '') => Math.max(1, Math.round(wordCount(body) / 200));
