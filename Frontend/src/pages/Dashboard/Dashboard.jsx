import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ReaderView from './ReaderView';
import JournalistView from './JournalistView';
import EditorView from './EditorView';
import AdminView from './AdminView';
import '../../style/Dashboard.css';

const VIEWS = {
    reader: {
        title: 'Your dashboard',
        subtitle: 'Read the latest published stories.',
        View: ReaderView,
    },
    journalist: {
        title: 'Journalist dashboard',
        subtitle: 'Write stories and track their review.',
        View: JournalistView,
    },
    editor: {
        title: 'Editor dashboard',
        subtitle: 'Review stories waiting for a decision.',
        View: EditorView,
    },
    admin: {
        title: 'Admin dashboard',
        subtitle: 'Manage users and handle reports.',
        View: AdminView,
    },
};

export default function Dashboard({ session, onLogout }) {
    const { title, subtitle, View } = VIEWS[session.user.role] || VIEWS.reader;

    return (
        <DashboardLayout session={session} onLogout={onLogout} title={title} subtitle={subtitle}>
            <View session={session} />
        </DashboardLayout>
    );
}