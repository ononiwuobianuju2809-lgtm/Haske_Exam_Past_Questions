"use client";
import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import Button from "../../../components/Button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
        const result = await signIn("admin", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Wrong username or password");
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Log In</Button>
        </form>
      </div>
    </div>
  );
}