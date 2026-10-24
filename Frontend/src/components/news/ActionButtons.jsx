export default function ActionButtons({ liked, saved, onLike, onSave }) {
    return (
        <div className="actions">
            <button type="button" className="act" aria-pressed={liked} onClick={onLike}>
                {liked ? 'Liked' : 'Like'}
            </button>
            <button type="button" className="act" aria-pressed={saved} onClick={onSave}>
                {saved ? 'Saved' : 'Save'}
            </button>
        </div>
    );
}