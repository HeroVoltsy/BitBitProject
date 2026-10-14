import { useState } from "react";
import { ArrowLeft, Search, UserCheck, UserPlus } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { FOLLOWERS } from "../data/events";
import { initialsOf } from "../useAuth";

export function FollowersScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  // Frontend-only: follow-back toggles are kept in memory (nothing is saved).
  const [followingBack, setFollowingBack] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FOLLOWERS.map((f) => [f.name, f.followingBack]))
  );

  const q = query.trim().toLowerCase();
  const shown = FOLLOWERS.filter(
    (f) => q === "" || f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)
  );

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back to profile
      </button>
      <h1 className="page-title">Followers</h1>
      <p className="page-sub">
        {FOLLOWERS.length} {FOLLOWERS.length === 1 ? "person follows" : "people follow"} you
      </p>

      <div className="home-search followers-search">
        <Search size={18} strokeWidth={2} className="muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search followers"
          aria-label="Search followers"
        />
      </div>

      <div className="stack">
        {shown.map((f, i) => {
          const on = followingBack[f.name];
          return (
            <div className="follower-row card" key={f.name}>
              <Avatar seed={i} size={42} initials={initialsOf(f.name)} label={f.name} />
              <span className="follower-row__info">
                <strong>{f.name}</strong>
                <span className="muted">{f.location}, Naga City</span>
              </span>
              <button
                type="button"
                className={`follower-row__btn ${on ? "follower-row__btn--on" : ""}`}
                aria-pressed={on}
                onClick={() => setFollowingBack((m) => ({ ...m, [f.name]: !on }))}
              >
                {on ? (
                  <>
                    <UserCheck size={16} strokeWidth={2.4} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={16} strokeWidth={2.4} /> Follow back
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
      {shown.length === 0 && <p className="empty">No followers match "{query.trim()}".</p>}
    </div>
  );
}
