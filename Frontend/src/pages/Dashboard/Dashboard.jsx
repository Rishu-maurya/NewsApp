import DashboardLayout from '../../components/dashboard/DashboardLayout';
import RoleSide from '../../components/dashboard/side/RoleSide';
import ReaderView from './ReaderView';
import JournalistView from './JournalistView';
import EditorView from './EditorView';
import AdminView from './AdminView';
import PublisherView from './PublisherView';
import '../../style/Dashboard.css';

const VIEWS = {
    reader: { title: 'Your dashboard', subtitle: 'Read the latest published stories.', View: ReaderView },
    journalist: { title: 'Journalist dashboard', subtitle: 'Write stories and track their review.', View: JournalistView },
    publisher: { title: 'Publisher dashboard', subtitle: 'Verify journalist and editor role requests.', View: PublisherView },
    editor: { title: 'Editor dashboard', subtitle: 'Review stories waiting for a decision.', View: EditorView },
    admin: { title: 'Admin dashboard', subtitle: 'Manage users and handle reports.', View: AdminView },
};

export default function Dashboard({ session, onLogout }) {
    const { title, subtitle, View } = VIEWS[session.user.role] || VIEWS.reader;

    return (
        <DashboardLayout
            session={session}
            onLogout={onLogout}
            title={title}
            subtitle={subtitle}
            side={<RoleSide session={session} />}
        >
            <View session={session} />
        </DashboardLayout>
    );
}
