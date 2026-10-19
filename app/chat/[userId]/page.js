"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";
import { authFetch } from "@/lib/authFetch";

// socket.io server url, it comes from the env file
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
  : "http://localhost:8000";

function ChatContent() {
  const router = useRouter();
  const { userId } = useParams();

  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // my own id, to know which messages are mine
    let me = "";
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      me = String(u.id || u._id || "");
    } catch (err) {
      me = "";
    }
    setMyId(me);

    let cancelled = false;

    // friend info and old messages
    Promise.all([
      authFetch("/friends/" + userId),
      authFetch("/chats/" + userId),
    ])
      .then(([friendData, chatData]) => {
        if (cancelled) return;
        setFriend(friendData.user);
        setMessages(chatData.messages);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // real time connection
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      setError("Connection problem: " + err.message);
    });

    // a new message from my friend (or from my other tab)
    socket.on("new_message", (m) => {
      const mine = String(m.sender) === me && String(m.receiver) === userId;
      const theirs = String(m.sender) === userId && String(m.receiver) === me;
      if (!mine && !theirs) return;

      setMessages((old) =>
        old.some((x) => x._id === m._id) ? old : [...old, m]
      );
    });

    // friend online or offline
    socket.on("friend_online", (d) => {
      if (d.userId === userId) {
        setFriend((f) => (f ? { ...f, isOnline: true } : f));
      }
    });
    socket.on("friend_offline", (d) => {
      if (d.userId === userId) {
        setFriend((f) =>
          f ? { ...f, isOnline: false, lastSeen: d.lastSeen } : f
        );
      }
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [userId, router]);

  // always show the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !socketRef.current) return;

    setError("");
    socketRef.current.emit("send_message", { to: userId, text: value }, (res) => {
      if (res && res.ok) {
        setMessages((old) =>
          old.some((x) => x._id === res.message._id) ? old : [...old, res.message]
        );
      } else {
        setError((res && res.message) || "could not send message");
      }
    });
    setText("");
  };

  const statusText = friend
    ? friend.isOnline
      ? "Online"
      : friend.lastSeen
      ? "Last seen " + new Date(friend.lastSeen).toLocaleString()
      : "Offline"
    : "";

  return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: 560, width: "100%" }}>
        {friend && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {friend.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={friend.profilePicture}
                alt={friend.name}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
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
                {(friend.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600 }}>{friend.name}</div>
              <div style={{ fontSize: 12, color: friend.isOnline ? "#16a34a" : "#999" }}>
                {statusText}
              </div>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="subtitle">Loading...</p>
        ) : (
          <>
            <div
              style={{
                height: 360,
                overflowY: "auto",
                background: "#f5f5f5",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {messages.length === 0 && (
                <p className="subtitle">No messages yet. Say hello!</p>
              )}

              {messages.map((m) => {
                const mine = String(m.sender) === myId;
                return (
                  <div
                    key={m._id}
                    style={{
                      alignSelf: mine ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      background: mine ? "#2563eb" : "#fff",
                      color: mine ? "#fff" : "#111",
                      padding: "8px 12px",
                      borderRadius: 12,
                      wordBreak: "break-word",
                    }}
                  >
                    <div>{m.text}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, textAlign: "right" }}>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
                maxLength={1000}
                style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
              />
              <button
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </form>
          </>
        )}

        <p className="switch-text">
          <Link href="/friends">Back to friends</Link>
        </p>
      </div>
    </div>
  );
}

// useParams needs Suspense in a production build
export default function ChatPage() {
  return (
    <Suspense fallback={<p className="center-text">Loading...</p>}>
      <ChatContent />
    </Suspense>
  );
}