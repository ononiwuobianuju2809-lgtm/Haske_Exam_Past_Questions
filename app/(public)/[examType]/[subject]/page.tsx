import mongoose from "mongoose";
import Link from "next/link";
import Paper from "@/models/Paper";
import AdSlot from "@/components/AdSlot";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export default async function SubjectYearsPage({
  params,
}: {
  params: Promise<{ examType: string; subject: string }>;
}) {
    const { examType, subject: rawSubject } = await params;
  const subject = decodeURIComponent(rawSubject);
  const examTypeUpper = examType.toUpperCase();
  const displayExamType = examTypeUpper === "JAMB" ? "UTME" : examTypeUpper;

  await connectDB();

  const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const years: number[] = await Paper.find({
    examType: examTypeUpper,
    subject: { $regex: `^${escapedSubject}$`, $options: "i" },
  }).distinct("year");

  years.sort((a, b) => b - a);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-navy mb-8">
        {displayExamType} {subject}
      </h1>
      {years.length === 0 ? (
        <p className="text-gray-700">No papers available for this subject yet.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {years.map((year) => (
            <Link
              key={year}
              href={`/${examType}/${rawSubject}/${year}`}
              className="rounded-lg bg-navy px-6 py-3 font-medium text-white transition active:scale-95 active:bg-navy-dark"
            >
              {year}
            </Link>
          ))}
        </div>
      )}

      <AdSlot slotKey="subject-years" />
    </main>
  );
}