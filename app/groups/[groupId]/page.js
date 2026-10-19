"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";
import { apiRequest, getToken } from "@/lib/api";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
  : "http://localhost:8000";

const senderId = (m) => String((m.sender && m.sender._id) || m.sender);

function GroupChatContent() {
  const router = useRouter();
  const { groupId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [myId, setMyId] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let me = "";
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      me = String(u.id || u._id || "");
    } catch (err) {
      me = "";
    }
    setMyId(me);

    apiRequest("/groups/" + groupId + "/messages")
      .then((data) => setMessages(data.messages || []))
      .catch((err) => setError(err.message));

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_group", { groupId });
    });
    socket.on("connect_error", (err) => setError("Connection problem: " + err.message));

    socket.on("new_group_message", (m) => {
      if (String(m.group || m.groupId) !== groupId) return;
      setMessages((old) => (old.some((x) => x._id === m._id) ? old : [...old, m]));
    });

    return () => socket.disconnect();
  }, [groupId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !socketRef.current) return;
    setError("");
    socketRef.current.emit("send_group_message", { groupId, text: value }, (res) => {
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

  return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: 560 }}>
        <h1>Group chat</h1>
        {error && <div className="alert alert-error">{error}</div>}

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
          {messages.length === 0 && <p className="subtitle">No messages yet.</p>}
          {messages.map((m) => {
            const mine = senderId(m) === myId;
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
                {!mine && m.sender && m.sender.name && (
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{m.sender.name}</div>
                )}
                <div>{m.text}</div>
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
          <button className="btn">Send</button>
        </form>

        <p className="switch-text">
          <Link href="/groups">Back to groups</Link>
        </p>
      </div>
    </div>
  );
}

// useParams needs Suspense in a production build
export default function GroupChatPage() {
  return (
    <Suspense fallback={<p className="center-text">Loading...</p>}>
      <GroupChatContent />
    </Suspense>
  );
}