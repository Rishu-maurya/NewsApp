import { useEffect, useState } from 'react';
import { useArticles } from '../../../context/ArticlesContext';
import { useActivity } from '../../../context/ActivityContext';
import { CATEGORIES, STATUS_LABELS } from '../../../data/dummyData';
import { getMyArticles } from '../../../services/publisherService';
import { Widget, BarList, Ring, QuickLinks, Checklist, Feed, TipRotator, Steps } from './Widgets';

const TONE_BY_STATUS = {
    published: 'green', submitted: 'amber', changes_requested: 'amber',
    rejected: 'red', draft: 'grey', approved: 'blue',
};
const byStatus = (list, s) => list.filter((a) => a.status === s).length;
const feedFrom = (list) => list.map((a) => ({
    title: a.title,
    meta: `${STATUS_LABELS[a.status] || a.status}${a.date ? ` · ${a.date}` : ''}`,
    tone: TONE_BY_STATUS[a.status] || 'blue',
}));
const categoryRows = (list) =>
    CATEGORIES.map((c) => ({ label: c, value: list.filter((a) => a.category === c).length })).filter((r) => r.value > 0);

function AdminSide() {
    const { articles } = useArticles();
    const { reports } = useActivity();
    const handled = reports.filter((r) => r.status !== 'open').length;
    return (
        <>
            <Widget title="Content pipeline" icon="chart">
                <BarList rows={[
                    { label: 'Published', value: byStatus(articles, 'published'), tone: 'green' },
                    { label: 'In review', value: byStatus(articles, 'submitted'), tone: 'amber' },
                    { label: 'Changes', value: byStatus(articles, 'changes_requested'), tone: 'blue' },
                    { label: 'Rejected', value: byStatus(articles, 'rejected'), tone: 'red' },
                    { label: 'Drafts', value: byStatus(articles, 'draft'), tone: 'grey' },
                ]} />
            </Widget>
            <Widget title="Report resolution" icon="flag">
                <Ring value={handled} total={reports.length} label="Reports handled" tone="green" />
            </Widget>
            <Widget title="Latest stories" icon="clock">
                <Feed items={feedFrom(articles.slice(0, 4))} />
            </Widget>
            <Widget title="Quick actions" icon="spark">
                <QuickLinks links={[
                    { to: '/live', label: 'Live coverage', hint: 'See what is on air', icon: 'live' },
                    { to: '/categories', label: 'Browse categories', hint: 'Check the public site', icon: 'grid' },
                    { to: '/profile', label: 'My profile', hint: 'Update your details', icon: 'user' },
                ]} />
            </Widget>
        </>
    );
}

function EditorSide() {
    const { articles } = useArticles();
    const pending = articles.filter((a) => a.status === 'submitted');
    const decided = articles.filter((a) => ['published', 'changes_requested', 'rejected'].includes(a.status)).length;
    const approved = byStatus(articles, 'published');
    return (
        <>
            <Widget title="Review progress" icon="check">
                <Ring value={decided} total={decided + pending.length} label="Decisions made" sub={`${pending.length} still waiting`} />
            </Widget>
            <Widget title="Approval rate" icon="chart">
                <Ring value={approved} total={decided} label="Approved" tone="green" sub={`${approved} of ${decided} decisions`} />
            </Widget>
            <Widget title="Waiting by category" icon="grid">
                <BarList rows={categoryRows(pending)} empty="Queue is clear." />
            </Widget>
            <Widget title="Before you approve" icon="check">
                <Checklist items={[
                    'Facts and numbers are verified',
                    'Headline matches the story',
                    'Sources and quotes are credited',
                    'Tone is neutral and fair',
                    'Spelling and names are correct',
                ]} />
            </Widget>
        </>
    );
}

function JournalistSide({ session }) {
    const { articles } = useArticles();
    const mine = articles.filter((a) => a.authorEmail === session.user.email);
    const upcoming = mine.filter((a) => a.publishDate).sort((a, b) => a.publishDate.localeCompare(b.publishDate)).slice(0, 3);
    return (
        <>
            <Widget title="Your pipeline" icon="chart">
                <Steps steps={[
                    { label: 'Drafts', value: byStatus(mine, 'draft') },
                    { label: 'In review', value: byStatus(mine, 'submitted') },
                    { label: 'Published', value: byStatus(mine, 'published') },
                ]} />
            </Widget>
            <Widget title="Publish rate" icon="check">
                <Ring value={byStatus(mine, 'published')} total={mine.length} label="Stories published" tone="green" />
            </Widget>
            <Widget title="Scheduled" icon="calendar">
                <Feed
                    empty="No scheduled stories. Add a publish date to plan ahead."
                    items={upcoming.map((a) => ({ title: a.title, meta: `${a.publishDate}${a.publishTime ? ` · ${a.publishTime}` : ''}`, tone: 'blue' }))}
                />
            </Widget>
            <Widget title="Writing tips" icon="pen">
                <TipRotator tips={[
                    'Lead with the most important fact in the first sentence.',
                    'Keep headlines under 12 words and avoid clickbait.',
                    'Attribute every quote and cross-check every number.',
                    'Short paragraphs read better on a phone.',
                ]} />
            </Widget>
        </>
    );
}

function PublisherSide() {
    const [mine, setMine] = useState([]);
    useEffect(() => {
        let off = false;
        getMyArticles().then((r) => { if (!off) setMine(r); }).catch(() => {});
        return () => { off = true; };
    }, []);
    return (
        <>
            <Widget title="Quick actions" icon="spark">
                <QuickLinks links={[
                    { to: '/publisher/write', label: 'Write a story', hint: 'Start a new draft', icon: 'pen' },
                    { to: '/publisher/stories', label: 'Manage stories', hint: 'Edit, submit, delete', icon: 'list' },
                    { to: '/profile', label: 'My profile', hint: 'Update your details', icon: 'user' },
                ]} />
            </Widget>
            <Widget title="Your story pipeline" icon="chart">
                <BarList empty="Write your first story to see this." rows={[
                    { label: 'Published', value: byStatus(mine, 'published'), tone: 'green' },
                    { label: 'In review', value: byStatus(mine, 'submitted'), tone: 'amber' },
                    { label: 'Changes', value: byStatus(mine, 'changes_requested'), tone: 'blue' },
                    { label: 'Drafts', value: byStatus(mine, 'draft'), tone: 'grey' },
                    { label: 'Rejected', value: byStatus(mine, 'rejected'), tone: 'red' },
                ]} />
            </Widget>
            <Widget title="Reviewing role requests" icon="check">
                <Checklist items={[
                    'Name and email look genuine',
                    'Requested role matches the person',
                    'Add a clear reason when rejecting',
                ]} />
            </Widget>
            <Widget title="Publisher tip" icon="pen">
                <TipRotator tips={[
                    'Approve role requests quickly so new writers can start.',
                    'Schedule stories for peak reading hours, mornings and evenings.',
                    'Always leave a short note when you reject a request.',
                ]} />
            </Widget>
        </>
    );
}

function ReaderSide() {
    const { articles } = useArticles();
    const published = articles.filter((a) => a.status === 'published');
    return (
        <>
            <Widget title="Trending categories" icon="chart">
                <BarList rows={categoryRows(published)} empty="No stories yet." />
            </Widget>
            <Widget title="Top stories" icon="clock">
                <Feed items={feedFrom(published.slice(0, 4))} />
            </Widget>
            <Widget title="Explore" icon="spark">
                <QuickLinks links={[
                    { to: '/live', label: 'Live coverage', hint: 'Events happening now', icon: 'live' },
                    { to: '/categories', label: 'Categories', hint: 'Pick a topic', icon: 'grid' },
                    { to: '/bookmarks', label: 'Saved stories', hint: 'Read it later', icon: 'list' },
                ]} />
            </Widget>
        </>
    );
}

const SIDES = { admin: AdminSide, editor: EditorSide, journalist: JournalistSide, publisher: PublisherSide, reader: ReaderSide };

export default function RoleSide({ session }) {
    const Side = SIDES[session.user.role] || ReaderSide;
    return <Side session={session} />;
}
