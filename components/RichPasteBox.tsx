"use client";

import { useEffect, useRef } from "react";

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U"]);
const BLOCK_TAGS = new Set(["DIV", "P", "LI", "TR"]);
const STRIP_TAGS = new Set(["STYLE", "SCRIPT", "HEAD", "META", "TITLE", "LINK"]);

// Converts pasted HTML into one clean string: plain text (escaped), line
// breaks as "\n", and only bold/italic/underline kept as real tags.
// This single function is the ONLY source of truth — both what's shown in
// the box and what the parser reads are derived from its output, so they
// can never drift apart.
function htmlToHybridText(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  function walk(node: ChildNode): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName;

    if (STRIP_TAGS.has(tag)) return ""; // Word metadata, scripts, etc — discard entirely
    if (tag === "BR") return "\n";

    const inner = Array.from(el.childNodes).map(walk).join("");

    if (BLOCK_TAGS.has(tag)) {
      if (inner.replace(/\u00A0/g, "").trim() === "") return ""; // skip empty spacer paragraphs
      return inner + "\n";
    }
    if (ALLOWED_TAGS.has(tag)) {
      const t = tag === "STRONG" ? "b" : tag === "EM" ? "i" : tag.toLowerCase();
      return `<${t}>${inner}</${t}>`;
    }
    return inner; // strip spans/fonts/links etc, keep their inner text
  }

  return Array.from(container.childNodes)
    .map(walk)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Hybrid text only ever contains escaped plain text + our own <b>/<i>/<u>
// tags + "\n" — so turning it into displayable HTML is just this one swap.
function hybridTextToHtml(hybrid: string): string {
  return hybrid.replace(/\n/g, "<br>");
}

export default function RichPasteBox({
  value,
  onChange,
  minHeightClass = "min-h-[200px]",
}: {
  value: string;
  onChange: (hybridText: string) => void;
  minHeightClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    // Only used to clear the box after saving — safe since it's reset to "".
    if (value !== lastValue.current && ref.current) {
      ref.current.innerHTML = "";
      lastValue.current = value;
    }
  }, [value]);

  const emitChange = () => {
    if (!ref.current) return;
    const hybrid = htmlToHybridText(ref.current.innerHTML);
    lastValue.current = hybrid;
    onChange(hybrid);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");
    const hybrid = html ? htmlToHybridText(html) : plain.trim();
    document.execCommand("insertHTML", false, hybridTextToHtml(hybrid));
    emitChange();
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onPaste={handlePaste}
      onInput={emitChange}
      className={`${minHeightClass} w-full whitespace-pre-wrap rounded-md border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy`}
    />
  );
}