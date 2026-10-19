"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const linkStyle = {
  display: "block",
  textAlign: "center",
  textDecoration: "none",
  marginBottom: "10px",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // only a logged in user can see this page
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const saved = localStorage.getItem("user");

      if (!token || !saved) {
        router.replace("/login");
        return;
      }
      setUser(JSON.parse(saved));
    } catch (err) {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  // nothing to show until we know who the user is
  if (!user) return null;

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Hello, {user.name}</h1>
        <p className="subtitle">You are logged in as {user.email}</p>

        <Link href="/profile" className="btn" style={linkStyle}>
          My profile
        </Link>

        <Link href="/friends" className="btn" style={linkStyle}>
          Friends
        </Link>

        <p className="switch-text">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            Logout
          </a>
        </p>
      </div>
    </div>
  );
}