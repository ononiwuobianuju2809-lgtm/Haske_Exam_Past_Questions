import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Passage from "@/models/Passage";
import Question from "@/models/Question";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

// Save (or update) the passage for a paper + component
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  const passage = await Passage.findOneAndUpdate(
    { paper: body.paper, component: body.component, passageNumber: body.passageNumber || 1 },
    body,
    { new: true, upsert: true }
  );

  return NextResponse.json(passage);
}

// Get the passage for a specific paper + component
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paper");
  const component = searchParams.get("component");
  const passageNumber = Number(searchParams.get("passageNumber") || "1");

    const filter: Record<string, any> = {};
  if (paperId) filter.paper = paperId;
  if (component) filter.component = component;

  // Older passages saved before "Passage 2" existed have no passageNumber field at all —
  // treat those as Passage 1 automatically, matching how Live Preview groups them
  if (passageNumber === 1) {
    filter.$or = [
      { passageNumber: 1 },
      { passageNumber: { $exists: false } },
      { passageNumber: null },
    ];
  } else {
    filter.passageNumber = passageNumber;
  }

  const passage = await Passage.findOne(filter);

  return NextResponse.json(passage);
}

// Delete a passage AND every question saved under it (same paper + component + passage number)
export async function DELETE(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paper");
  const component = searchParams.get("component");
  const passageNumber = Number(searchParams.get("passageNumber") || "1");

  if (!paperId || !component) {
    return NextResponse.json({ error: "Missing paper or component" }, { status: 400 });
  }

  await Passage.deleteOne({ paper: paperId, component, passageNumber });

  // Older questions saved before "Passage 2" existed have no passageNumber field —
  // treat those as belonging to Passage 1 so they're cleaned up correctly too
  const questionFilter: any = { paper: paperId, component, questionType: "theory" };
  if (passageNumber === 1) {
    questionFilter.$or = [
      { passageNumber: 1 },
      { passageNumber: { $exists: false } },
      { passageNumber: null },
    ];
  } else {
    questionFilter.passageNumber = passageNumber;
  }

  const result = await Question.deleteMany(questionFilter);

  return NextResponse.json({ success: true, questionsDeleted: result.deletedCount });
}