import mongoose, { Schema, models, model } from "mongoose";

const StudentSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
        resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    isLoggedIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Student || model("Student", StudentSchema);