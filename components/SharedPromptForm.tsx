"use client";
import { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import ImageUpload from "./ImageUpload";
import Button from "./Button";

export default function SharedPromptForm({ paperId, component }: { paperId: string; component?: string }) {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromQuestion, setFromQuestion] = useState("");
  const [toQuestion, setToQuestion] = useState("");
  const [promptText, setPromptText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadPrompts = async () => {
    setLoading(true);
    const res = await fetch(`/api/shared-prompts?paper=${paperId}`);
    const data = await res.json();
    setPrompts(data.filter((p: any) => (p.component || "") === (component || "")));
    setLoading(false);
  };

  useEffect(() => {
    loadPrompts();
  }, [paperId, component]);

  const resetForm = () => {
    setFromQuestion("");
    setToQuestion("");
    setPromptText("");
    setImageUrl("");
    setEditingId(null);
  };

  const startEdit = (p: any) => {
    setEditingId(p._id);
    setFromQuestion(String(p.fromQuestion));
    setToQuestion(String(p.toQuestion));
    setPromptText(p.promptText || "");
    setImageUrl(p.imageUrl || "");
    setMessage("");
  };

  const handleSave = async () => {
    if (!fromQuestion || !toQuestion) {
      setMessage("❌ Please enter both a From and To question number.");
      return;
    }
    if (Number(fromQuestion) > Number(toQuestion)) {
      setMessage("❌ 'From' question number can't be greater than 'To'.");
      return;
    }
    if (!promptText.trim() || promptText === "<p></p>") {
      setMessage("❌ Please enter the shared story/scenario text.");
      return;
    }

        const payload = {
      paper: paperId,
      component: component || "",
      fromQuestion: Number(fromQuestion),
      toQuestion: Number(toQuestion),
      promptText,
      imageUrl,
    };

    const res = await fetch(
      editingId ? `/api/shared-prompts/${editingId}` : "/api/shared-prompts",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      setMessage(editingId ? "✓ Shared Prompt updated" : "✓ Shared Prompt saved");
      setTimeout(() => setMessage(""), 2000);
      resetForm();
      loadPrompts();
    } else {
      setMessage("❌ Something went wrong — nothing was saved.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this Shared Prompt? Questions that relied on it will no longer show it. This cannot be undone."
    );
    if (!confirmed) return;

    await fetch(`/api/shared-prompts/${id}`, { method: "DELETE" });
    loadPrompts();
    if (editingId === id) resetForm();
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30";
  const labelClass = "mb-1 block text-sm font-medium text-foreground";
  const isError = message.startsWith("❌");

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl rounded-md border border-gray-300 p-4">
      <h3 className="mb-3 text-base font-bold text-foreground sm:text-lg">
        Shared Prompts (stories/scenarios used by multiple questions)
      </h3>

      {!loading && prompts.length === 0 && (
        <p className="text-sm text-gray-500">None added yet for this paper.</p>
      )}
      {!loading &&
        prompts.map((p) => (
          <div key={p._id} className="mb-3 border-b border-gray-200 pb-3">
            <p className="mb-1 text-xs text-gray-500">
              Applies to Questions {p.fromQuestion}–{p.toQuestion}
            </p>
            <div
              className="text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: p.promptText }}
            />
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt=""
                className="mt-2 max-w-full rounded-md border border-gray-200"
              />
            )}
            <div className="mt-2 flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => startEdit(p)}>
                Edit
              </Button>
              <Button type="button" variant="danger" onClick={() => handleDelete(p._id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}

      <div className="mt-4">
        <p className="mb-2 font-semibold text-foreground">
          {editingId ? "Editing Shared Prompt" : "Add a new Shared Prompt"}
        </p>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="number"
            placeholder="From Question #"
            value={fromQuestion}
            onChange={(e) => setFromQuestion(e.target.value)}
            className={`${inputClass} w-36`}
          />
          <input
            type="number"
            placeholder="To Question #"
            value={toQuestion}
            onChange={(e) => setToQuestion(e.target.value)}
            className={`${inputClass} w-36`}
          />
        </div>

        <div className="mb-3">
          <label className={labelClass}>Shared Story/Scenario Text</label>
          <RichTextEditor key={editingId || "new"} value={promptText} onChange={setPromptText} />
        </div>

        <div className="mb-3">
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleSave}>
            {editingId ? "Update Prompt" : "Save Prompt"}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
          {message && (
            <span className={`text-sm font-medium ${isError ? "text-red-600" : "text-green-600"}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}