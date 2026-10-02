import AdSlot from "@/components/AdSlot";


export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-6">
        About Haske International Tutors
      </h1>
      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          Haske International Tutors is an educational platform created to
          make quality WAEC and JAMB examination resources more accessible to
          Nigerian students. Our platform brings together an extensive
          collection of past questions and answers from different
          examination years, helping students study with materials that
          reflect the questions they are likely to encounter in their
          examinations.
        </p>
        <p>
          Beyond past questions, we provide carefully structured mock
          examinations designed around the format and standards of WAEC and
          JAMB. These examinations are timed to give students the
          opportunity to practise under conditions that closely reflect the
          demands of the actual examination.
        </p>
        <p>
          Our search system also allows students to locate questions by
          subject and topic, making it easier to concentrate on particular
          areas of study and address gaps in understanding. Rather than
          searching through large volumes of materials for relevant
          questions, students can focus their preparation more directly and
          efficiently.
        </p>
        <p>
          At Haske International Tutors, our goal is to provide a
          well-organised and accessible examination preparation platform
          where students can find the resources they need, practise their
          knowledge, and prepare with greater confidence for WAEC, JAMB, and
          other important academic examinations.
        </p>
      </div>

      <AdSlot slotKey="about" />
    </main>
  );
}