import { useEffect, useState } from 'react';
import { useArticles } from '../../../context/ArticlesContext';
import { CATEGORIES, STATUS_LABELS } from '../../../data/dummyData';
import { getMyArticles, getPublishQueue } from '../../../services/publisherService';
import { getReviewQueue } from '../../../services/editorService';
import { getAdminUsers } from '../../../services/adminService';
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
    const [queue, setQueue] = useState({ pending: [], decided: [], counts: {} });
    const [userTotal, setUserTotal] = useState(0);
    useEffect(() => {
        let cancelled = false;
        Promise.all([getReviewQueue(), getAdminUsers(1, 1)])
            .then(([reviewQueue, userResult]) => {
                if (cancelled) return;
                setQueue(reviewQueue);
                setUserTotal(userResult.pagination.total);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);
    const { counts } = queue;
    return (
        <>
            <Widget title="Content pipeline" icon="chart">
                <BarList rows={[
                    { label: 'Published', value: counts.published || 0, tone: 'green' },
                    { label: 'In review', value: counts.submitted || 0, tone: 'amber' },
                    { label: 'Approved', value: counts.approved || 0, tone: 'blue' },
                    { label: 'Changes', value: counts.changes_requested || 0, tone: 'amber' },
                    { label: 'Rejected', value: counts.rejected || 0, tone: 'red' },
                ]} />
            </Widget>
            <Widget title="Platform accounts" icon="user">
                <Steps steps={[{ label: 'Registered users', value: userTotal }]} />
            </Widget>
            <Widget title="Latest stories" icon="clock">
                <Feed items={feedFrom(queue.decided.slice(0, 4))} empty="No reviewed stories yet." />
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
    const [queue, setQueue] = useState({ pending: [], decided: [], counts: {} });
    useEffect(() => {
        let cancelled = false;
        getReviewQueue().then((result) => {
            if (!cancelled) setQueue(result);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);
    const { pending, counts } = queue;
    const decided = ['approved', 'published', 'changes_requested', 'rejected']
        .reduce((total, status) => total + (counts[status] || 0), 0);
    const approved = (counts.approved || 0) + (counts.published || 0);
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
    const [mine, setMine] = useState([]);
    useEffect(() => {
        let cancelled = false;
        getMyArticles().then((result) => {
            if (!cancelled) setMine(result);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);
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
    const [publishQueue, setPublishQueue] = useState([]);
    useEffect(() => {
        let cancelled = false;
        Promise.all([getMyArticles(), getPublishQueue()])
            .then(([stories, approvedStories]) => {
                if (cancelled) return;
                setMine(stories);
                setPublishQueue(approvedStories);
            })
            .catch(() => {});
        return () => { cancelled = true; };
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
                    { label: 'Ready to publish', value: publishQueue.length, tone: 'blue' },
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
