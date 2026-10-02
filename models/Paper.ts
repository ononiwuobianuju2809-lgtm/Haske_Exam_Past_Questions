import mongoose, { Schema, models, model } from "mongoose";

const PaperSchema = new Schema(
  {
    examType: { type: String, enum: ["WAEC", "JAMB"], required: true },
    subject: { type: String, required: true },
    year: { type: Number, required: true },
    paperType: { type: String, enum: ["objective", "theory"], required: true },
  },
  { timestamps: true }
);

export default models.Paper || model("Paper", PaperSchema);