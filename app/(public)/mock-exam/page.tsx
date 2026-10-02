"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/Button";
import { WAEC_SUBJECTS, JAMB_SUBJECTS } from "@/lib/subjects";
import AdSlotClient from "@/components/AdSlotClient";

export default function MockExamPage() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  if (status === "loading") {
    return <main className="max-w-3xl mx-auto px-4 py-20 text-center">Loading...</main>;
  }

    if (session) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">Logged in as {session.user?.name}</p>
          <Button
            variant="secondary"
            onClick={() => signOut()}
            className="!w-auto !px-4 !py-2 text-sm"
          >
            Log Out
          </Button>
        </div>
        <MockExamFlow />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-8 text-center">Mock Exam</h1>

            {mode !== "forgot" && (
        <div className="mb-6 flex justify-center gap-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`text-lg font-semibold ${mode === "login" ? "text-navy" : "text-gray-400"}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`text-lg font-semibold ${mode === "signup" ? "text-navy" : "text-gray-400"}`}
          >
            Sign Up
          </button>
        </div>
      )}

      {mode === "login" && <LoginForm onForgotPassword={() => setMode("forgot")} />}
      {mode === "signup" && <SignUpForm onSuccess={() => setMode("login")} />}
      {mode === "forgot" && <ForgotPasswordForm onBack={() => setMode("login")} />}
    </main>
  );
}

function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const result = await signIn("student", {
      identifier: identifier.trim(),
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error === "EMAIL_NOT_VERIFIED") {
      setError("Please confirm your email before logging in — check your inbox.");
    } else if (result?.error) {
      setError("Incorrect email/phone or password.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email or Phone Number</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-3"
        />
      </div>
            <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-navy"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </Button>
      <button
        type="button"
        onClick={onForgotPassword}
        className="block text-center text-sm text-navy underline"
      >
        Forgot Password?
      </button>
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

            setLoading(true);
    try {
      const res = await fetch("/api/students/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("The server hit an unexpected problem (not your connection). Please tell your developer.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

          setMessage("Account created! Check your email for a confirmation link before logging in — if you don't see it in a minute or two, check your Spam or Junk folder too.");
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-navy"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 pr-16"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-navy"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/students/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setMessage(
        "If an account exists for that email, a reset link has been sent — check your inbox (and Spam folder) for it."
      );
      setEmail("");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <p className="mb-4 text-sm text-gray-700">
        Enter the email you signed up with, and we&apos;ll send you a link to set a new password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="block text-center text-sm text-navy underline"
        >
          Back to Log In
        </button>
      </form>
    </div>
  );
}

type MockQuestion = {
  _id: string;
  component: string;
  questionText: string;
  imageUrl?: string;
  options: { A?: string; B?: string; C?: string; D?: string };
};

type ResultItem = {
  questionId: string;
  questionText: string;
  options: { A?: string; B?: string; C?: string; D?: string };
  selected: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
};

function MockExamFlow() {
  const [phase, setPhase] = useState<"setup" | "loading" | "taking" | "results">("setup");
  const [examType, setExamType] = useState<"WAEC" | "JAMB">("WAEC");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [results, setResults] = useState<{ score: number; total: number; results: ResultItem[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subjects = examType === "JAMB" ? JAMB_SUBJECTS : WAEC_SUBJECTS;

  const handleStart = async () => {
    if (!subject) {
      setError("Please select a subject.");
      return;
    }
    setError("");
    setPhase("loading");

    const res = await fetch(
      `/api/mock-exam/start?examType=${examType}&subject=${encodeURIComponent(subject)}`
    );
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setPhase("setup");
      return;
    }
    if (data.questions.length === 0) {
      setError("No questions are saved for this subject yet. Please try another.");
      setPhase("setup");
      return;
    }

    if (data.sections) {
      const shortfalls = data.sections
        .filter((s: any) => s.actual < s.requested)
        .map((s: any) => `${s.actual} of ${s.requested}`);
      setNote(
        shortfalls.length
          ? `Using fewer questions than usual for one or more sections (${shortfalls.join(", ")}) since not enough are saved yet.`
          : ""
      );
    } else if (data.actual < data.requested) {
      setNote(`Using ${data.actual} of the usual ${data.requested} questions, since not enough are saved yet.`);
    } else {
      setNote("");
    }

    setQuestions(data.questions);
    setAnswers({});
    setSecondsLeft(data.questions.length * 60);
    setPhase("taking");
  };

  const handleSelect = (questionId: string, letter: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      answers: questions.map((q) => ({ questionId: q._id, selected: answers[q._id] || null })),
    };
    const res = await fetch("/api/mock-exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSubmitting(false);
    setResults(data);
    setPhase("results");
  };

  useEffect(() => {
    if (phase !== "taking") return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (phase === "setup") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy mb-8">Ready to test your knowledge?</h1>
        <div className="mx-auto max-w-sm space-y-4 text-left">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Exam</label>
            <select
              value={examType}
              onChange={(e) => {
                setExamType(e.target.value as "WAEC" | "JAMB");
                setSubject("");
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-3"
            >
              <option value="WAEC">WAEC</option>
              <option value="JAMB">UTME</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-3"
            >
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleStart}>Start Mock Exam</Button>
        </div>
        <AdSlotClient slotKey="mock-exam-setup" />
      </div>
    );
  }

  if (phase === "loading") {
    return <p className="text-center text-gray-700">Preparing your questions...</p>;
  }

  if (phase === "taking") {
    return (
      <div>
        <div className="sticky top-0 z-10 mb-6 flex items-center justify-between bg-white py-2">
          <p className="font-semibold text-navy">Time Left: {formatTime(secondsLeft)}</p>
          <Button
            variant="secondary"
            onClick={() => {
              if (confirm("Submit now? You can't change answers after this.")) handleSubmit();
            }}
            disabled={submitting}
            className="!w-auto !px-4 !py-2 text-sm"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
        {note && <p className="mb-4 text-sm text-gray-500">{note}</p>}
        <div className="space-y-8">
          {questions.map((q, i) => (
            <div key={q._id} className="border-b border-gray-100 pb-4">
              <div className="mb-2 flex gap-2 text-gray-800">
                <span className="font-medium">{i + 1}.</span>
                <div dangerouslySetInnerHTML={{ __html: q.questionText }} />
              </div>
              {q.imageUrl && <img src={q.imageUrl} alt="" className="mb-2 max-w-full rounded-md" />}
              <div className="ml-6 space-y-2">
                {(["A", "B", "C", "D"] as const).map(
                  (letter) =>
                    q.options?.[letter] && (
                      <label key={letter} className="flex items-center gap-2 text-gray-700">
                        <input
                          type="radio"
                          name={q._id}
                          checked={answers[q._id] === letter}
                          onChange={() => handleSelect(q._id, letter)}
                        />
                        {letter}. {q.options[letter]}
                      </label>
                    )
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button
            onClick={() => {
              if (confirm("Submit now? You can't change answers after this.")) handleSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "results" && results) {
    return (
      <div>
        <h1 className="mb-8 text-center text-2xl font-bold text-navy">
          You scored {results.score} out of {results.total}
        </h1>
        <div className="space-y-6">
          {results.results.map((r, i) => (
            <div key={r.questionId} className="border-b border-gray-100 pb-4">
              <div className="mb-2 flex gap-2 text-gray-800">
                <span className="font-medium">{i + 1}.</span>
                <div dangerouslySetInnerHTML={{ __html: r.questionText }} />
              </div>
              <div className="ml-6 space-y-1">
                {(["A", "B", "C", "D"] as const).map((letter) => {
                  if (!r.options?.[letter]) return null;
                  const isCorrectAnswer = r.correctAnswer === letter;
                  const isSelected = r.selected === letter;
                  return (
                    <p
                      key={letter}
                      className={
                        isCorrectAnswer
                          ? "font-semibold text-navy"
                          : isSelected
                          ? "text-red-600"
                          : "text-gray-700"
                      }
                    >
                      {letter}. {r.options[letter]}
                      {isCorrectAnswer && " ✓"}
                      {isSelected && !isCorrectAnswer && " (your answer)"}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button onClick={() => setPhase("setup")}>Take Another</Button>
        </div>
        <AdSlotClient slotKey="mock-exam-results" />
      </div>
    );
  }

  return null;
}