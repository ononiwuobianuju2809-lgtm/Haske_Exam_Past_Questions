import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Student from "@/models/Student";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token, password } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const student = await Student.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!student) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    student.passwordHash = await bcrypt.hash(password, 10);
    student.resetToken = undefined;
    student.resetTokenExpiry = undefined;
    await student.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong on our end. Please try again." }, { status: 500 });
  }
}