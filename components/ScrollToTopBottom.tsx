"use client";

import { useEffect, useState } from "react";

export default function ScrollToTopBottom() {
  const [atBottom, setAtBottom] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolledPast = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      setAtBottom(scrolledPast > pageHeight - 200);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    window.scrollTo({
      top: atBottom ? 0 : document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
      className="fixed bottom-6 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-colors"
      style={{
        backgroundColor: pressed
          ? "var(--color-navy)"
          : "color-mix(in srgb, var(--color-navy) 15%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-navy) 35%, transparent)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={pressed ? "white" : "var(--color-navy)"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {atBottom ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
      </svg>
    </button>
  );
}