"use client";

import { useState } from "react";
import Button from "./Button";
import RichPasteBox from "./RichPasteBox";
import {
  parseTheoryQuestions,
  parseAnswerTopicLines,
  matchTheory,
  MatchedTheoryQuestion,
} from "@/lib/bulkParse";

const COMPONENTS = ["Comprehension", "Summary", "Essay"];

export default function BulkTheoryForm({
  paperId,
  subject,
  onSaved,
}: {
  paperId: string;
  subject?: string;
  onSaved?: () => void;
}) {
  const isEnglish = (subject || "").trim().toLowerCase().includes("english");
  const [component, setComponent] = useState(isEnglish ? "Essay" : "");
  const [questionsBox, setQuestionsBox] = useState("");
  const [topicsBox, setTopicsBox] = useState("");
  const [matched, setMatched] = useState<MatchedTheoryQuestion[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

    const handlePreview = async () => {
    const questions = parseTheoryQuestions(questionsBox);
    const topics = parseAnswerTopicLines(topicsBox);
    const results = matchTheory(questions, topics);

    const res = await fetch(`/api/questions?paper=${paperId}`);
    const existing = res.ok ? await res.json() : [];
    const existingKeys = new Set(
      existing
        .filter((q: any) => (q.component || "") === (component || ""))
        .map((q: any) => `${q.questionNumber ?? ""}${q.subPart || ""}`)
    );

    setMatched(
      results.map((r) =>
        existingKeys.has(r.number)
          ? { ...r, issues: [...r.issues, "Already exists in the database for this paper/section."] }
          : r
      )
    );
    setMessage("");
  };

  const cleanCount = matched?.filter((m) => m.issues.length === 0).length || 0;
  const issueCount = matched ? matched.length - cleanCount : 0;

  const handleSaveAll = async () => {
    if (!matched) return;
    const clean = matched.filter((m) => m.issues.length === 0);
    if (clean.length === 0) return;

    setSaving(true);
    setMessage("");
    let successCount = 0;

    for (const item of clean) {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper: paperId,
          component: component || "",
          questionType: "theory",
          questionNumber: item.mainNumber,
          subPart: item.subPart,
          questionText: item.questionText,
          topic: item.topic,
          passageNumber: item.passageNumber,
        }),
      });
      if (res.ok) successCount += 1;
    }

    setSaving(false);
    setMessage(`✅ Saved ${successCount} of ${clean.length} question(s).`);
    setMatched(null);
    setQuestionsBox("");
    setTopicsBox("");
    onSaved?.();
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30";
  const labelClass = "mb-1 block text-sm font-medium text-foreground";

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl rounded-md border border-gray-300 p-4">
      <h3 className="mb-3 text-base font-bold text-foreground sm:text-lg">
        Bulk Paste — Theory Questions
      </h3>

      {isEnglish && (
        <div className="mb-4">
          <label className={labelClass}>Component</label>
          <select value={component} onChange={(e) => setComponent(e.target.value)} className={inputClass}>
            {COMPONENTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-foreground">Questions</label>
        <p className="mb-2 text-xs text-gray-500">
          One question number per line, sub-parts allowed — e.g. "1a. Identify five values of civic education."
        </p>
                <RichPasteBox value={questionsBox} onChange={setQuestionsBox} />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-foreground">Topics</label>
        <p className="mb-2 text-xs text-gray-500">
          One question number per line. Add " - Passage 1" only if this question shares a passage with others; otherwise just the topic.
        </p>
                <RichPasteBox value={topicsBox} onChange={setTopicsBox} minHeightClass="min-h-[150px]" />
      </div>

      <Button type="button" variant="secondary" onClick={handlePreview} className="mb-4">
        Preview Match
      </Button>

      {matched && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-foreground">
            {cleanCount} ready to save, {issueCount} with issues
          </p>
          <div className="max-h-96 overflow-y-auto rounded-md border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Question (preview)</th>
                  <th className="px-3 py-2">Topic</th>
                  <th className="px-3 py-2">Passage</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {matched.map((m) => (
                  <tr key={m.number} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{m.number}</td>
                                       <td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: m.questionText.slice(0, 100) || "—" }} />
                    <td className="px-3 py-2">{m.topic || "—"}</td>
                    <td className="px-3 py-2">{m.passageNumber ?? "—"}</td>
                    <td className="px-3 py-2">
                      {m.issues.length === 0 ? (
                        <span className="text-green-600">✓ Ready</span>
                      ) : (
                        <span className="text-red-600" title={m.issues.join(" ")}>
                          ⚠ {m.issues[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" onClick={handleSaveAll} disabled={saving || cleanCount === 0} className="mt-4">
            {saving ? "Saving..." : `Save ${cleanCount} Question(s)`}
          </Button>
        </div>
      )}

      {message && <p className="mt-3 text-sm font-medium text-green-600">{message}</p>}
    </div>
  );
}