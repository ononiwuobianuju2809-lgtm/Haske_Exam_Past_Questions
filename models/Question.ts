import mongoose, { Schema, models, model } from "mongoose";

const QuestionSchema = new Schema(
  {
    paper: { type: Schema.Types.ObjectId, ref: "Paper", required: true },
    component: { type: String, default: "" }, // e.g. "Grammar", "Essay", "Oral" — blank for JAMB
    questionType: { type: String, enum: ["objective", "theory"], default: "objective" },
    questionNumber: { type: Number, required: false }, // optional — only Comprehension skips this, using letters only
    subPart: { type: String, default: "" }, // e.g. "a", "b", "c" — blank if question has no sub-parts
    passageNumber: { type: Number }, // which passage (1 or 2) this question belongs to, if any
    imageUrl: { type: String, default: "" }, // optional image before the question
    questionText: { type: String, default: "" }, // rich text (HTML) content — optional: blank for options-only cloze items
    options: {
      A: { type: String },
      B: { type: String },
      C: { type: String },
      D: { type: String },
    },
    correctAnswer: { type: String }, // e.g. "A" — only used for objective questions
    topic: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.Question || model("Question", QuestionSchema);