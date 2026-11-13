import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActivity } from "../../context/ActivityContext";
import {
  addBookmark,
  getBookmarkStatus,
  getLikeInfo,
  removeBookmark,
  toggleLike,
} from "../../services/engagementService";
import "../../style/ReactionBar.css";

export default function ReactionBar({ articleId, session }) {
  const navigate = useNavigate();
  const { comments } = useActivity();

  const email = session?.user.email;
  const key = String(articleId);
  const commentCount = comments.filter((c) => c.targetId === key).length;

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getLikeInfo(articleId)
      .then((info) => {
        if (cancelled) return;
        setLikeCount(info.likeCount);
        setLiked(Boolean(info.liked));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;

    getBookmarkStatus(articleId)
      .then((info) => {
        if (cancelled) return;
        setIsSaved(info.bookmarked);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [articleId, session]);

  const goLogin = () =>
    navigate("/login", {
      state: { message: "Log in to like and save stories." },
    });

  const handleLike = async () => {
    if (!session) return goLogin();

    setBusy(true);
    setError("");
    try {
      const result = await toggleLike(articleId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!session) return goLogin();

    setSaveBusy(true);
    setError("");
    try {
      if (isSaved) {
        await removeBookmark(articleId);
        setIsSaved(false);
      } else {
        await addBookmark(articleId);
        setIsSaved(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="s-row s-reaction-bar">
      <button
        type="button"
        className="s-btn"
        aria-pressed={liked}
        disabled={busy}
        onClick={handleLike}
      >
        {liked ? "Liked" : "Like"} ({likeCount})
      </button>

      <button
        type="button"
        className="s-btn"
        aria-pressed={isSaved}
        disabled={saveBusy}
        onClick={handleSave}
      >
        {isSaved ? "Saved" : "Save"}
      </button>
      <a href="#comments" className="s-btn">
        Comment ({commentCount})
      </a>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
