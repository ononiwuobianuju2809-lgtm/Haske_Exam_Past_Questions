import Link from "next/link";
import AdSlot from "@/components/AdSlot";

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        <Link
          href="/waec"
          className="w-full rounded-lg bg-navy px-10 py-4 text-lg font-semibold text-white transition active:scale-95 active:bg-navy-dark sm:w-auto"
        >
          WAEC
        </Link>
                <Link
          href="/jamb"
          className="w-full rounded-lg bg-navy px-10 py-4 text-lg font-semibold text-white transition active:scale-95 active:bg-navy-dark sm:w-auto"
        >
          UTME
        </Link>
        <Link
          href="/mock-exam"
          className="w-full rounded-lg bg-navy px-10 py-4 text-lg font-semibold text-white transition active:scale-95 active:bg-navy-dark sm:w-auto"
        >
          Take a Mock Exam
        </Link>
      </div>

      <Link
        href="/about"
        className="mt-10 inline-block font-serif text-lg italic text-navy underline underline-offset-4"
      >
        About Us
      </Link>

      <AdSlot slotKey="homepage" />
    </main>
  );
}