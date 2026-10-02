"use client";

import { useState } from "react";
import Button from "./Button";
import RichPasteBox from "./RichPasteBox";
import {
  parseObjectiveQuestions,
  parseAnswerTopicLines,
  matchObjective,
  MatchedObjectiveQuestion,
} from "@/lib/bulkParse";

export default function BulkObjectiveForm({
  paperId,
  component,
  onSaved,
}: {
  paperId: string;
  component?: string;
  onSaved?: () => void;
}) {
  const [questionsBox, setQuestionsBox] = useState("");
  const [answersBox, setAnswersBox] = useState("");
  const [matched, setMatched] = useState<MatchedObjectiveQuestion[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

    const handlePreview = async () => {
    const questions = parseObjectiveQuestions(questionsBox);
    const answers = parseAnswerTopicLines(answersBox);
    const results = matchObjective(questions, answers);

    const res = await fetch(`/api/questions?paper=${paperId}`);
    const existing = res.ok ? await res.json() : [];
    const existingNumbers = new Set(
      existing
        .filter((q: any) => (q.component || "") === (component || ""))
        .map((q: any) => String(q.questionNumber))
    );

    setMatched(
      results.map((r) =>
        existingNumbers.has(r.number)
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
          questionNumber: Number(item.number),
          questionText: item.questionText,
          options: item.options,
          correctAnswer: item.answer,
          topic: item.topic,
        }),
      });
      if (res.ok) successCount += 1;
    }

    setSaving(false);
    setMessage(`✅ Saved ${successCount} of ${clean.length} question(s).`);
    setMatched(null);
    setQuestionsBox("");
    setAnswersBox("");
    onSaved?.();
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl rounded-md border border-gray-300 p-4">
      <h3 className="mb-3 text-base font-bold text-foreground sm:text-lg">
        Bulk Paste — Objective Questions
      </h3>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-foreground">Questions &amp; Options</label>
        <p className="mb-2 text-xs text-gray-500">
          Paste as-is from your files — e.g. "13. What is the synonym of..." then "A. ... B. ... C. ... D. ..."
        </p>
                <RichPasteBox value={questionsBox} onChange={setQuestionsBox} />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-foreground">Answers &amp; Topics</label>
        <p className="mb-2 text-xs text-gray-500">One line per question number — e.g. "13. C - Synonyms"</p>
                <RichPasteBox value={answersBox} onChange={setAnswersBox} minHeightClass="min-h-[150px]" />
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
                  <th className="px-3 py-2">Answer</th>
                  <th className="px-3 py-2">Topic</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {matched.map((m) => (
                  <tr key={m.number} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{m.number}</td>
                                        <td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: m.questionText.slice(0, 100) || "—" }} />
                    <td className="px-3 py-2">{m.answer || "—"}</td>
                    <td className="px-3 py-2">{m.topic || "—"}</td>
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