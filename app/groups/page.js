"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, getToken } from "@/lib/api";

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadGroups = () =>
    apiRequest("/groups")
      .then((data) => setGroups(data.groups || []))
      .catch((err) => setError(err.message));

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadGroups();

    // the friend list route may differ, so we try both
    (async () => {
      for (const path of ["/friends/list", "/friends"]) {
        try {
          const data = await apiRequest(path);
          const list = data.friends || data.users || [];
          if (Array.isArray(list)) {
            setFriends(list);
            return;
          }
        } catch (err) {
          // try the next path
        }
      }
    })();
  }, [router]);

  const toggle = (id) => {
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/groups", {
        method: "POST",
        body: { name, members: selected },
      });
      setName("");
      setSelected([]);
      await loadGroups();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: 520 }}>
        <h1>Groups</h1>
        <p className="subtitle">Only premium users can create a group.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {error.toLowerCase().includes("premium") && (
          <p className="switch-text" style={{ marginBottom: 14 }}>
            <Link href="/premium">Become a premium user</Link>
          </p>
        )}

        <form className="form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="name">Group name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="field">
            <label>Add friends</label>
            {friends.length === 0 && <p className="subtitle">No friends found.</p>}
            {friends.map((f) => {
              const id = String(f._id || f.id);
              return (
                <label key={id} style={{ fontWeight: "normal" }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(id)}
                    onChange={() => toggle(id)}
                  />{" "}
                  {f.name}
                </label>
              );
            })}
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Please wait..." : "Create group"}
          </button>
        </form>

        <h2 style={{ marginTop: 24, fontSize: 18 }}>My groups</h2>
        {groups.length === 0 && <p className="subtitle">No groups yet.</p>}
        {groups.map((g) => (
          <p key={g._id || g.id} style={{ marginTop: 8 }}>
            <Link href={"/groups/" + (g._id || g.id)}>{g.name}</Link>
          </p>
        ))}

        <p className="switch-text">
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}