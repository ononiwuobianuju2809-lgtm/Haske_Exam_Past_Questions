export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loader-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-navy motion-reduce:animate-none" />
      <p className="mt-3 text-sm font-medium text-black">Loading, please wait...</p>
    </div>
  );
}