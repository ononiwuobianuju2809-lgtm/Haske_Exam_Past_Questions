import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Paper from "@/models/Paper";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

// Create a new paper, or return the existing one if it already exists
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { examType, subject, year, paperType } = body;

  let paper = await Paper.findOne({ examType, subject, year, paperType });

  if (!paper) {
    paper = await Paper.create({ examType, subject, year, paperType });
  }

  return NextResponse.json(paper);
}

// Get all papers (useful later for an admin "manage papers" list)
export async function GET() {
  await connectDB();
  const papers = await Paper.find().sort({ createdAt: -1 });
  return NextResponse.json(papers);
}