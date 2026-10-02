"use client";
import { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import ImageUpload from "./ImageUpload";
import Button from "./Button";

export default function ObjectiveQuestionForm({
  paperId,
  onSaved,
  editingQuestion,
  subject,
  examType,
  onComponentChange,
}: {
  paperId: string;
  onSaved?: () => void;
  editingQuestion?: any;
  subject?: string;
  examType?: string;
  onComponentChange?: (component: string) => void;
}) {
    const isEnglish = (subject || "").trim().toLowerCase().includes("english");
    const isWaecEnglish = isEnglish && examType === "WAEC";
    const isJambEnglish = isEnglish && examType === "JAMB";
  const [component, setComponent] = useState("");
  const [questionNumber, setQuestionNumber] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [topic, setTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (editingQuestion) {
      setComponent(editingQuestion.component || "");
      setQuestionNumber(String(editingQuestion.questionNumber ?? ""));
      setImageUrl(editingQuestion.imageUrl || "");
      setQuestionText(editingQuestion.questionText || "");
      setOptionA(editingQuestion.options?.A || "");
      setOptionB(editingQuestion.options?.B || "");
      setOptionC(editingQuestion.options?.C || "");
      setOptionD(editingQuestion.options?.D || "");
      setCorrectAnswer(editingQuestion.correctAnswer || "A");
      setTopic(editingQuestion.topic || "");
      setEditorKey((prev) => prev + 1);
    }
    }, [editingQuestion]);

  useEffect(() => {
    onComponentChange?.(component);
  }, [component, onComponentChange]);

  const handleParseOptions = (pastedText: string) => {
        const matches = pastedText.split(/(?:^|\n|\s)([A-D])[\.\)]?\s*/).filter(Boolean);
    const result: Record<string, string> = {};
        for (let i = 0; i < matches.length; i += 2) {
      const letter = matches[i]?.trim().toUpperCase();
      const text = matches[i + 1]?.trim();
      if (["A", "B", "C", "D"].includes(letter)) {
        result[letter] = text;
      }
    }

    if (Object.keys(result).length === 0) {
      // No A/B/C/D letters found at all — treat the paste as plain
      // words separated by spaces, and fill A, B, C, D left to right.
      const words = pastedText.trim().split(/\s+/).filter(Boolean);
      const letters = ["A", "B", "C", "D"];
      words.slice(0, 4).forEach((word, i) => {
        result[letters[i]] = word;
      });
    }

    if (result.A) setOptionA(result.A);
    if (result.B) setOptionB(result.B);
    if (result.C) setOptionC(result.C);
    if (result.D) setOptionD(result.D);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSavedMessage("");
        const hasQuestionText = questionText.trim() && questionText !== "<p></p>";
    const hasOptions = optionA.trim() || optionB.trim() || optionC.trim() || optionD.trim();
    if (!hasQuestionText && !hasOptions) {
      setSavedMessage("❌ Please enter either the question text or at least one option before saving.");
      setSaving(false);
      return;
    }
    if (!topic.trim()) {
      setSavedMessage("❌ Please enter a topic before saving.");
      setSaving(false);
      return;
    }
    if (!questionNumber) {
      setSavedMessage("❌ Please enter a question number before saving.");
      setSaving(false);
      return;
    }
    const payload = {
      paper: paperId,
      component,
      questionNumber: Number(questionNumber),
      imageUrl,
      questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correctAnswer,
      topic,
    };

    try {
      const isEditing = Boolean(editingQuestion);
      const res = await fetch(
        isEditing ? `/api/questions/${editingQuestion._id}` : "/api/questions",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setSavedMessage(
          isEditing
            ? `✅ Question ${questionNumber} updated successfully!`
            : `✅ Question ${questionNumber} saved successfully!`
        );
        onSaved?.();
      } else {
        const errorText = await res.text();
        setSavedMessage(`❌ Something went wrong — question was not saved. (${errorText})`);
        setSaving(false);
        return;
      }
    } catch (err) {
      setSavedMessage(`❌ Network error — question was not saved.`);
      setSaving(false);
      return;
    }

    if (!editingQuestion) {
      setQuestionNumber((prev) => String(Number(prev) + 1));
    } else {
      setQuestionNumber("");
    }
    setImageUrl("");
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setTopic("");
    setEditorKey((prev) => prev + 1);
    setSaving(false);
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30";
  const labelClass = "mb-1 block text-sm font-medium text-foreground";
  const isError = savedMessage.startsWith("❌");

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl px-1">
      {editingQuestion && (
        <p className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Editing Question {editingQuestion.questionNumber} — Save will update it, not add a new one.
        </p>
      )}

                   {isWaecEnglish && (
        <div className="mb-4">
          <label className={labelClass}>Component</label>
          <select
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className={inputClass}
          >
            <option value="">Select component</option>
            <option value="Grammar">Grammar</option>
            <option value="Oral">Oral</option>
          </select>
        </div>
      )}

            {isJambEnglish && (
        <div className="mb-4">
          <label className={labelClass}>Section</label>
          <select
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className={inputClass}
          >
            <option value="">Select section</option>
            <option value="Comprehension and Summary">Comprehension and Summary</option>
            <option value="Lexis and Structure">Lexis and Structure</option>
            <option value="Oral Forms">Oral Forms</option>
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className={labelClass}>Question Number</label>
        <input
          type="number"
          value={questionNumber}
          onChange={(e) => setQuestionNumber(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="mb-4">
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Question Text</label>
        <RichTextEditor value={questionText} onChange={setQuestionText} />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Paste All Options (optional shortcut)</label>
        <textarea
          key={editorKey}
          placeholder={"Paste like:\nA. Lagos\nB. Abuja\nC. Kano\nD. Enugu"}
          onChange={(e) => handleParseOptions(e.target.value)}
          className={`${inputClass} min-h-[80px]`}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Option A</label>
          <input type="text" value={optionA} onChange={(e) => setOptionA(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Option B</label>
          <input type="text" value={optionB} onChange={(e) => setOptionB(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Option C</label>
          <input type="text" value={optionC} onChange={(e) => setOptionC(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Option D</label>
          <input type="text" value={optionD} onChange={(e) => setOptionD(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Correct Answer</label>
          <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className={inputClass}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Synonyms"
            className={inputClass}
          />
        </div>
      </div>

      <Button type="button" onClick={handleSubmit} disabled={saving}>
        {saving ? "Saving..." : editingQuestion ? "Update Question" : "Save Question & Add Next"}
      </Button>

      {savedMessage && (
        <p className={`mt-3 text-sm font-medium ${isError ? "text-red-600" : "text-green-600"}`}>
          {savedMessage}
        </p>
      )}
    </div>
  );
}