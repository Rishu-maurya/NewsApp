import JournalistView from "./JournalistView";
import RoleRequestsPanel from "../../components/dashboard/RoleRequestsPanel";

export default function PublisherView({ session }) {
    return (
        <>
            <RoleRequestsPanel />
            <JournalistView session={session} />
        </>
    );
}
