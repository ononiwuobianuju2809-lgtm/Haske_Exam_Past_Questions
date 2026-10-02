import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import SharedPrompt from "@/models/SharedPrompt";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

// Save a new Shared Prompt
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  const prompt = await SharedPrompt.create(body);

  return NextResponse.json(prompt);
}

// Get all Shared Prompts for a paper
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paper");

  const filter: Record<string, string> = {};
  if (paperId) filter.paper = paperId;

  const prompts = await SharedPrompt.find(filter).sort({ fromQuestion: 1 });

  return NextResponse.json(prompts);
}