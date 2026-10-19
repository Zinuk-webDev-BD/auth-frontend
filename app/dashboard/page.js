"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, getToken, removeToken } from "@/lib/api";

const linkStyle = {
  display: "block",
  textAlign: "center",
  textDecoration: "none",
  marginBottom: "10px",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // no token means the user is not logged in
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    // ask the backend who this user is
    apiRequest("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        // token is wrong or expired
        removeToken();
        router.replace("/login");
      });
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.replace("/login");
  };

  // nothing to show until we know who the user is
  if (!user) return <p className="center-text">Loading...</p>;

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

        <Link href="/groups" className="btn" style={linkStyle}>
          Groups
        </Link>

        <Link href="/premium" className="btn" style={linkStyle}>
          Premium
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