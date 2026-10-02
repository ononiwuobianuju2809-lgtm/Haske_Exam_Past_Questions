import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="w-full border-b border-gray-200 px-4 py-4">
      <p className="text-center text-lg font-bold sm:text-xl md:text-2xl">
        <Link href="/" className="text-foreground transition hover:text-navy">
          Haske International Tutors: WAEC and JAMB Past Questions
        </Link>
      </p>
    </header>
  );
}