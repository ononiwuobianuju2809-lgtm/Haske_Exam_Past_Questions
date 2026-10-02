import mongoose, { Schema, models, model } from "mongoose";

const SharedPromptSchema = new Schema(
  {
        paper: { type: Schema.Types.ObjectId, ref: "Paper", required: true },
    component: { type: String, default: "" },
    fromQuestion: { type: Number, required: true }, // e.g. 11
    toQuestion: { type: Number, required: true },   // e.g. 12
    promptText: { type: String, required: true },   // the shared story/scenario (rich text)
    imageUrl: { type: String, default: "" },        // optional, e.g. for Maths diagrams
  },
  { timestamps: true }
);

export default models.SharedPrompt || model("SharedPrompt", SharedPromptSchema);