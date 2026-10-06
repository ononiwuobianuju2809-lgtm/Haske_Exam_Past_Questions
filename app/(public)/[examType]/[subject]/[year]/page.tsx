import mongoose from "mongoose";
import Paper from "@/models/Paper";
import Question from "@/models/Question";
import Passage from "@/models/Passage";
import SharedPrompt from "@/models/SharedPrompt";
import AdSlot from "@/components/AdSlot";
import CleanCopy from "@/components/CleanCopy";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

type QuestionDoc = {
  _id: string;
  component: string;
  questionNumber?: number;
  subPart: string;
  imageUrl: string;
  questionText: string;
  options: { A?: string; B?: string; C?: string; D?: string };
  correctAnswer?: string;
  passageNumber?: number;
};

type PassageDoc = {
  _id: string;
  component: string;
  passageText: string;
  passageNumber: number;
};

type SharedPromptDoc = {
  _id: string;
  component: string;
  fromQuestion: number;
  toQuestion: number;
  promptText: string;
  imageUrl: string;
};

type Group = { component: string; items: QuestionDoc[] };

const isEnglish = (subject: string) => subject.toLowerCase().includes("english");

// English Comprehension/Summary questions saved without a passage number belong
// to Passage 1 (the same rule the admin Live Preview uses).
const PASSAGE_COMPONENTS = ["Comprehension", "Summary"];
function effectivePassageNumber(q: QuestionDoc) {
  if (q.passageNumber) return q.passageNumber;
  if (PASSAGE_COMPONENTS.includes(q.component)) return 1;
  return undefined;
}

// Orders theory questions. For English, a passage's questions stay together
// (Passage 1 first, then Passage 2); for other subjects, true number order.
function compareTheory(a: QuestionDoc, b: QuestionDoc, passageFirst: boolean) {
  if (passageFirst) {
    const pa = effectivePassageNumber(a) ?? 0;
    const pb = effectivePassageNumber(b) ?? 0;
    if (pa !== pb) return pa - pb;
  }
  const an = a.questionNumber ?? null;
  const bn = b.questionNumber ?? null;
  if (an !== null && bn !== null && an !== bn) return an - bn;
  if (an !== null && bn === null) return -1;
  if (an === null && bn !== null) return 1;
  return (a.subPart || "").localeCompare(b.subPart || "", undefined, { numeric: true });
}

// Puts the question number inside the question's own first paragraph, so it
// copies and pastes (for example into Word) as one natural line.
function withLabel(html: string | undefined, label: string) {
  const text = html ?? "";
  const safeLabel = label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const labelHtml = `<strong>${safeLabel}</strong> `;
  if (/^\s*<p[^>]*>/i.test(text)) {
    return text.replace(/^\s*<p([^>]*)>/i, (_match, attrs) => `<p${attrs}>${labelHtml}`);
  }
  return `<p>${labelHtml}${text}</p>`;
}

const OBJECTIVE_ORDER = ["Grammar", "Oral"];
// Standard WAEC English Paper 2 order: Section A Essay, B Comprehension, C Summary
const THEORY_ORDER = ["Essay", "Comprehension", "Summary"];

function groupByComponent<T extends { component: string }>(items: T[], order: string[]) {
  const groups: { component: string; items: T[] }[] = [];
  const used = new Set<string>();

  for (const comp of order) {
    const matches = items.filter((i) => i.component === comp);
    if (matches.length) {
      groups.push({ component: comp, items: matches });
      used.add(comp);
    }
  }
  const leftover = items.filter((i) => !used.has(i.component));
  if (leftover.length) {
    groups.push({ component: leftover[0].component || "", items: leftover });
  }
  return groups;
}

export default async function ExamPaperPage({
  params,
}: {
  params: Promise<{ examType: string; subject: string; year: string }>;
}) {
  const { examType, subject: rawSubject, year } = await params;
  const subject = decodeURIComponent(rawSubject);
  await connectDB();

  const examTypeUpper = examType.toUpperCase();
  const displayExamType = examTypeUpper === "JAMB" ? "UTME" : examTypeUpper;
  const yearNumber = Number(year);

  if (Number.isNaN(yearNumber)) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">Not Found</h1>
        <p className="text-gray-700">That doesn&apos;t look like a valid year.</p>
      </main>
    );
  }

  const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const papers = await Paper.find({
    examType: examTypeUpper,
    subject: { $regex: `^${escapedSubject}$`, $options: "i" },
    year: yearNumber,
  }).lean();

  const objectivePaper = papers.find((p: any) => p.paperType === "objective");
  const theoryPaper = papers.find((p: any) => p.paperType === "theory");

  if (!objectivePaper && !theoryPaper) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">Not Found</h1>
        <p className="text-gray-700">
          We don&apos;t have {subject} {year} ({displayExamType}) yet.
        </p>
      </main>
    );
  }

  // The four lookups below are independent, so they run together (faster).
  const [objectiveQuestions, sharedPrompts, theoryQuestions, passages] = await Promise.all([
    (objectivePaper
      ? Question.find({ paper: objectivePaper._id }).sort({ questionNumber: 1 }).lean()
      : Promise.resolve([])) as unknown as Promise<QuestionDoc[]>,
    (objectivePaper
      ? SharedPrompt.find({ paper: objectivePaper._id }).sort({ fromQuestion: 1 }).lean()
      : Promise.resolve([])) as unknown as Promise<SharedPromptDoc[]>,
    (theoryPaper
      ? Question.find({ paper: theoryPaper._id }).sort({ questionNumber: 1, subPart: 1 }).lean()
      : Promise.resolve([])) as unknown as Promise<QuestionDoc[]>,
    (theoryPaper
      ? Passage.find({ paper: theoryPaper._id }).lean()
      : Promise.resolve([])) as unknown as Promise<PassageDoc[]>,
  ]);

  const english = isEnglish(subject);
  const isJambEnglish = examTypeUpper === "JAMB" && english;
  const isWaecEnglish = examTypeUpper === "WAEC" && english;
  const objectiveOrder = isJambEnglish
    ? ["Comprehension and Summary", "Lexis and Structure", "Oral Forms"]
    : OBJECTIVE_ORDER;
  const hiddenHeadingComponent = isJambEnglish ? null : "Grammar";
  const promptComponents = isJambEnglish
    ? ["Comprehension and Summary", "Lexis and Structure", "Oral Forms"]
    : ["Grammar", "Oral"];

  const sortedTheoryQuestions = [...theoryQuestions].sort((a, b) =>
    compareTheory(a, b, english)
  );

  const objectiveGroups: Group[] = english
    ? groupByComponent(objectiveQuestions, objectiveOrder)
    : [];
  // WAEC English: Oral is its own paper (Paper 3), so it goes last on the page.
  const oralGroups = isWaecEnglish ? objectiveGroups.filter((g) => g.component === "Oral") : [];
  const mainObjectiveGroups = isWaecEnglish
    ? objectiveGroups.filter((g) => g.component !== "Oral")
    : objectiveGroups;

  const renderObjectiveGroup = (group: Group, showHeading: boolean) => (
    <div key={group.component} className="mb-8">
      {showHeading && (
        <h3 className="text-lg font-medium text-gray-800 mb-3">{group.component}</h3>
      )}
      {group.items.map((q) => {
        const prompt = promptComponents.includes(group.component)
          ? sharedPrompts.find(
              (sp) => sp.component === group.component && sp.fromQuestion === q.questionNumber
            )
          : undefined;
        return (
          <div key={q._id}>
            {prompt && <SharedPromptBlock prompt={prompt} />}
            <ObjectiveQuestion question={q} />
          </div>
        );
      })}
    </div>
  );

  return (
    <main className="exam-content max-w-3xl mx-auto px-4 py-10">
      <CleanCopy />
      <h1 className="text-2xl font-bold text-navy mb-8 text-center">
        {displayExamType} {subject} {year}
      </h1>

      {objectivePaper && (!english || mainObjectiveGroups.length > 0) && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-navy mb-4">Objective</h2>
          {english
            ? mainObjectiveGroups.map((group) =>
                renderObjectiveGroup(group, group.component !== hiddenHeadingComponent)
              )
            : objectiveQuestions.map((q) => {
                const prompt = sharedPrompts.find((sp) => sp.fromQuestion === q.questionNumber);
                return (
                  <div key={q._id}>
                    {prompt && <SharedPromptBlock prompt={prompt} />}
                    <ObjectiveQuestion question={q} />
                  </div>
                );
              })}
        </section>
      )}

      {theoryPaper && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-navy mb-4">Theory</h2>
          {groupByComponent(sortedTheoryQuestions, THEORY_ORDER).map((group) => {
            const groupPassages = passages.filter(
              (p) => (p.component || "") === (group.component || "")
            );
            let lastPassageNumber: number | undefined = undefined;
            return (
              <div key={group.component || "theory"} className="mb-8">
                {group.component && (
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{group.component}</h3>
                )}
                {group.items.map((q) => {
                  const passageNumber = effectivePassageNumber(q);
                  const isNewPassage =
                    passageNumber !== undefined && passageNumber !== lastPassageNumber;
                  if (isNewPassage) lastPassageNumber = passageNumber;
                  const passageForThis = isNewPassage
                    ? groupPassages.find((p) => p.passageNumber === passageNumber)
                    : undefined;
                  return (
                    <div key={q._id}>
                      {passageForThis && (
                        <div
                          className="mb-4 rounded-md bg-gray-50 p-4 text-gray-700"
                          dangerouslySetInnerHTML={{ __html: passageForThis.passageText }}
                        />
                      )}
                      <TheoryQuestion question={q} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      )}

      {oralGroups.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-navy mb-4">Oral English</h2>
          {oralGroups.map((group) => renderObjectiveGroup(group, false))}
        </section>
      )}

      {objectivePaper && objectiveQuestions.length > 0 && (
        <section className="rounded-md bg-gray-50 p-4">
          <h2 className="mb-3 text-xl font-semibold text-navy">Objective Answers</h2>
          {english ? (
            objectiveGroups.map((group) => (
              <div key={group.component} className="mb-4">
                <p className="mb-1 text-sm font-medium text-gray-800">
                  {answerGroupLabel(group.component, examTypeUpper)}
                </p>
                <AnswerKey items={group.items} />
              </div>
            ))
          ) : (
            <AnswerKey items={objectiveQuestions} />
          )}
        </section>
      )}

      <AdSlot slotKey="exam-paper" />
    </main>
  );
}

function answerGroupLabel(component: string, examTypeUpper: string): string {
  if (examTypeUpper === "WAEC") {
    if (component === "Grammar") return "Paper 1 — Objective";
    if (component === "Oral") return "Paper 3 — Oral English";
  }
  if (examTypeUpper === "JAMB") {
    if (component === "Comprehension and Summary") return "Section A — Comprehension and Summary";
    if (component === "Lexis and Structure") return "Section B — Lexis and Structure";
    if (component === "Oral Forms") return "Section C — Oral Forms";
  }
  return component;
}

function AnswerKey({ items }: { items: QuestionDoc[] }) {
  return (
    <p className="text-sm leading-7">
      {items.map((q) => (
        <span key={q._id}>
          <span className="mr-5 inline-block whitespace-nowrap">
            <span className="font-medium">{q.questionNumber}.</span> {q.correctAnswer || "—"}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}

function ObjectiveQuestion({ question }: { question: QuestionDoc }) {
  return (
    <div className="mb-6 border-b border-gray-100 pb-4">
      <div
        className="mb-2 text-gray-800"
        dangerouslySetInnerHTML={{
          __html: withLabel(question.questionText, `${question.questionNumber ?? ""}.`),
        }}
      />
      {question.imageUrl && (
        <img src={question.imageUrl} alt="" className="mb-2 max-w-full rounded-md" />
      )}
      <div className="ml-6 space-y-1">
        {(["A", "B", "C", "D"] as const).map(
          (letter) =>
            question.options?.[letter] && (
              <p key={letter} className="text-gray-700">
                {letter}. {question.options[letter]}
              </p>
            )
        )}
      </div>
    </div>
  );
}

function TheoryQuestion({ question }: { question: QuestionDoc }) {
  return (
    <div
      className="mb-4 text-gray-800"
      dangerouslySetInnerHTML={{
        __html: withLabel(
          question.questionText,
          `${question.questionNumber ?? ""}${question.subPart ?? ""}.`
        ),
      }}
    />
  );
}

function SharedPromptBlock({ prompt }: { prompt: SharedPromptDoc }) {
  return (
    <div className="mb-4 rounded-md bg-gray-50 p-4 text-gray-700">
      <div dangerouslySetInnerHTML={{ __html: prompt.promptText }} />
      {prompt.imageUrl && (
        <img src={prompt.imageUrl} alt="" className="mt-2 max-w-full rounded-md" />
      )}
    </div>
  );
}