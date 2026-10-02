"use client";
import { useEffect, useState } from "react";
import Button from "./Button";

const COMPONENT_ORDER = ["Grammar", "Comprehension", "Summary", "Essay", "Oral"];
const PASSAGE_COMPONENTS = ["Comprehension", "Summary"];

function sortComponentNames(names: string[]) {
  return [...names].sort((a, b) => {
    const ai = COMPONENT_ORDER.indexOf(a);
    const bi = COMPONENT_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function sortQuestionsWithinGroup(a: any, b: any) {
  const an = a.questionNumber;
  const bn = b.questionNumber;
  if (an != null && bn != null && an !== bn) return an - bn;
  if (an != null && bn == null) return -1;
  if (an == null && bn != null) return 1;
  return (a.subPart || "").localeCompare(b.subPart || "", undefined, { numeric: true });
}

// Older questions saved before "Passage 2" existed have no passageNumber at all —
// treat those as Passage 1 automatically, so nothing old ever goes missing.
function effectivePassageNumber(q: any) {
  if (q.passageNumber) return q.passageNumber;
  if (PASSAGE_COMPONENTS.includes(q.component)) return 1;
  return undefined;
}

function findSharedPrompt(q: any, sharedPrompts: any[]) {
  if (q.questionNumber == null) return undefined;
  return sharedPrompts.find(
    (sp) =>
      (sp.component || "") === (q.component || "") &&
      q.questionNumber >= sp.fromQuestion &&
      q.questionNumber <= sp.toQuestion
  );
}

export default function PaperPreview({
  paperId,
  refreshTrigger,
  onEdit,
}: {
  paperId: string;
  refreshTrigger: number;
  onEdit: (question: any) => void;
}) {
    const [questions, setQuestions] = useState<any[]>([]);
  const [passages, setPassages] = useState<Record<string, string>>({});
  const [sharedPrompts, setSharedPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setLoadError("");

      try {
                const res = await fetch(`/api/questions?paper=${paperId}`);
        if (!res.ok) throw new Error(`Questions request failed (status ${res.status})`);
        const data = await res.json();
        setQuestions(data);

        const spRes = await fetch(`/api/shared-prompts?paper=${paperId}`);
        setSharedPrompts(spRes.ok ? await spRes.json() : []);

        const passageKeys: string[] = Array.from(
          new Set(
            data
              .filter((q: any) => q.questionType === "theory" && effectivePassageNumber(q))
              .map((q: any) => `${q.component}|${effectivePassageNumber(q)}`)
          )
        );

        const passageEntries = await Promise.all(
          passageKeys.map(async (key) => {
            const [comp, num] = key.split("|");
            const pRes = await fetch(
              `/api/passages?paper=${paperId}&component=${comp}&passageNumber=${num}`
            );
            if (!pRes.ok) return [key, ""];
            const pData = await pRes.json();
            return [key, pData?.passageText || ""];
          })
        );
        setPassages(Object.fromEntries(passageEntries));
      } catch (err: any) {
        setLoadError(err.message || "Something went wrong while loading questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [paperId, refreshTrigger]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this question? This cannot be undone.");
    if (!confirmed) return;

    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q._id !== id));
  };

  const componentNames = sortComponentNames(
    Array.from(new Set(questions.map((q) => q.component || "")))
  );

  const renderQuestion = (q: any) => {
    const isTheory = q.questionType === "theory";
    const numberLabel =
      q.questionNumber != null ? `Q${q.questionNumber}${q.subPart || ""}.` : `${q.subPart}.`;

    return (
      <div key={q._id} className="mb-4 border-b border-gray-200 pb-3">
        <p className="my-1 font-bold text-foreground">{numberLabel}</p>
        {q.imageUrl && (
          <img
            src={q.imageUrl}
            alt=""
            className="mb-2 max-w-full rounded-md border border-gray-200"
          />
        )}
        <div
          className="text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: q.questionText }}
        />
        {q.options?.A && (
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            <li>A. {q.options.A}</li>
            <li>B. {q.options.B}</li>
            <li>C. {q.options.C}</li>
            <li>D. {q.options.D}</li>
          </ul>
        )}
                <p className="mt-2 text-xs text-gray-500">
          Topic: {q.topic}
          {!isTheory && ` | Answer: ${q.correctAnswer}`}
        </p>
        {!isTheory &&
          (() => {
            const sp = findSharedPrompt(q, sharedPrompts);
            return sp ? (
                            <p className="text-xs font-medium text-navy">
                📎 Shared Prompt{sp.component ? ` (${sp.component})` : ""}: Questions {sp.fromQuestion}–{sp.toQuestion}
              </p>
            ) : null;
          })()}
        {isTheory && effectivePassageNumber(q) && (
          <p className="text-xs font-medium text-navy">📎 Passage {effectivePassageNumber(q)}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => onEdit(q)}>
            Edit
          </Button>
          <Button type="button" variant="danger" onClick={() => handleDelete(q._id)}>
            Delete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl rounded-md border border-gray-300 p-4">
      <h3 className="mb-3 text-base font-bold text-foreground sm:text-lg">
        Live Preview ({questions.length} question{questions.length !== 1 ? "s" : ""} added)
      </h3>
      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {loadError && <p className="text-sm font-medium text-red-600">❌ {loadError}</p>}
      {!loading && !loadError && questions.length === 0 && (
        <p className="text-sm text-gray-500">No questions added yet.</p>
      )}

      {!loading &&
        componentNames.map((comp) => {
          const compQuestions = questions.filter((q) => (q.component || "") === comp);

          const passageNumbersPresent = Array.from(
            new Set(
              compQuestions
                .map((q) => effectivePassageNumber(q))
                .filter((n): n is number => Boolean(n))
            )
          ).sort((a, b) => a - b);

          return (
            <div key={comp || "no-component"} className="mb-5">
              {comp && <p className="mb-2 text-sm font-bold text-foreground">{comp}</p>}

              {(() => {
                const sorted = [...compQuestions].sort(sortQuestionsWithinGroup);
                let lastPassageNum: number | undefined = undefined;
                return sorted.map((q) => {
                  const num = effectivePassageNumber(q);
                  const isNewPassage = num !== undefined && num !== lastPassageNum;
                  if (isNewPassage) lastPassageNum = num;
                  const passageText = isNewPassage ? passages[`${comp}|${num}`] : undefined;

                  return (
                    <div key={q._id}>
                      {passageText && (
                        <div className="mb-3 rounded-md bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            {passageNumbersPresent.length > 1 ? `Passage ${num}` : "Passage"}
                          </p>
                          <div
                            className="mt-1 text-sm leading-relaxed text-foreground"
                            dangerouslySetInnerHTML={{ __html: passageText }}
                          />
                        </div>
                      )}
                      {renderQuestion(q)}
                    </div>
                  );
                });
              })()}
            </div>
          );
        })}
    </div>
  );
}