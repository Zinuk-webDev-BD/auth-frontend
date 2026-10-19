"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, getToken } from "@/lib/api";

export default function PremiumPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    apiRequest("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => router.replace("/login"));
  }, [router]);

  // start the payment, then go to the payment gateway page
  const handleSubscribe = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/payments/subscribe", { method: "POST" });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!user) return <p className="center-text">Loading...</p>;

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Premium</h1>
        <p className="subtitle">Premium users can create group chats. Price: 500 BDT</p>

        {error && <div className="alert alert-error">{error}</div>}

        {user.isPremium ? (
          <div className="alert alert-success">You are a premium user.</div>
        ) : (
          <button className="btn" style={{ width: "100%" }} onClick={handleSubscribe} disabled={loading}>
            {loading ? "Please wait..." : "Subscribe now"}
          </button>
        )}

        <p className="switch-text">
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}