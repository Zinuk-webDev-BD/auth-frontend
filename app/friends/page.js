"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";

const TABS = [
  { key: "suggestions", label: "Suggestions" },
  { key: "received", label: "Requests" },
  { key: "sent", label: "Sent" },
  { key: "friends", label: "Friends" },
];

// get the list of the selected tab from the backend
const loadTab = async (tab) => {
  if (tab === "suggestions") {
    const data = await authFetch("/friends/suggestions");
    return data.users.map((u) => ({ key: u._id, person: u }));
  }
  if (tab === "received") {
    const data = await authFetch("/friends/requests/received");
    return data.requests.map((r) => ({
      key: r._id,
      requestId: r._id,
      person: r.sender,
    }));
  }
  if (tab === "sent") {
    const data = await authFetch("/friends/requests/sent");
    return data.requests.map((r) => ({
      key: r._id,
      requestId: r._id,
      person: r.receiver,
    }));
  }
  const data = await authFetch("/friends");
  return data.friends.map((f) => ({ key: f._id, person: f }));
};

const buttonStyle = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
};
const primaryStyle = {
  ...buttonStyle,
  background: "#2563eb",
  color: "#fff",
  border: "1px solid #2563eb",
};

function Avatar({ person }) {
  if (person.profilePicture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.profilePicture}
        alt={person.name}
        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
      }}
    >
      {(person.name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("suggestions");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refresh, setRefresh] = useState(0);

  // load the list again when the tab changes or after an action
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadTab(tab)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, refresh, router]);

  const changeTab = (key) => {
    setError("");
    setMessage("");
    setItems([]);
    setTab(key);
  };

  // run one action (add, accept, cancel...) then reload the list
  const run = async (id, action, doneMessage) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(doneMessage);
      setRefresh((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const addFriend = (item) =>
    run(
      item.key,
      () => authFetch("/friends/requests/send/" + item.person._id, { method: "POST" }),
      "Friend request sent."
    );

  const accept = (item) =>
    run(
      item.key,
      () => authFetch("/friends/requests/" + item.requestId + "/accept", { method: "PUT" }),
      "Friend request accepted."
    );

  const reject = (item) =>
    run(
      item.key,
      () => authFetch("/friends/requests/" + item.requestId, { method: "DELETE" }),
      "Friend request rejected."
    );

  const cancel = (item) =>
    run(
      item.key,
      () => authFetch("/friends/requests/" + item.requestId, { method: "DELETE" }),
      "Friend request cancelled."
    );

  const emptyText = {
    suggestions: "No suggestions right now.",
    received: "No friend requests.",
    sent: "You have not sent any request.",
    friends: "You have no friends yet.",
  };

  return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: 560, width: "100%" }}>
        <h1>Friends</h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              style={tab === t.key ? primaryStyle : buttonStyle}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {loading ? (
          <p className="subtitle">Loading...</p>
        ) : items.length === 0 ? (
          <p className="subtitle">{emptyText[tab]}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <Avatar person={item.person} />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.person.name}</div>
                {item.person.bio && (
                  <div style={{ fontSize: 13, color: "#666" }}>{item.person.bio}</div>
                )}
                {tab === "friends" && (
                  <div style={{ fontSize: 12, color: item.person.isOnline ? "#16a34a" : "#999" }}>
                    {item.person.isOnline
                      ? "Online"
                      : item.person.lastSeen
                      ? "Last seen " + new Date(item.person.lastSeen).toLocaleString()
                      : "Offline"}
                  </div>
                )}
              </div>
                             {tab === "friends" && (
                <Link
                  href={"/chat/" + item.person._id}
                  style={{ ...primaryStyle, textDecoration: "none" }}
                >
                  Message
                </Link>
              )}
              {tab === "suggestions" && (
                <button
                  style={primaryStyle}
                  disabled={busyId === item.key}
                  onClick={() => addFriend(item)}
                >
                  Add friend
                </button>
              )}

              {tab === "received" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={primaryStyle}
                    disabled={busyId === item.key}
                    onClick={() => accept(item)}
                  >
                    Accept
                  </button>
                  <button
                    style={buttonStyle}
                    disabled={busyId === item.key}
                    onClick={() => reject(item)}
                  >
                    Reject
                  </button>
                </div>
              )}

              {tab === "sent" && (
                <button
                  style={buttonStyle}
                  disabled={busyId === item.key}
                  onClick={() => cancel(item)}
                >
                  Cancel
                </button>
              )}
            </div>
          ))
        )}

        <p className="switch-text">
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
