import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Question from "@/models/Question";
import Paper from "@/models/Paper";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

// Add a new question to a paper
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const question = await Question.create(body);

    return NextResponse.json(question);
  } catch (err: any) {
    console.error("Question save error:", err);
    return NextResponse.json({ error: err.message || "Failed to save question." }, { status: 500 });
  }
}

// Get questions — by paper, or by exam type + subject + a topic search (partial match)
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paper");
  const topic = searchParams.get("topic");
  const subject = searchParams.get("subject");
  const examType = searchParams.get("examType");

  const filter: Record<string, unknown> = {};

  if (paperId) {
    filter.paper = paperId;
  } else if (subject && examType) {
    const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const papers = await Paper.find({
      examType: examType.toUpperCase(),
      subject: { $regex: `^${escapedSubject}$`, $options: "i" },
    }).select("_id");
    filter.paper = { $in: papers.map((p) => p._id) };
  }

  if (topic) {
    const escapedTopic = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.topic = { $regex: escapedTopic, $options: "i" };
  }

  const questions = await Question.find(filter)
    .populate("paper", "examType subject year")
    .sort({ questionNumber: 1 });

  return NextResponse.json(questions);
}