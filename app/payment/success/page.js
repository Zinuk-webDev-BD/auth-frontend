import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="auth-page">
      <div className="card">
        <h1>Payment successful</h1>
        <div className="alert alert-success">You are now a premium user.</div>
        <p className="switch-text">
          <Link href="/groups">Create a group</Link>
        </p>
        <p className="switch-text">
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}