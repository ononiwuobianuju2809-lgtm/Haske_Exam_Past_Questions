"use client";
import Link from "next/link";
import { useRef, useState } from "react";

const NAV_LINKS = [
  { label: "WAEC", href: "/waec" },
  { label: "UTME", href: "/jamb" },
  { label: "Search by Topic", href: "/search" },
  { label: "Take a Mock Exam", href: "/mock-exam" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Contact a Tutor", href: "/contact-tutor" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const press = () => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    setPressed(true);
  };
  const release = () => {
    releaseTimer.current = setTimeout(() => setPressed(false), 150);
  };

    return (
    <nav className="relative border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-end px-4 py-3 sm:justify-center">
        <div className="hidden gap-6 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-1 text-sm font-medium text-foreground transition hover:bg-gray-100 active:bg-gray-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          aria-label={open ? "Close menu" : "Open menu"}
          className={`flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-lg text-foreground transition duration-150 sm:hidden ${
            pressed ? "scale-95 bg-gray-100" : "bg-white"
          }`}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 flex flex-col gap-1 border-t border-gray-200 bg-white px-4 py-3 shadow-md sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-foreground transition active:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}