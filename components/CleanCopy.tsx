"use client";

import { useEffect } from "react";

// When someone copies from the exam content, put clean text on the clipboard
// (no boxes, borders or shading) so it pastes neatly into Word.
export default function CleanCopy() {
  useEffect(() => {
    const onCopy = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const element = node instanceof Element ? node : node.parentElement;
      if (!element || !element.closest(".exam-content")) return;

      const wrapper = document.createElement("div");
      wrapper.appendChild(range.cloneContents());

      wrapper.querySelectorAll("*").forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          const keep =
            (el.tagName === "IMG" && (attr.name === "src" || attr.name === "alt")) ||
            (el.tagName === "A" && attr.name === "href");
          if (!keep) el.removeAttribute(attr.name);
        });
      });

      event.clipboardData.setData("text/html", wrapper.innerHTML);
      event.clipboardData.setData("text/plain", selection.toString());
      event.preventDefault();
    };

    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, []);

  return null;
}