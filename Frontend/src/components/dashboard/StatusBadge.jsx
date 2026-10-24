import { STATUS_LABELS } from '../../data/dummyData';

export default function StatusBadge({ status }) {
    return <span className={`badge badge--${status}`}>{STATUS_LABELS[status]}</span>;
}