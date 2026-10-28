export default function Avatar({ profile, size = 40 }) {
    const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
    const initial = (profile?.name || '?').trim().charAt(0).toUpperCase();

    if (profile?.photo) {
        return <img className="s-avatar" src={profile.photo} alt="" style={style} />;
    }
    return (
        <span className="s-avatar s-avatar--blank" style={style} aria-hidden="true">
            {initial}
        </span>
    );
}