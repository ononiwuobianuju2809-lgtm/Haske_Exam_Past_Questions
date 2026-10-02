import mongoose, { Schema, models, model } from "mongoose";

const PassageSchema = new Schema(
  {
    paper: { type: Schema.Types.ObjectId, ref: "Paper", required: true },
    component: { type: String, default: "" }, // e.g. "Comprehension", "Summary" — blank for non-English subjects
    passageNumber: { type: Number, default: 1 }, // 1 or 2 — for years with two passages under one component
    passageText: { type: String, required: true }, // rich text (HTML) content
  },
  { timestamps: true }
);

export default models.Passage || model("Passage", PassageSchema);