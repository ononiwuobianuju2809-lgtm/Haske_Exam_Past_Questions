"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const isTyping = useRef(false);
  const [, forceUpdate] = useState(0);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const press = (name: string) => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    setPressedBtn(name);
  };
  const release = () => {
    releaseTimer.current = setTimeout(() => setPressedBtn(null), 150);
  };

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => {
      isTyping.current = true; // this change came from you typing, not from loading a question
      onChange(editor.getHTML());
      forceUpdate((n) => n + 1);
    },
    onSelectionUpdate: () => forceUpdate((n) => n + 1),
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] w-full rounded-md border border-gray-300 px-4 py-3 text-base leading-relaxed focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30",
      },
    },
  });

  // Keep the box in sync with outside changes (loading a question to edit,
  // or clearing after save) — but never while you're actively typing
  useEffect(() => {
    if (!editor) return;
    if (isTyping.current) {
      isTyping.current = false;
      return;
    }
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const toolbarBtnClass = (isActive: boolean, isPressed: boolean) =>
    `min-w-[40px] rounded-md border px-3 py-2 text-sm font-semibold transition duration-150 ${
      isPressed ? "scale-95" : ""
    } ${
      isActive
        ? `border-navy text-white ${isPressed ? "bg-navy-dark" : "bg-navy"}`
        : `border-gray-300 text-foreground ${isPressed ? "bg-gray-100" : "bg-white"}`
    }`;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          onPointerDown={() => press("bold")}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          className={toolbarBtnClass(editor?.isActive("bold") ?? false, pressedBtn === "bold")}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          onPointerDown={() => press("italic")}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          className={`${toolbarBtnClass(editor?.isActive("italic") ?? false, pressedBtn === "italic")} italic`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          onPointerDown={() => press("underline")}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          className={`${toolbarBtnClass(editor?.isActive("underline") ?? false, pressedBtn === "underline")} underline`}
        >
          U
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}