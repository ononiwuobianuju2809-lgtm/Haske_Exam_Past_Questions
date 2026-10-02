import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { Resend } from "resend";
import Student from "@/models/Student";

const resend = new Resend(process.env.RESEND_API_KEY);

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const student = await Student.findOne({ email: email.toLowerCase().trim() });

    if (student) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      student.resetToken = resetToken;
      student.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await student.save();

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
      await resend.emails.send({
        from: process.env.EMAIL_FROM as string,
        to: student.email,
        subject: "Reset your password — Haske International Tutors",
        html: `<p>Hi ${student.name},</p><p>Click below to set a new password. This link expires in 1 hour:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Something went wrong on our end. Please try again." }, { status: 500 });
  }
}