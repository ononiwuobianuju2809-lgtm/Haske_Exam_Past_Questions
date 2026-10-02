"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import ObjectiveQuestionForm from "@/components/ObjectiveQuestionForm";
import BulkObjectiveForm from "@/components/BulkObjectiveForm";
import BulkTheoryForm from "@/components/BulkTheoryForm";
import TheoryQuestionForm from "@/components/TheoryQuestionForm";
import SharedPromptForm from "@/components/SharedPromptForm";
import PaperPreview from "@/components/PaperPreview";
import Button from "@/components/Button";
import { WAEC_SUBJECTS, JAMB_SUBJECTS } from "@/lib/subjects";

const YEARS = Array.from({ length: 2099 - 1995 + 1 }, (_, i) => 1995 + i);

export default function AdminPage() {
  const [examType, setExamType] = useState("WAEC");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [paperType, setPaperType] = useState("objective");
  const [openPaper, setOpenPaper] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedComponent, setSelectedComponent] = useState("");
  const [entryMode, setEntryMode] = useState<"single" | "bulk">("single");

  const handleOpenPaper = async () => {
    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examType,
        subject,
        year: Number(year),
        paperType,
      }),
    });
    const data = await res.json();
    setOpenPaper(data);
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30";
  const labelClass = "mb-1 block text-sm font-medium text-foreground";

  if (openPaper) {
    const isEnglish = (openPaper.subject || "").trim().toLowerCase().includes("english");

    return (
      <div className="px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold text-foreground sm:text-xl">
            Now adding to: {openPaper.examType} {openPaper.subject}{" "}
            {openPaper.year} ({openPaper.paperType})
          </h1>
                    <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpenPaper(null)}>
              Close Paper
            </Button>
            <Button type="button" variant="secondary" onClick={() => signOut()}>
              Log Out
            </Button>
          </div>
        </div>

                <div className="mx-auto mt-6 flex w-full max-w-2xl justify-center gap-4">
          <button
            type="button"
            onClick={() => setEntryMode("single")}
            className={`text-sm font-semibold ${entryMode === "single" ? "text-navy" : "text-gray-400"}`}
          >
            One at a Time
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("bulk")}
            className={`text-sm font-semibold ${entryMode === "bulk" ? "text-navy" : "text-gray-400"}`}
          >
            Bulk Paste
          </button>
        </div>

        {openPaper.paperType === "theory" ? (
          entryMode === "bulk" ? (
            <BulkTheoryForm
              paperId={openPaper._id}
              subject={openPaper.subject}
              onSaved={() => setRefreshTrigger((prev) => prev + 1)}
            />
          ) : (
            <TheoryQuestionForm
              key={editingQuestion?._id || "new-theory"}
              paperId={openPaper._id}
              subject={openPaper.subject}
              onSaved={() => {
                setRefreshTrigger((prev) => prev + 1);
                setEditingQuestion(null);
              }}
              editingQuestion={editingQuestion}
            />
          )
        ) : entryMode === "bulk" ? (
          <BulkObjectiveForm
            paperId={openPaper._id}
            component={selectedComponent}
            onSaved={() => setRefreshTrigger((prev) => prev + 1)}
          />
        ) : (
          <ObjectiveQuestionForm
            key={editingQuestion?._id || "new-objective"}
            paperId={openPaper._id}
            subject={openPaper.subject}
            examType={openPaper.examType}
            onSaved={() => {
              setRefreshTrigger((prev) => prev + 1);
              setEditingQuestion(null);
            }}
            editingQuestion={editingQuestion}
            onComponentChange={setSelectedComponent}
          />
        )}

                    {openPaper.paperType === "objective" &&
          (!isEnglish ||
            selectedComponent === "Grammar" ||
            selectedComponent === "Lexis and Structure" ||
            selectedComponent === "Oral" ||
            selectedComponent === "Oral Forms" ||
            selectedComponent === "Comprehension and Summary") && (
            <SharedPromptForm paperId={openPaper._id} component={selectedComponent} />
          )}

        <PaperPreview
          paperId={openPaper._id}
          refreshTrigger={refreshTrigger}
          onEdit={(q) => {
            setEditingQuestion(q);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    );
  }

  return (
        <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="secondary" onClick={() => signOut()} className="!w-auto">
          Log Out
        </Button>
      </div>
      <h1 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl">
        Open a Paper
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleOpenPaper();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Exam Type</label>
            <select
              value={examType}
              onChange={(e) => {
                setExamType(e.target.value);
                setSubject(""); // the subject list is different for WAEC vs JAMB
              }}
              className={inputClass}
            >
              <option value="WAEC">WAEC</option>
              <option value="JAMB">JAMB</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Paper Type</label>
            <select
              value={paperType}
              onChange={(e) => setPaperType(e.target.value)}
              className={inputClass}
            >
              <option value="objective">Objective</option>
              <option value="theory">Theory</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>
                -- Select Subject --
              </option>
              {(examType === "JAMB" ? JAMB_SUBJECTS : WAEC_SUBJECTS).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>
                -- Select Year --
              </option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit">Open Paper</Button>
        </div>
      </form>
    </div>
  );
}