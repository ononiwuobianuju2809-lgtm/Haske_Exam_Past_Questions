import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import SharedPrompt from "@/models/SharedPrompt";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

// Update one Shared Prompt by its ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const updated = await SharedPrompt.findByIdAndUpdate(id, body, { new: true });

  if (!updated) {
    return NextResponse.json({ error: "Shared Prompt not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// Delete one Shared Prompt by its ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  await SharedPrompt.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}