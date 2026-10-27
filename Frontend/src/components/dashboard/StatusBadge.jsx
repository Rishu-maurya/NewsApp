import { STATUS_LABELS } from '../../data/dummyData';
import '../../style/StatusBadge.css';

export default function StatusBadge({ status }) {
    return <span className={`badge badge--${status}`}>{STATUS_LABELS[status]}</span>;
}