"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // fill the email that was saved on the register page
  useEffect(() => {
    setEmail(sessionStorage.getItem("pendingEmail") || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: { email, otp },
      });
      sessionStorage.removeItem("pendingEmail");
      setSuccess("Email verified. Taking you to login...");
      // wait a little so the user can read the message
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Verify your email</h1>
        <p className="subtitle">
          Enter the 6 digit code we sent to your email. It works for 5 minutes.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="otp">OTP code</label>
            <input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Please wait..." : "Verify"}
          </button>
        </form>

        <p className="switch-text">
          Back to <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}