import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Paper from "@/models/Paper";
import Question from "@/models/Question";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const stripAnswer = (q: any) => ({
  _id: q._id,
  component: q.component,
  questionText: q.questionText,
  imageUrl: q.imageUrl,
  options: q.options,
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const examType = (searchParams.get("examType") || "").toUpperCase();
  const subject = searchParams.get("subject") || "";

  if (!["WAEC", "JAMB"].includes(examType) || !subject.trim()) {
    return NextResponse.json({ error: "Missing or invalid examType/subject." }, { status: 400 });
  }

  const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const papers = await Paper.find({
    examType,
    subject: { $regex: `^${escapedSubject}$`, $options: "i" },
    paperType: "objective",
  }).select("_id");
  const paperIds = papers.map((p) => p._id);
  const isEnglish = subject.toLowerCase().includes("english");

  const pickSection = async (component: string, count: number) => {
    const pool = await Question.find({ paper: { $in: paperIds }, component });
    return shuffle(pool).slice(0, count);
  };

  if (examType === "WAEC" && isEnglish) {
    const grammar = await pickSection("Grammar", 60);
    const oral = await pickSection("Oral", 60);
    return NextResponse.json({
      sections: [
        { requested: 60, actual: grammar.length },
        { requested: 60, actual: oral.length },
      ],
      questions: [...grammar, ...oral].map(stripAnswer),
    });
  }

  if (examType === "JAMB" && isEnglish) {
    const comprehension = await pickSection("Comprehension and Summary", 25);
    const lexis = await pickSection("Lexis and Structure", 25);
    const oralForms = await pickSection("Oral Forms", 10);
    return NextResponse.json({
      sections: [
        { requested: 25, actual: comprehension.length },
        { requested: 25, actual: lexis.length },
        { requested: 10, actual: oralForms.length },
      ],
      questions: [...comprehension, ...lexis, ...oralForms].map(stripAnswer),
    });
  }

  const target = examType === "WAEC" ? 60 : 40;
  const pool = await Question.find({ paper: { $in: paperIds } });
  const selected = shuffle(pool).slice(0, target);

  return NextResponse.json({
    requested: target,
    actual: selected.length,
    questions: selected.map(stripAnswer),
  });
}