import '../../style/StatCard.css';

export default function StatCard({ label, value }) {
    return (
        <div className="stat">
            <p className="stat__value">{value}</p>
            <p className="stat__label">{label}</p>
        </div>
    );
}