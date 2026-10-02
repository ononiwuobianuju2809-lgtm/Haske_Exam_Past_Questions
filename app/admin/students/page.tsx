"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Button from "@/components/Button";

type StudentRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isLoggedIn: boolean;
  createdAt: string;
};

function StatusBulbs({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        <span className="mb-1 text-[10px] font-medium text-gray-500">Logged In</span>
        <span
          className={`h-3 w-3 rounded-full ${
            isLoggedIn ? "bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.6)]" : "bg-green-100"
          }`}
        />
      </div>
      <div className="flex flex-col items-center">
        <span className="mb-1 text-[10px] font-medium text-gray-500">Logged Out</span>
        <span
          className={`h-3 w-3 rounded-full ${
            !isLoggedIn ? "bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.6)]" : "bg-red-100"
          }`}
        />
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/students");
    if (res.ok) setStudents(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete the account for ${name}? This cannot be undone.`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    setStudents((prev) => prev.filter((s) => s._id !== id));
    setDeletingId(null);
  };

  const verifiedCount = students.filter((s) => s.emailVerified).length;

  return (
       <div className="px-4 py-6 sm:px-6">
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="secondary" onClick={() => signOut()} className="!w-auto">
          Log Out
        </Button>
      </div>
      <h1 className="mb-2 text-lg font-bold text-foreground sm:text-xl">Registered Students</h1>
      <p className="mb-6 text-sm text-gray-600">
        {students.length} total — {verifiedCount} email-confirmed
      </p>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-gray-600">No students have signed up yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">{s.name}</td>
                  <td className="py-3 pr-4">{s.email}</td>
                  <td className="py-3 pr-4">{s.phone}</td>
                  <td className="py-3 pr-4">
                    {s.emailVerified ? (
                      <span className="text-green-600">✓ Yes</span>
                    ) : (
                      <span className="text-red-600">✗ No</span>
                    )}
                  </td>
                                    <td className="py-3 pr-4">
                    <StatusBulbs isLoggedIn={s.isLoggedIn} />
                  </td>
                  <td className="py-3 pr-4">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(s._id, s.name)}
                      disabled={deletingId === s._id}
                      className="!w-auto !px-3 !py-1.5 text-sm"
                    >
                      {deletingId === s._id ? "Deleting..." : "Delete"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}