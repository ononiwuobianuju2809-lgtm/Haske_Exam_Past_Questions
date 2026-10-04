"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Shows the loading cover the moment a link is tapped, before the next page has
// started to arrive, and blocks further taps until it does.
export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setLoading(true);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Safety: never leave the cover up forever if a page change doesn't happen.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="nav-loader-overlay fixed inset-0 z-[110] flex flex-col items-center justify-center"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-navy motion-reduce:animate-none" />
      <p className="mt-3 text-sm font-medium text-black">Loading, please wait...</p>
    </div>
  );
}