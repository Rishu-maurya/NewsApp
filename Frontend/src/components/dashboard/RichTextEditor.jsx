import { useCallback, useEffect, useRef, useState } from 'react';
import { bodyToHtml, sanitizeHtml, wordCount } from '../../utils/richText';
import '../../style/RichTextEditor.css';

const ICONS = {
    undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
    redo: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
    ul: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
    ol: 'M10 6h11M10 12h11M10 18h11M4 5l1-1v4M4 14h2l-2 3h2',
    left: 'M3 6h18M3 12h12M3 18h16',
    center: 'M3 6h18M7 12h10M5 18h14',
    right: 'M3 6h18M9 12h12M5 18h16',
    justify: 'M3 6h18M3 12h18M3 18h18',
    outdent: 'M7 8 3 12l4 4M21 6H11M21 12h-6M21 18H11',
    indent: 'm3 8 4 4-4 4M21 6H11M21 12h-6M21 18H11',
    link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
    clear: 'M5 5l14 14M9 4h10M14 4l-2.5 6M8 20h8M10 14 8 20',
    quote: 'M7 17h3l2-4V7H6v6h3M16 17h3l2-4V7h-6v6h3',
};

function Icon({ name }) {
    return (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONS[name]} />
        </svg>
    );
}

const BLOCKS = [
    ['p', 'Paragraph'],
    ['h1', 'Heading 1'],
    ['h2', 'Heading 2'],
    ['h3', 'Heading 3'],
    ['blockquote', 'Quote'],
];
// execCommand fontSize takes 1-7
const SIZES = [['2', 'Small'], ['3', 'Normal'], ['5', 'Large'], ['6', 'Huge']];

export default function RichTextEditor({ value, onChange }) {
    const editorRef = useRef(null);
    const savedRange = useRef(null);
    const [active, setActive] = useState({});
    const [block, setBlock] = useState('p');
    const [words, setWords] = useState(0);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('https://');

    // The editor owns its DOM while open; load the story once.
    useEffect(() => {
        const el = editorRef.current;
        el.innerHTML = bodyToHtml(value) || '<p><br></p>';
        setWords(wordCount(el.innerHTML));
        try { document.execCommand('styleWithCSS', false, true); } catch { /* ignore */ }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const emit = useCallback(() => {
        const html = editorRef.current.innerHTML;
        setWords(wordCount(html));
        onChange(html);
    }, [onChange]);

    const refreshState = useCallback(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount || !editorRef.current.contains(sel.anchorNode)) return;
        const next = {};
        ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList',
            'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].forEach((cmd) => {
            try { next[cmd] = document.queryCommandState(cmd); } catch { next[cmd] = false; }
        });
        setActive(next);
        try {
            const fmt = String(document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, '');
            setBlock(BLOCKS.some(([tag]) => tag === fmt) ? fmt : 'p');
        } catch { setBlock('p'); }
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', refreshState);
        return () => document.removeEventListener('selectionchange', refreshState);
    }, [refreshState]);

    const run = (command, arg = null) => {
        editorRef.current.focus();
        document.execCommand(command, false, arg);
        emit();
        refreshState();
    };

    const keepSelection = (event) => event.preventDefault();

    const handlePaste = (event) => {
        event.preventDefault();
        const html = event.clipboardData.getData('text/html');
        const text = event.clipboardData.getData('text/plain');
        const clean = html ? sanitizeHtml(html) : bodyToHtml(text);
        document.execCommand('insertHTML', false, clean);
        emit();
    };

    const openLink = () => {
        const sel = window.getSelection();
        if (sel.rangeCount && editorRef.current.contains(sel.anchorNode)) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
        setLinkOpen((open) => !open);
    };

    const applyLink = (event) => {
        event.preventDefault();
        const url = linkUrl.trim();
        if (!/^(https?:\/\/|mailto:)/i.test(url)) return;
        const sel = window.getSelection();
        editorRef.current.focus();
        if (savedRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
        document.execCommand('createLink', false, url);
        setLinkOpen(false);
        setLinkUrl('https://');
        emit();
    };

    const Btn = ({ cmd, arg, icon, label, children }) => (
        <button
            type="button"
            className={`rte__btn${active[cmd] ? ' is-on' : ''}`}
            title={label}
            aria-label={label}
            aria-pressed={cmd in active ? Boolean(active[cmd]) : undefined}
            onMouseDown={keepSelection}
            onClick={() => run(cmd, arg)}
        >
            {icon ? <Icon name={icon} /> : children}
        </button>
    );

    return (
        <div className="rte">
            <div className="rte__toolbar" role="toolbar" aria-label="Text formatting">
                <div className="rte__group">
                    <Btn cmd="undo" icon="undo" label="Undo (Ctrl+Z)" />
                    <Btn cmd="redo" icon="redo" label="Redo (Ctrl+Y)" />
                </div>

                <div className="rte__group">
                    <select
                        className="rte__select"
                        aria-label="Paragraph style"
                        value={block}
                        onChange={(e) => run('formatBlock', e.target.value)}
                    >
                        {BLOCKS.map(([tag, label]) => <option key={tag} value={tag}>{label}</option>)}
                    </select>
                    <select
                        className="rte__select rte__select--size"
                        aria-label="Font size"
                        defaultValue="3"
                        onChange={(e) => run('fontSize', e.target.value)}
                    >
                        {SIZES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                </div>

                <div className="rte__group">
                    <Btn cmd="bold" label="Bold (Ctrl+B)"><b>B</b></Btn>
                    <Btn cmd="italic" label="Italic (Ctrl+I)"><i>I</i></Btn>
                    <Btn cmd="underline" label="Underline (Ctrl+U)"><u>U</u></Btn>
                    <Btn cmd="strikeThrough" label="Strikethrough"><s>S</s></Btn>
                    <label className="rte__color" title="Text colour">
                        <span style={{ borderBottomColor: 'var(--rte-text)' }}>A</span>
                        <input type="color" defaultValue="#d71920" aria-label="Text colour"
                            onChange={(e) => run('foreColor', e.target.value)} />
                    </label>
                    <label className="rte__color rte__color--mark" title="Highlight">
                        <span>ab</span>
                        <input type="color" defaultValue="#ffe066" aria-label="Highlight colour"
                            onChange={(e) => run('hiliteColor', e.target.value)} />
                    </label>
                </div>

                <div className="rte__group">
                    <Btn cmd="justifyLeft" icon="left" label="Align left" />
                    <Btn cmd="justifyCenter" icon="center" label="Align centre" />
                    <Btn cmd="justifyRight" icon="right" label="Align right" />
                    <Btn cmd="justifyFull" icon="justify" label="Justify" />
                </div>

                <div className="rte__group">
                    <Btn cmd="insertUnorderedList" icon="ul" label="Bulleted list" />
                    <Btn cmd="insertOrderedList" icon="ol" label="Numbered list" />
                    <Btn cmd="outdent" icon="outdent" label="Decrease indent" />
                    <Btn cmd="indent" icon="indent" label="Increase indent" />
                </div>

                <div className="rte__group">
                    <button type="button" className={`rte__btn${linkOpen ? ' is-on' : ''}`} title="Insert link"
                        aria-label="Insert link" onMouseDown={keepSelection} onClick={openLink}>
                        <Icon name="link" />
                    </button>
                    <Btn cmd="unlink" icon="clear" label="Remove link" />
                    <Btn cmd="removeFormat" label="Clear formatting"><span className="rte__clear">Tx</span></Btn>
                </div>
            </div>

            {linkOpen && (
                <form className="rte__link" onSubmit={applyLink}>
                    <label htmlFor="rte-link-url">Link address</label>
                    <input id="rte-link-url" type="url" value={linkUrl} autoFocus
                        onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" />
                    <button type="submit" className="dbtn dbtn--primary">Apply</button>
                    <button type="button" className="dbtn" onClick={() => setLinkOpen(false)}>Cancel</button>
                </form>
            )}

            <div className="rte__page-wrap">
                <div
                    ref={editorRef}
                    className="rte__page"
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Story text"
                    spellCheck
                    onInput={emit}
                    onPaste={handlePaste}
                    onKeyUp={refreshState}
                    onMouseUp={refreshState}
                />
            </div>

            <p className="rte__status">{words} {words === 1 ? 'word' : 'words'}</p>
        </div>
    );
}
