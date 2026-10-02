import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Question from "@/models/Question";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  await connectDB();
  const { answers } = await req.json();

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "No answers submitted." }, { status: 400 });
  }

  const questionIds = answers.map((a: any) => a.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let score = 0;
  const results = answers.map((a: any) => {
    const question = questionMap.get(a.questionId);
    const correct = question?.correctAnswer;
    const isCorrect = Boolean(a.selected) && a.selected === correct;
    if (isCorrect) score += 1;
    return {
      questionId: a.questionId,
      questionText: question?.questionText || "",
      options: question?.options || {},
      selected: a.selected || null,
      correctAnswer: correct || null,
      isCorrect,
    };
  });

  return NextResponse.json({ score, total: answers.length, results });
}