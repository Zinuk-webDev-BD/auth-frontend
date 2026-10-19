import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <div className="auth-page">
      <div className="card">
        <h1>Payment failed</h1>
        <div className="alert alert-error">The payment was not completed. Please try again.</div>
        <p className="switch-text">
          <Link href="/premium">Try again</Link>
        </p>
        <p className="switch-text">
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}