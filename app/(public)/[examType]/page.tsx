import Link from "next/link";
import { WAEC_CATEGORIES, JAMB_CATEGORIES } from "@/lib/subjects";
import AdSlot from "@/components/AdSlot";

export default async function ExamCategoriesPage({
  params,
}: {
  params: Promise<{ examType: string }>;
}) {
    const { examType } = await params;
  const examTypeUpper = examType.toUpperCase();
  const displayExamType = examTypeUpper === "JAMB" ? "UTME" : examTypeUpper;
  const categories = examTypeUpper === "JAMB" ? JAMB_CATEGORIES : WAEC_CATEGORIES;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold text-navy mb-8 text-center">
        {displayExamType} Subjects
      </h1>
      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.name}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {category.name}
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {category.subjects.map((subject) => (
                <Link
                  key={subject}
                  href={`/${examType}/${encodeURIComponent(subject)}`}
                  className="text-navy underline decoration-navy/30 underline-offset-4 hover:decoration-navy"
                >
                  {subject}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AdSlot slotKey="exam-category" />
    </main>
  );
}