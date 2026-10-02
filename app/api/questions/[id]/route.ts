import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Question from "@/models/Question";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

// Update one question by its ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params; // unwrap the ID properly before using it
  const body = await req.json();

  const updated = await Question.findByIdAndUpdate(id, body, { new: true });

  if (!updated) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// Delete one question by its ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params; // unwrap the ID properly before using it

  await Question.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}