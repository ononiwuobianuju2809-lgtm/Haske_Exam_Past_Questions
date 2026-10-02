import AdSlot from "@/components/AdSlot";

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-6">Contact Us</h1>
      <p className="text-gray-700 mb-4">
        For enquiries, questions, or support, you can contact us through:
      </p>
      <ul className="space-y-2 text-gray-700">
                <li>
          Email:{" "}
          <a href="mailto:ononiwuobianuju2809@gmail.com" className="text-navy underline">
            ononiwuobianuju2809@gmail.com
          </a>
          ,{" "}
          <a href="mailto:munzahaske@gmail.com" className="text-navy underline">
            munzahaske@gmail.com
          </a>
        </li>
        <li>
          Phone:{" "}
          <a href="tel:07049057400" className="text-navy underline">
            07049057400
          </a>
          ,{" "}
          <a href="tel:07042337232" className="text-navy underline">
            07042337232
          </a>
        </li>
      </ul>

      <AdSlot slotKey="contact" />
    </main>
  );
}