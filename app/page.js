"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // logged in users go to the dashboard, others go to login
    router.replace(getToken() ? "/dashboard" : "/login");
  }, [router]);

  return <p className="center-text">Loading...</p>;
}