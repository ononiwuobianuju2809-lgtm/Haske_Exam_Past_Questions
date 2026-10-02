"use client";

import { useState, FormEvent } from "react";
import Button from "@/components/Button";
import { WAEC_SUBJECTS, JAMB_SUBJECTS } from "@/lib/subjects";
import AdSlotClient from "@/components/AdSlotClient";

type SearchResult = {
  _id: string;
  questionNumber?: number;
  questionText: string;
  topic: string;
  options?: { A?: string; B?: string; C?: string; D?: string };
  correctAnswer?: string;
  paper: { examType: string; subject: string; year: number };
};

export default function SearchByTopicPage() {
  const [examType, setExamType] = useState<"WAEC" | "JAMB">("WAEC");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [availableTopics, setAvailableTopics] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const subjects = examType === "JAMB" ? JAMB_SUBJECTS : WAEC_SUBJECTS;

  const runSearch = async (topicToSearch: string) => {
    if (!subject || !topicToSearch.trim()) return;

    setLoading(true);
    setAvailableTopics(null);

    const params = new URLSearchParams({ examType, subject, topic: topicToSearch });
    const res = await fetch(`/api/questions?${params.toString()}`);
    const data: SearchResult[] = await res.json();
    setResults(data);

    if (data.length === 0) {
      const allParams = new URLSearchParams({ examType, subject });
      const allRes = await fetch(`/api/questions?${allParams.toString()}`);
      const allQuestions: SearchResult[] = await allRes.json();
      const uniqueTopics = Array.from(new Set(allQuestions.map((q) => q.topic))).sort();
      setAvailableTopics(uniqueTopics);
    }

    setLoading(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(topic);
  };

  const handleTopicPillClick = (t: string) => {
    setTopic(t);
    runSearch(t);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-8 text-center">Search by Topic</h1>

      <div className="mb-6 flex justify-center gap-6">
        <button
          type="button"
          onClick={() => { setExamType("WAEC"); setSubject(""); setResults(null); setAvailableTopics(null); }}
          className={`text-lg font-semibold ${examType === "WAEC" ? "text-navy" : "text-gray-400"}`}
        >
          WAEC
        </button>
        <button
          type="button"
          onClick={() => { setExamType("JAMB"); setSubject(""); setResults(null); setAvailableTopics(null); }}
          className={`text-lg font-semibold ${examType === "JAMB" ? "text-navy" : "text-gray-400"}`}
        >
          UTME
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-10 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setResults(null); setAvailableTopics(null); }}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-3"
          >
            <option value="">Select a subject</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="e.g. photosynthesis"
            className="w-full rounded-md border border-gray-300 px-3 py-3"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {results !== null && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            {results.length} result{results.length !== 1 && "s"} found
          </h2>

          {results.length === 0 ? (
            <div>
              <p className="mb-4 text-gray-700">No questions found for that topic yet.</p>
              {availableTopics && availableTopics.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-600">
                    Topics available for {subject}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableTopics.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTopicPillClick(t)}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-navy hover:bg-gray-200"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
                            {results.map((q) => (
                <div key={q._id} className="border-b border-gray-100 pb-4">
                  <p className="mb-1 text-sm text-gray-500">
                    {q.paper.examType === "JAMB" ? "UTME" : q.paper.examType} {q.paper.subject} {q.paper.year} — Topic: {q.topic}
                  </p>
                  <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                  {q.options && (
                    <div className="ml-6 mt-2 space-y-1">
                      {(["A", "B", "C", "D"] as const).map(
                        (letter) =>
                          q.options?.[letter] && (
                            <p
                              key={letter}
                              className={
                                q.correctAnswer === letter
                                  ? "font-semibold text-navy"
                                  : "text-gray-700"
                              }
                            >
                              {letter}. {q.options[letter]}
                              {q.correctAnswer === letter && " ✓"}
                            </p>
                          )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <AdSlotClient slotKey="search" />
    </main>
  );
}