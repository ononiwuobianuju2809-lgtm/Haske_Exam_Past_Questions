import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
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
    const { name, email, phone, password } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Please enter your phone number." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existingEmail = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }
    const existingPhone = await Student.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return NextResponse.json({ error: "This phone number is already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const student = await Student.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      emailVerified: false,
      verificationToken,
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: student.email,
      subject: "Confirm your email — Haske International Tutors",
      html: `<p>Hi ${student.name},</p><p>Click below to confirm your email and activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    if (emailError) {
      await Student.deleteOne({ _id: student._id });
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: `We couldn't send the confirmation email: ${emailError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }
}