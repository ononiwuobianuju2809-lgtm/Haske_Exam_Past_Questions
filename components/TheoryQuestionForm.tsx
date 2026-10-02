"use client";
import { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import ImageUpload from "./ImageUpload";
import Button from "./Button";

const COMPONENTS = ["Comprehension", "Summary", "Essay"];
const PASSAGE_COMPONENTS = ["Comprehension", "Summary"];
const LETTER_ONLY_COMPONENTS = ["Comprehension"];
const MULTI_PASSAGE_COMPONENTS = ["Comprehension"];

export default function TheoryQuestionForm({
  paperId,
  onSaved,
  editingQuestion,
  subject,
}: {
  paperId: string;
  onSaved: () => void;
  editingQuestion?: any;
  subject?: string;
}) {
  const isEnglish = (subject || "").trim().toLowerCase().includes("english");

  const [component, setComponent] = useState(isEnglish ? "Essay" : "");
  const [passageNumber, setPassageNumber] = useState(1);
  const [questionNumber, setQuestionNumber] = useState("1");
  const [subPart, setSubPart] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [topic, setTopic] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

    const [passageText, setPassageText] = useState("");
  const [passageSaved, setPassageSaved] = useState(false);
  const [passageEditorVersion, setPassageEditorVersion] = useState(0);
  const [sharesPassage, setSharesPassage] = useState(false);

  const showEnglishPassage = isEnglish && PASSAGE_COMPONENTS.includes(component);
  const showPassage = showEnglishPassage || (!isEnglish && sharesPassage);
  const isLetterOnly = isEnglish && LETTER_ONLY_COMPONENTS.includes(component);

  useEffect(() => {
    setPassageNumber(1);
  }, [component]);

  useEffect(() => {
    if (editingQuestion) {
      setComponent(editingQuestion.component || (isEnglish ? "Essay" : ""));
      setPassageNumber(editingQuestion.passageNumber || 1);
      setQuestionNumber(
        editingQuestion.questionNumber !== undefined && editingQuestion.questionNumber !== null
          ? String(editingQuestion.questionNumber)
          : ""
      );
      setSubPart(editingQuestion.subPart || "");
      setImageUrl(editingQuestion.imageUrl || "");
      setQuestionText(editingQuestion.questionText || "");
      setTopic(editingQuestion.topic || "");
    }
  }, [editingQuestion]);

  useEffect(() => {
    if (!showPassage) {
      setPassageText("");
      setPassageSaved(false);
      return;
    }
    const loadPassage = async () => {
      const res = await fetch(
        `/api/passages?paper=${paperId}&component=${component}&passageNumber=${passageNumber}`
      );
      const data = await res.json();
      if (data && data.passageText) {
        setPassageText(data.passageText);
        setPassageSaved(true);
      } else {
        setPassageText("");
        setPassageSaved(false);
      }
    };
    loadPassage();
  }, [component, passageNumber, paperId, showPassage]);

  const savePassage = async () => {
    await fetch("/api/passages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper: paperId, component, passageNumber, passageText }),
    });
    setPassageSaved(true);
  };

  const deletePassage = async () => {
    const confirmed = window.confirm(
      `Delete ${component}${passageNumber === 2 ? ` Passage ${passageNumber}` : ""}? This will also delete EVERY question saved under this passage. This cannot be undone.`
    );
    if (!confirmed) return;

    const res = await fetch(
      `/api/passages?paper=${paperId}&component=${component}&passageNumber=${passageNumber}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setPassageText("");
      setPassageSaved(false);
      setPassageEditorVersion((v) => v + 1);
      setSaveMessage("✓ Passage and its questions deleted");
      setTimeout(() => setSaveMessage(""), 2500);
      onSaved();
    } else {
      setSaveMessage("❌ Something went wrong deleting the passage.");
    }
  };

  const saveQuestion = async () => {
    if (!questionText.trim() || questionText === "<p></p>") {
      setSaveMessage("❌ Please enter the question text before saving.");
      return;
    }
    if (!topic.trim()) {
      setSaveMessage("❌ Please enter a topic before saving.");
      return;
    }
    if (isLetterOnly && !subPart.trim()) {
      setSaveMessage("❌ Please enter a label (e.g. a, b, f(i)) before saving.");
      return;
    }
    if (!isLetterOnly && !questionNumber) {
      setSaveMessage("❌ Please enter a question number before saving.");
      return;
    }

    const payload = {
      paper: paperId,
      component,
      questionType: "theory",
      questionNumber: isLetterOnly ? null : Number(questionNumber),
      subPart,
      imageUrl,
      questionText,
      topic,
      passageNumber: showPassage ? passageNumber : undefined,
    };

    const isEditing = Boolean(editingQuestion);

    let res;
    try {
      res = await fetch(
        isEditing ? `/api/questions/${editingQuestion._id}` : "/api/questions",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
    } catch (err) {
      setSaveMessage("❌ Network error — nothing was saved.");
      return;
    }

    if (!res.ok) {
      const errorText = await res.text();
      setSaveMessage(`❌ Something went wrong — nothing was saved. (${errorText})`);
      return;
    }

    onSaved();

    setSaveMessage(isEditing ? "✓ Question updated" : "✓ Question saved");
    setTimeout(() => setSaveMessage(""), 2000);

    if (isEditing) {
      setQuestionNumber("");
      setSubPart("");
    } else if (!isLetterOnly && !subPart) {
      setQuestionNumber(String(Number(questionNumber) + 1));
    }
    setImageUrl("");
    setQuestionText("");
    setTopic("");
  };

  const editingLabel = editingQuestion
    ? `${editingQuestion.questionNumber ?? ""}${editingQuestion.subPart ?? ""}`
    : "";

  const inputClass =
    "w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30";
  const labelClass = "mb-1 block text-sm font-medium text-foreground";
  const isError = saveMessage.startsWith("❌");

  return (
    <div className="mx-auto mt-6 grid w-full max-w-2xl gap-4 px-1">
      {editingQuestion && (
        <p className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Editing Question {editingLabel} — Save will update it, not add a new one.
        </p>
      )}

      {isEnglish && (
        <div>
          <label className={labelClass}>Component</label>
          <select
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className={inputClass}
          >
            {COMPONENTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

            {!isEnglish && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sharesPassage"
            checked={sharesPassage}
            onChange={(e) => setSharesPassage(e.target.checked)}
          />
          <label htmlFor="sharesPassage" className="text-sm text-foreground">
            This question shares a passage/table/diagram with other questions
          </label>
        </div>
      )}

      {!isEnglish && sharesPassage && (
        <div>
          <label className={labelClass}>Which passage number?</label>
          <input
            type="number"
            min={1}
            value={passageNumber}
            onChange={(e) => setPassageNumber(Number(e.target.value) || 1)}
            className={`${inputClass} w-24`}
          />
        </div>
      )}

      {showPassage && (
        <div className="rounded-md border border-gray-300 p-4">
          {MULTI_PASSAGE_COMPONENTS.includes(component) ? (
            <>
              <div className="mb-3">
                <label className={labelClass}>Which passage is this?</label>
                <select
                  value={passageNumber}
                  onChange={(e) => setPassageNumber(Number(e.target.value))}
                  className={inputClass}
                >
                  <option value={1}>Passage 1</option>
                  <option value={2}>Passage 2</option>
                </select>
              </div>
              <p className="mb-2 text-sm text-gray-600">
                Passage {passageNumber} for {component} (shared by all questions under it):
              </p>
            </>
          ) : (
            <p className="mb-2 text-sm text-gray-600">
              {isEnglish
                ? `Passage for ${component} (shared by all questions under it):`
                : `Passage ${passageNumber} (shared by all questions under it):`}
            </p>
          )}
          <RichTextEditor
            key={`${component}-${passageNumber}-${passageEditorVersion}`}
            value={passageText}
            onChange={setPassageText}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={savePassage}>
              Save Passage
            </Button>
            {passageSaved && (
              <Button type="button" variant="danger" onClick={deletePassage}>
                Delete Passage
              </Button>
            )}
            {passageSaved && (
              <span className="text-sm font-medium text-green-600">✓ Saved</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!isLetterOnly && (
          <input
            placeholder="Question #"
            value={questionNumber}
            onChange={(e) => setQuestionNumber(e.target.value)}
            className={`${inputClass} w-24`}
          />
        )}
        <input
          placeholder={isLetterOnly ? "Label (a, b, f(i)...)" : "Sub-part (a, b, f(i)...) optional"}
          value={subPart}
          onChange={(e) => setSubPart(e.target.value)}
          className={`${inputClass} min-w-[160px] flex-1`}
        />
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <div>
        <label className={labelClass}>Question Text</label>
        <RichTextEditor value={questionText} onChange={setQuestionText} />
      </div>

      <div>
        <label className={labelClass}>Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={saveQuestion}>
          {editingQuestion ? "Update Question" : "Save Question"}
        </Button>
        {saveMessage && (
          <span className={`text-sm font-medium ${isError ? "text-red-600" : "text-green-600"}`}>
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}