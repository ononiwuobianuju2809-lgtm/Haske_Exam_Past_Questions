import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Student from "@/models/Student";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const student = await Student.findOne({ verificationToken: token });
  if (!student) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }

  student.emailVerified = true;
  student.verificationToken = undefined;
  await student.save();

  return NextResponse.json({ success: true });
}