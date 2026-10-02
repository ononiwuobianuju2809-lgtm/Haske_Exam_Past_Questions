"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleConfirm = async () => {
    if (!token) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`/api/students/verify-email?token=${token}`);
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-20 text-center">
      {status === "idle" && (
        <>
          <h1 className="text-2xl font-bold text-navy mb-4">Confirm Your Email</h1>
          <p className="text-gray-700 mb-6">Click below to activate your account.</p>
          <Button onClick={handleConfirm} className="!w-auto">
            Confirm My Email
          </Button>
        </>
      )}
      {status === "loading" && <p className="text-gray-700">Confirming...</p>}
      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold text-navy mb-4">Email Confirmed!</h1>
          <p className="text-gray-700 mb-6">Your account is now active.</p>
          <Link href="/mock-exam" className="text-navy underline">
            Go to Log In
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-navy mb-4">Link Invalid or Expired</h1>
          <p className="text-gray-700">
            Please try signing up again — or if another tab already showed success, you can just log in.
          </p>
        </>
      )}
    </main>
  );
}